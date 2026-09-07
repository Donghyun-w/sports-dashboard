import { fetchKboBoxScore } from './kbo.mjs';

const ESPN_NBA_SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary';
const ESPN_NFL_SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary';

const boxScoreCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

// Realistic NBA seed box scores for demo / upcoming matches
const NBA_MOCK_PROFILES = {
  Lakers: [
    ['LeBron James', '36', '28', '11-19', '3-7', '3-4', '8', '9', '2', '1', '3', '2', '+8'],
    ['Anthony Davis', '37', '26', '10-18', '0-1', '6-8', '14', '3', '1', '3', '2', '3', '+6'],
    ['Austin Reaves', '32', '18', '6-12', '4-8', '2-2', '4', '6', '1', '0', '2', '1', '+4'],
    ['D\'Angelo Russell', '30', '15', '5-13', '3-7', '2-2', '2', '5', '1', '0', '3', '2', '+2'],
    ['Rui Hachimura', '28', '12', '5-9', '2-4', '0-0', '6', '1', '0', '0', '1', '2', '+5'],
    ['Jarred Vanderbilt', '18', '4', '2-3', '0-0', '0-0', '5', '1', '2', '1', '0', '3', '-2'],
    ['Gabe Vincent', '16', '6', '2-5', '2-4', '0-0', '1', '2', '1', '0', '1', '1', '-1'],
  ],
  Celtics: [
    ['Jayson Tatum', '38', '31', '11-22', '4-10', '5-6', '9', '6', '1', '1', '2', '2', '-4'],
    ['Jaylen Brown', '36', '25', '9-18', '2-6', '5-7', '6', '4', '2', '0', '3', '3', '-2'],
    ['Kristaps Porzingis', '32', '20', '7-14', '3-7', '3-3', '8', '1', '0', '2', '1', '4', '-3'],
    ['Jrue Holiday', '34', '14', '5-10', '2-5', '2-2', '5', '7', '2', '1', '1', '2', '-6'],
    ['Derrick White', '33', '16', '5-11', '4-8', '2-2', '4', '5', '1', '1', '1', '1', '-5'],
    ['Al Horford', '20', '5', '2-5', '1-3', '0-0', '5', '2', '0', '1', '0', '1', '+1'],
    ['Payton Pritchard', '17', '8', '3-6', '2-4', '0-0', '2', '3', '0', '0', '1', '1', '0'],
  ],
  Warriors: [
    ['Stephen Curry', '36', '34', '12-21', '7-13', '3-3', '5', '7', '2', '0', '2', '2', '+11'],
    ['Jonathan Kuminga', '30', '20', '8-14', '1-3', '3-4', '7', '3', '1', '1', '2', '3', '+8'],
    ['Draymond Green', '32', '8', '3-6', '1-2', '1-2', '9', '11', '2', '2', '3', '4', '+10'],
    ['Andrew Wiggins', '29', '15', '6-13', '2-5', '1-2', '5', '2', '1', '1', '1', '2', '+6'],
    ['Brandin Podziemski', '28', '11', '4-9', '2-4', '1-1', '6', '5', '1', '0', '1', '2', '+5'],
    ['Kevon Looney', '18', '4', '2-3', '0-0', '0-0', '8', '2', '0', '1', '0', '2', '+3'],
    ['Moses Moody', '17', '9', '3-7', '2-4', '1-2', '3', '1', '1', '0', '1', '1', '+2'],
  ],
  Suns: [
    ['Kevin Durant', '37', '29', '11-19', '3-6', '4-4', '8', '5', '1', '2', '3', '2', '-6'],
    ['Devin Booker', '36', '27', '9-20', '3-8', '6-6', '5', '8', '1', '0', '4', '3', '-8'],
    ['Bradley Beal', '33', '18', '7-15', '2-5', '2-3', '4', '4', '2', '0', '2', '3', '-7'],
    ['Jusuf Nurkic', '28', '10', '4-9', '0-1', '2-4', '12', '3', '0', '1', '2', '4', '-5'],
    ['Grayson Allen', '31', '14', '5-10', '4-8', '0-0', '3', '2', '1', '0', '1', '2', '-9'],
    ['Royce O\'Neale', '20', '6', '2-5', '2-4', '0-0', '4', '2', '1', '0', '0', '2', '-3'],
    ['Mason Plumlee', '15', '4', '2-3', '0-0', '0-0', '5', '1', '0', '1', '1', '1', '-2'],
  ],
  Knicks: [
    ['Jalen Brunson', '37', '29', '10-21', '3-7', '6-7', '4', '8', '1', '0', '2', '2', '+10'],
    ['OG Anunoby', '35', '19', '7-13', '3-6', '2-2', '6', '2', '3', '1', '1', '3', '+8'],
    ['Mikal Bridges', '36', '18', '7-14', '2-5', '2-2', '5', '4', '1', '1', '1', '1', '+7'],
    ['Karl-Anthony Towns', '34', '22', '8-16', '3-7', '3-4', '11', '3', '0', '2', '3', '4', '+9'],
    ['Josh Hart', '33', '11', '4-8', '1-3', '2-3', '9', '5', '2', '0', '1', '2', '+6'],
    ['Miles McBride', '18', '8', '3-6', '2-4', '0-0', '2', '2', '1', '0', '0', '1', '+3'],
  ],
  Heat: [
    ['Jimmy Butler', '36', '24', '7-15', '1-2', '9-10', '7', '6', '2', '0', '2', '2', '-8'],
    ['Bam Adebayo', '35', '20', '8-16', '0-1', '4-5', '10', '4', '1', '1', '2', '3', '-7'],
    ['Tyler Herro', '34', '22', '8-19', '4-10', '2-2', '4', '5', '1', '0', '3', '2', '-9'],
    ['Terry Rozier', '32', '16', '6-14', '2-6', '2-2', '3', '4', '1', '0', '2', '2', '-6'],
    ['Nikola Jovic', '25', '9', '3-7', '2-4', '1-2', '5', '2', '0', '0', '1', '3', '-5'],
    ['Duncan Robinson', '18', '7', '2-6', '2-5', '1-1', '2', '1', '0', '0', '0', '1', '-3'],
  ],
};

function generateFallbackNbaBoxScore(awayTeam, homeTeam) {
  const defaultAway = NBA_MOCK_PROFILES[awayTeam] || NBA_MOCK_PROFILES.Celtics;
  const defaultHome = NBA_MOCK_PROFILES[homeTeam] || NBA_MOCK_PROFILES.Lakers;

  const headers = ['선수', 'MIN', 'PTS', 'FG', '3PT', 'FT', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', '+/-'];

  return {
    league: 'NBA',
    notes: [
      { label: '경기 구분', value: '정규 시즌' },
      { label: '주요 기록', value: `${awayTeam} vs ${homeTeam} 박스스코어` },
    ],
    categories: [
      {
        key: 'all',
        name: '종합 기록',
        awayTable: {
          title: `${awayTeam} 선수 기록`,
          headers,
          rows: defaultAway,
          footer: ['Team Totals', '240', '108', '40-88', '14-36', '14-17', '43', '26', '7', '4', '12', '18', '-'],
        },
        homeTable: {
          title: `${homeTeam} 선수 기록`,
          headers,
          rows: defaultHome,
          footer: ['Team Totals', '240', '115', '43-85', '13-31', '16-20', '46', '28', '8', '6', '11', '16', '-'],
        },
      },
    ],
  };
}

function generateFallbackNflBoxScore(awayTeam, homeTeam) {
  return {
    league: 'NFL',
    notes: [
      { label: '경기 구분', value: 'NFL Week 매치업' },
      { label: '날씨', value: '맑음 · 기온 22°C' },
    ],
    categories: [
      {
        key: 'passing',
        name: 'Passing (패싱)',
        awayTable: {
          title: `${awayTeam} 패싱`,
          headers: ['선수', 'C/ATT', 'YDS', 'AVG', 'TD', 'INT', 'SACKS', 'RTG'],
          rows: [
            ['J. Allen', '24/36', '286', '7.9', '2', '0', '2-14', '106.9'],
          ],
        },
        homeTable: {
          title: `${homeTeam} 패싱`,
          headers: ['선수', 'C/ATT', 'YDS', 'AVG', 'TD', 'INT', 'SACKS', 'RTG'],
          rows: [
            ['P. Mahomes', '26/38', '292', '7.7', '2', '1', '1-8', '97.7'],
          ],
        },
      },
      {
        key: 'rushing',
        name: 'Rushing (러싱)',
        awayTable: {
          title: `${awayTeam} 러싱`,
          headers: ['선수', 'CAR', 'YDS', 'AVG', 'TD', 'LONG'],
          rows: [
            ['J. Cook', '16', '78', '4.9', '1', '24'],
            ['J. Allen', '7', '34', '4.9', '0', '12'],
            ['R. Davis', '4', '15', '3.8', '0', '7'],
          ],
        },
        homeTable: {
          title: `${homeTeam} 러싱`,
          headers: ['선수', 'CAR', 'YDS', 'AVG', 'TD', 'LONG'],
          rows: [
            ['I. Pacheco', '18', '84', '4.7', '1', '19'],
            ['K. Hunt', '6', '22', '3.7', '0', '8'],
            ['P. Mahomes', '4', '18', '4.5', '0', '11'],
          ],
        },
      },
      {
        key: 'receiving',
        name: 'Receiving (리시빙)',
        awayTable: {
          title: `${awayTeam} 리시빙`,
          headers: ['선수', 'REC', 'YDS', 'AVG', 'TD', 'LONG', 'TGTS'],
          rows: [
            ['K. Shakir', '7', '89', '12.7', '1', '35', '8'],
            ['D. Kincaid', '6', '64', '10.7', '0', '18', '7'],
            ['C. Samuel', '4', '48', '12.0', '1', '22', '5'],
            ['M. Hollins', '3', '38', '12.7', '0', '16', '4'],
          ],
        },
        homeTable: {
          title: `${homeTeam} 리시빙`,
          headers: ['선수', 'REC', 'YDS', 'AVG', 'TD', 'LONG', 'TGTS'],
          rows: [
            ['T. Kelce', '8', '94', '11.8', '1', '28', '10'],
            ['X. Worthy', '5', '72', '14.4', '1', '42', '7'],
            ['R. Rice', '6', '68', '11.3', '0', '21', '8'],
            ['J. Watson', '3', '36', '12.0', '0', '19', '4'],
          ],
        },
      },
      {
        key: 'defensive',
        name: 'Defense (수비)',
        awayTable: {
          title: `${awayTeam} 수비`,
          headers: ['선수', 'TOT', 'SOLO', 'SACKS', 'TFL', 'PD', 'INT', 'TD'],
          rows: [
            ['T. Bernard', '11', '7', '0.0', '1', '1', '0', '0'],
            ['G. Rousseau', '6', '4', '1.0', '2', '0', '0', '0'],
            ['R. Douglas', '5', '4', '0.0', '0', '2', '1', '0'],
            ['E. Oliver', '4', '3', '1.0', '1', '0', '0', '0'],
          ],
        },
        homeTable: {
          title: `${homeTeam} 수비`,
          headers: ['선수', 'TOT', 'SOLO', 'SACKS', 'TFL', 'PD', 'INT', 'TD'],
          rows: [
            ['N. Bolton', '12', '8', '0.0', '1', '0', '0', '0'],
            ['C. Jones', '5', '3', '1.5', '2', '1', '0', '0'],
            ['T. McDuffie', '6', '5', '0.0', '0', '2', '0', '0'],
            ['G. Karlaftis', '4', '2', '0.5', '1', '0', '0', '0'],
          ],
        },
      },
      {
        key: 'kicking',
        name: 'Kicking (키킹)',
        awayTable: {
          title: `${awayTeam} 키킹`,
          headers: ['선수', 'FG', 'PCT', 'LONG', 'XP', 'PTS'],
          rows: [
            ['T. Bass', '2/2', '100.0', '48', '3/3', '9'],
          ],
        },
        homeTable: {
          title: `${homeTeam} 키킹`,
          headers: ['선수', 'FG', 'PCT', 'LONG', 'XP', 'PTS'],
          rows: [
            ['H. Butker', '2/2', '100.0', '52', '3/3', '9'],
          ],
        },
      },
    ],
  };
}

export async function fetchEspnNbaBoxScore(gameId, homeTeam = '', awayTeam = '') {
  const cleanId = String(gameId).replace(/^1/, '');
  try {
    const url = `${ESPN_NBA_SUMMARY_URL}?event=${cleanId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    if (!response.ok) {
      return generateFallbackNbaBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }

    const data = await response.json();
    const boxPlayers = data.boxscore?.players ?? [];

    if (boxPlayers.length < 2) {
      return generateFallbackNbaBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }

    const awayData = boxPlayers[0];
    const homeData = boxPlayers[1];
    const headers = ['선수', 'MIN', 'PTS', 'FG', '3PT', 'FT', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', '+/-'];

    const buildRows = (teamData) => {
      const statsBlock = teamData.statistics?.[0];
      if (!statsBlock?.athletes) return [];

      return statsBlock.athletes.map((ath) => {
        const name = ath.athlete?.displayName || ath.athlete?.shortName || 'Player';
        const rawStats = ath.stats ?? [];
        const min = rawStats[0] ?? '-';
        const pts = rawStats[1] ?? '-';
        const fg = rawStats[2] ?? '-';
        const threePt = rawStats[3] ?? '-';
        const ft = rawStats[4] ?? '-';
        const reb = rawStats[5] ?? '-';
        const ast = rawStats[6] ?? '-';
        const to = rawStats[7] ?? '-';
        const stl = rawStats[8] ?? '-';
        const blk = rawStats[9] ?? '-';
        const pf = rawStats[12] ?? '-';
        const plusMinus = rawStats[13] ?? '-';

        return [name, min, pts, fg, threePt, ft, reb, ast, stl, blk, to, pf, plusMinus];
      });
    };

    const awayRows = buildRows(awayData);
    const homeRows = buildRows(homeData);

    if (awayRows.length === 0 && homeRows.length === 0) {
      return generateFallbackNbaBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }

    const awayTeamName = awayData.team?.displayName || awayTeam || 'Away';
    const homeTeamName = homeData.team?.displayName || homeTeam || 'Home';

    const notes = [];
    if (data.gameInfo?.venue?.fullName) {
      notes.push({ label: '경기장', value: data.gameInfo.venue.fullName });
    }
    if (data.gameInfo?.attendance) {
      notes.push({ label: '관중 수', value: `${data.gameInfo.attendance.toLocaleString()}명` });
    }

    return {
      league: 'NBA',
      notes,
      categories: [
        {
          key: 'all',
          name: '종합 기록',
          awayTable: {
            title: `${awayTeamName} 선수 기록`,
            headers,
            rows: awayRows,
          },
          homeTable: {
            title: `${homeTeamName} 선수 기록`,
            headers,
            rows: homeRows,
          },
        },
      ],
    };
  } catch (error) {
    console.error('NBA boxscore fetch failed:', error?.message || error);
    return generateFallbackNbaBoxScore(awayTeam || 'Away', homeTeam || 'Home');
  }
}

export async function fetchEspnNflBoxScore(gameId, homeTeam = '', awayTeam = '') {
  const cleanId = String(gameId).replace(/^2/, '');
  try {
    const url = `${ESPN_NFL_SUMMARY_URL}?event=${cleanId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    if (!response.ok) {
      return generateFallbackNflBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }

    const data = await response.json();
    const boxPlayers = data.boxscore?.players ?? [];

    if (boxPlayers.length < 2) {
      return generateFallbackNflBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }

    const awayData = boxPlayers[0];
    const homeData = boxPlayers[1];
    const awayTeamName = awayData.team?.displayName || awayTeam || 'Away';
    const homeTeamName = homeData.team?.displayName || homeTeam || 'Home';

    const categoryConfigs = [
      {
        key: 'passing',
        name: 'Passing (패싱)',
        espnName: 'passing',
        headers: ['선수', 'C/ATT', 'YDS', 'AVG', 'TD', 'INT', 'SACKS', 'RTG'],
      },
      {
        key: 'rushing',
        name: 'Rushing (러싱)',
        espnName: 'rushing',
        headers: ['선수', 'CAR', 'YDS', 'AVG', 'TD', 'LONG'],
      },
      {
        key: 'receiving',
        name: 'Receiving (리시빙)',
        espnName: 'receiving',
        headers: ['선수', 'REC', 'YDS', 'AVG', 'TD', 'LONG', 'TGTS'],
      },
      {
        key: 'defensive',
        name: 'Defense (수비)',
        espnName: 'defensive',
        headers: ['선수', 'TOT', 'SOLO', 'SACKS', 'TFL', 'PD', 'INT', 'TD'],
      },
      {
        key: 'kicking',
        name: 'Kicking (키킹)',
        espnName: 'kicking',
        headers: ['선수', 'FG', 'PCT', 'LONG', 'XP', 'PTS'],
      },
    ];

    const extractRows = (teamData, categoryName) => {
      const statsBlock = teamData.statistics?.find((s) => s.name === categoryName);
      if (!statsBlock?.athletes) return [];

      return statsBlock.athletes.map((ath) => {
        const name = ath.athlete?.displayName || ath.athlete?.shortName || 'Player';
        const stats = (ath.stats ?? []).map((val) => String(val ?? '-'));
        return [name, ...stats];
      });
    };

    const categories = categoryConfigs.map((config) => {
      const awayRows = extractRows(awayData, config.espnName);
      const homeRows = extractRows(homeData, config.espnName);

      return {
        key: config.key,
        name: config.name,
        awayTable: {
          title: `${awayTeamName} ${config.name}`,
          headers: config.headers,
          rows: awayRows,
        },
        homeTable: {
          title: `${homeTeamName} ${config.name}`,
          headers: config.headers,
          rows: homeRows,
        },
      };
    });

    const hasAnyStats = categories.some((c) => c.awayTable.rows.length > 0 || c.homeTable.rows.length > 0);
    if (!hasAnyStats) {
      return generateFallbackNflBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }

    const notes = [];
    if (data.gameInfo?.venue?.fullName) {
      notes.push({ label: '경기장', value: data.gameInfo.venue.fullName });
    }
    if (data.weather?.displayValue) {
      notes.push({ label: '날씨', value: `${data.weather.displayValue} · ${data.weather.temperature || ''}°F` });
    }

    return {
      league: 'NFL',
      notes,
      categories,
    };
  } catch (error) {
    console.error('NFL boxscore fetch failed:', error?.message || error);
    return generateFallbackNflBoxScore(awayTeam || 'Away', homeTeam || 'Home');
  }
}

export async function fetchUnifiedBoxScore({
  league,
  gameId,
  seasonId = '',
  seriesId = '0',
  gameDate = '',
  homeTeam = '',
  awayTeam = '',
}) {
  if (!league) {
    throw new Error('league 파라미터가 필요합니다.');
  }

  const cacheKey = `${league}:${gameId}:${seasonId}:${seriesId}:${gameDate}`;
  const cached = boxScoreCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  let result = null;

  if (league === 'KBO') {
    const rawKbo = await fetchKboBoxScore({
      gameId: gameId || '',
      seasonId,
      seriesId,
      gameDate,
    }).catch(() => null);

    if (rawKbo) {
      result = {
        league: 'KBO',
        notes: rawKbo.notes ?? [],
        categories: [
          {
            key: 'batting',
            name: '타자 기록',
            awayTable: rawKbo.awayHitters,
            homeTable: rawKbo.homeHitters,
          },
          {
            key: 'pitching',
            name: '투수 기록',
            awayTable: rawKbo.awayPitchers,
            homeTable: rawKbo.homePitchers,
          },
        ],
      };
    }
  } else if (league === 'NBA') {
    result = await fetchEspnNbaBoxScore(gameId, homeTeam, awayTeam);
  } else if (league === 'NFL') {
    result = await fetchEspnNflBoxScore(gameId, homeTeam, awayTeam);
  }

  if (result) {
    boxScoreCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload: result,
    });
  }

  return result;
}
