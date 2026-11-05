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

function mockProfileFor(teamName) {
  const raw = String(teamName || '').trim();
  if (!raw) return null;
  if (NBA_MOCK_PROFILES[raw]) return NBA_MOCK_PROFILES[raw];
  const hit = Object.entries(NBA_MOCK_PROFILES).find(([key]) => raw.toLowerCase().includes(key.toLowerCase()));
  return hit?.[1] ?? null;
}

function generateFallbackNbaBoxScore(awayTeam, homeTeam) {
  return {
    league: 'NBA',
    notes: [
      { label: 'Box Score Status', value: 'Live ESPN player statistics are not available yet.' },
      { label: 'Matchup', value: `${awayTeam} vs ${homeTeam}` },
    ],
    categories: [
      {
        key: 'unavailable',
        name: 'Player Stats Pending',
        awayTable: {
          title: `${awayTeam} Player Stats`,
          headers: ['Status'],
          rows: [['Loading live player statistics.']],
        },
        homeTable: {
          title: `${homeTeam} Player Stats`,
          headers: ['Status'],
          rows: [['Loading live player statistics.']],
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

function generateUnavailableNflBoxScore(awayTeam, homeTeam) {
  return {
    league: 'NFL',
    notes: [
      { label: 'Box Score Status', value: 'Live NFL player statistics are not available yet.' },
      { label: 'Matchup', value: `${awayTeam} vs ${homeTeam}` },
    ],
    categories: [
      {
        key: 'unavailable',
        name: 'Player Stats Pending',
        awayTable: {
          title: `${awayTeam} Player Stats`,
          headers: ['Status'],
          rows: [['Loading live player statistics.']],
        },
        homeTable: {
          title: `${homeTeam} Player Stats`,
          headers: ['Status'],
          rows: [['Loading live player statistics.']],
        },
      },
    ],
  };
}

function ymdInTimeZone(date, timeZone) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone }).format(date).replace(/-/g, '');
}

function nearbyScoreboardDates(gameDate = '') {
  const dates = new Set();
  const cleanDate = String(gameDate || '').replace(/-/g, '');
  if (/^\d{8}$/.test(cleanDate)) {
    dates.add(cleanDate);
    const utc = new Date(`${cleanDate.slice(0, 4)}-${cleanDate.slice(4, 6)}-${cleanDate.slice(6, 8)}T12:00:00Z`);
    const prev = new Date(utc);
    prev.setUTCDate(prev.getUTCDate() - 1);
    const next = new Date(utc);
    next.setUTCDate(next.getUTCDate() + 1);
    dates.add(ymdInTimeZone(prev, 'UTC'));
    dates.add(ymdInTimeZone(next, 'UTC'));
  }
  const now = new Date();
  dates.add(ymdInTimeZone(now, 'America/New_York'));
  const nyYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  dates.add(ymdInTimeZone(nyYesterday, 'America/New_York'));
  return [...dates];
}

function teamTokens(name, abbr) {
  return [name, abbr]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
}

function teamMatches(team, name, abbr) {
  if (!team) return false;
  const needles = teamTokens(name, abbr);
  if (needles.length === 0) return false;
  const haystack = [team.displayName, team.name, team.shortDisplayName, team.abbreviation, team.nickname]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
  return needles.some((needle) => haystack.some((value) => value.includes(needle) || needle.includes(value)));
}

function findBoxScoreTeam(boxPlayers, competitor, teamName, teamAbbr) {
  const expectedTeamId = competitor?.team?.id;

  if (expectedTeamId) {
    const idMatch = boxPlayers.find((entry) => String(entry.team?.id) === String(expectedTeamId));
    if (idMatch) return idMatch;
  }

  return boxPlayers.find((entry) => teamMatches(entry.team, teamName, teamAbbr)) ?? null;
}

async function lookupEspnNbaEventId(homeTeam, awayTeam, gameDate = '', homeAbbr = '', awayAbbr = '') {
  const urls = [
    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    ...nearbyScoreboardDates(gameDate).map((date) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date}`),
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const events = data.events ?? [];

      for (const ev of events) {
        const comp = ev.competitions?.[0];
        const h = comp?.competitors?.find((c) => c.homeAway === 'home')?.team;
        const a = comp?.competitors?.find((c) => c.homeAway === 'away')?.team;
        if (teamMatches(h, homeTeam, homeAbbr) && teamMatches(a, awayTeam, awayAbbr)) {
          return ev.id;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

async function lookupEspnNflEventId(homeTeam, awayTeam, gameDate = '', homeAbbr = '', awayAbbr = '') {
  const urls = [
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    ...nearbyScoreboardDates(gameDate).map((date) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${date}`),
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers: espnHeaders() });
      if (!response.ok) continue;
      const data = await response.json();

      for (const event of data.events ?? []) {
        const competitors = event.competitions?.[0]?.competitors ?? [];
        const home = competitors.find((competitor) => competitor.homeAway === 'home')?.team;
        const away = competitors.find((competitor) => competitor.homeAway === 'away')?.team;
        if (teamMatches(home, homeTeam, homeAbbr) && teamMatches(away, awayTeam, awayAbbr)) {
          return event.id;
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

function resolveNbaEventId(gameId) {
  const raw = String(gameId ?? '').trim();
  if (!raw) return '';
  if (/^401\d+$/.test(raw)) return raw;
  const prefixed = raw.match(/^1(401\d+)$/);
  if (prefixed) return prefixed[1];
  return raw.replace(/^1/, '');
}

function resolveNflEventId(gameId) {
  const raw = String(gameId ?? '').trim();
  if (!raw) return '';
  if (/^401\d+$/.test(raw)) return raw;
  const prefixed = raw.match(/^2(401\d+)$/);
  if (prefixed) return prefixed[1];
  return '';
}

function espnHeaders() {
  return { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' };
}

async function fetchEspnNbaSummary(eventId) {
  if (!eventId) return { ok: false, data: null };
  const response = await fetch(`${ESPN_NBA_SUMMARY_URL}?event=${eventId}`, { headers: espnHeaders() });
  if (!response.ok) return { ok: false, data: null };
  return { ok: true, data: await response.json() };
}

function hasNbaPlayerRows(data) {
  const players = data?.boxscore?.players ?? [];
  return players.some((team) => (team.statistics ?? []).some((block) => (block.athletes ?? []).length > 0));
}

function pickStat(keys, labels, stats, keyNames, labelNames, fallbackIndex) {
  const keyList = Array.isArray(keys) ? keys : [];
  const labelList = Array.isArray(labels) ? labels : [];
  for (const key of keyNames) {
    const index = keyList.indexOf(key);
    if (index >= 0 && stats[index] !== undefined && stats[index] !== '') return String(stats[index]);
  }
  for (const label of labelNames) {
    const index = labelList.findIndex((item) => String(item).toUpperCase() === label);
    if (index >= 0 && stats[index] !== undefined && stats[index] !== '') return String(stats[index]);
  }
  if (fallbackIndex >= 0 && stats[fallbackIndex] !== undefined && stats[fallbackIndex] !== '') {
    return String(stats[fallbackIndex]);
  }
  return '-';
}

function playerDisplayName(ath) {
  const athlete = ath?.athlete ?? {};
  return athlete.displayName || athlete.shortName || athlete.fullName || 'Player';
}

function nbaPlayerStatsBlock(teamData) {
  const blocks = teamData?.statistics ?? [];
  return blocks.find((block) => (block.athletes ?? []).length > 0) ?? blocks[0];
}

export async function fetchEspnNbaBoxScore(gameId, homeTeam = '', awayTeam = '', gameDate = '', homeAbbr = '', awayAbbr = '') {
  let cleanId = resolveNbaEventId(gameId);
  try {
    let { ok, data } = await fetchEspnNbaSummary(cleanId);

    if ((!ok || !hasNbaPlayerRows(data)) && (homeTeam || awayTeam || homeAbbr || awayAbbr)) {
      const lookedUpId = await lookupEspnNbaEventId(homeTeam, awayTeam, gameDate, homeAbbr, awayAbbr);
      if (lookedUpId && String(lookedUpId) !== String(cleanId)) {
        const lookedUp = await fetchEspnNbaSummary(lookedUpId);
        if (lookedUp.ok) {
          cleanId = lookedUpId;
          ok = lookedUp.ok;
          data = lookedUp.data;
        }
      }
    }

    if (!ok || !data) {
      return generateFallbackNbaBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }

    const boxPlayers = data.boxscore?.players ?? [];
    const statusState = data.header?.competitions?.[0]?.status?.type?.state;
    const isPreGame = statusState === 'pre';

    const headers = ['Player', 'MIN', 'PTS', 'FG', '3PT', 'FT', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', '+/-'];

    const notes = [];
    if (data.gameInfo?.venue?.fullName) {
      notes.push({ label: 'Venue', value: data.gameInfo.venue.fullName });
    }
    if (data.gameInfo?.attendance) {
      notes.push({ label: 'Attendance', value: data.gameInfo.attendance.toLocaleString() });
    }
    if (data.header?.competitions?.[0]?.status?.type?.detail) {
      notes.push({ label: 'Game Status', value: data.header.competitions[0].status.type.detail });
    }

    // Match home and away teams accurately from competitors
    const competitors = data.header?.competitions?.[0]?.competitors ?? [];
    const homeComp = competitors.find((c) => c.homeAway === 'home');
    const awayComp = competitors.find((c) => c.homeAway === 'away');

    const homeId = homeComp?.team?.id || homeComp?.id;
    const awayId = awayComp?.team?.id || awayComp?.id;
    const awayData = findBoxScoreTeam(boxPlayers, awayComp, awayTeam, awayAbbr);
    const homeData = findBoxScoreTeam(boxPlayers, homeComp, homeTeam, homeAbbr);

    const awayTeamName = awayComp?.team?.displayName || awayData?.team?.displayName || awayTeam || 'Away';
    const homeTeamName = homeComp?.team?.displayName || homeData?.team?.displayName || homeTeam || 'Home';

    // 1. If match is finished or live with active player statistics
    if (!isPreGame && nbaPlayerStatsBlock(awayData)?.athletes?.length > 0 && nbaPlayerStatsBlock(homeData)?.athletes?.length > 0) {
      const buildRows = (teamData) => {
        const statsBlock = nbaPlayerStatsBlock(teamData);
        if (!statsBlock?.athletes) return [];

        const athleteRows = statsBlock.athletes.map((ath) => {
          const name = playerDisplayName(ath);
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

        athleteRows.sort((a, b) => {
          const minA = parseInt(a[1], 10) || 0;
          const minB = parseInt(b[1], 10) || 0;
          return minB - minA;
        });

        return athleteRows;
      };

      const buildFooter = (teamData) => {
        const statsBlock = nbaPlayerStatsBlock(teamData);
        const rawTotals = statsBlock?.totals ?? [];
        if (!rawTotals || rawTotals.length === 0) return undefined;

        const min = rawTotals[0] || '240';
        const pts = rawTotals[1] || '-';
        const fg = rawTotals[2] || '-';
        const threePt = rawTotals[3] || '-';
        const ft = rawTotals[4] || '-';
        const reb = rawTotals[5] || '-';
        const ast = rawTotals[6] || '-';
        const to = rawTotals[7] || '-';
        const stl = rawTotals[8] || '-';
        const blk = rawTotals[9] || '-';
        const pf = rawTotals[12] || '-';
        const plusMinus = rawTotals[13] || '-';

        return ['Team Totals', min, pts, fg, threePt, ft, reb, ast, stl, blk, to, pf, plusMinus];
      };

      const awayRows = buildRows(awayData);
      const homeRows = buildRows(homeData);
      const awayFooter = buildFooter(awayData);
      const homeFooter = buildFooter(homeData);

      return {
        league: 'NBA',
        notes,
        categories: [
          {
            key: 'all',
            name: 'Box Score',
            awayTable: {
              title: `${awayTeamName} Player Stats`,
              headers,
              rows: awayRows,
              footer: awayFooter,
            },
            homeTable: {
              title: `${homeTeamName} Player Stats`,
              headers,
              rows: homeRows,
              footer: homeFooter,
            },
          },
        ],
      };
    }

    // 2. Pre-game: provide rich matchup intelligence (Leaders + Team Season Stats)
    const leaders = data.leaders ?? [];
    const teamStats = data.boxscore?.teams ?? [];

    const getTeamLeaders = (isHome) => {
      const targetId = isHome ? homeId : awayId;
      const targetName = isHome ? homeTeamName : awayTeamName;
      const found = leaders.find((l) => (targetId ? String(l.team?.id) === String(targetId) : l.team?.displayName?.includes(targetName)));
      const lList = found?.leaders ?? [];

      const rows = [];
      lList.forEach((cat) => {
        const leader = cat.leaders?.[0];
        if (leader) {
          const athleteName = leader.athlete?.displayName || 'Player';
          const pos = leader.athlete?.position?.abbreviation || '-';
          const catName = cat.displayName === 'Points' ? 'Points (PTS)' : cat.displayName === 'Assists' ? 'Assists (AST)' : cat.displayName === 'Rebounds' ? 'Rebounds (REB)' : cat.displayName;
          const statVal = `${leader.displayValue} ${leader.mainStat?.label || ''}`;
          const summary = leader.summary || '-';
          rows.push([catName, athleteName, pos, statVal, summary]);
        }
      });

      return rows;
    };

    const getTeamStatsRows = (isHome) => {
      const targetId = isHome ? homeId : awayId;
      const targetName = isHome ? homeTeamName : awayTeamName;
      const found = teamStats.find((t) => (targetId ? String(t.team?.id) === String(targetId) : t.team?.displayName?.includes(targetName)));
      const stats = found?.statistics ?? [];

      return stats.map((s) => [s.label || s.name, s.displayValue || '-', s.description || s.name]);
    };

    const awayLeaderRows = getTeamLeaders(false);
    const homeLeaderRows = getTeamLeaders(true);
    const awayTeamStatRows = getTeamStatsRows(false);
    const homeTeamStatRows = getTeamStatsRows(true);

    const categories = [];

    if (awayLeaderRows.length > 0 || homeLeaderRows.length > 0) {
      categories.push({
        key: 'leaders',
        name: 'Season Leaders',
        awayTable: {
          title: `${awayTeamName} Leaders`,
          headers: ['Category', 'Player', 'POS', 'Season Stat', 'Detail'],
          rows: awayLeaderRows.length > 0 ? awayLeaderRows : [['Statistics pending', '-', '-', '-', '-']],
        },
        homeTable: {
          title: `${homeTeamName} Leaders`,
          headers: ['Category', 'Player', 'POS', 'Season Stat', 'Detail'],
          rows: homeLeaderRows.length > 0 ? homeLeaderRows : [['Statistics pending', '-', '-', '-', '-']],
        },
      });
    }

    if (awayTeamStatRows.length > 0 || homeTeamStatRows.length > 0) {
      categories.push({
        key: 'team-stats',
        name: 'Team Stats',
        awayTable: {
          title: `${awayTeamName} Team Stats`,
          headers: ['Metric', 'Value', 'Description'],
          rows: awayTeamStatRows,
        },
        homeTable: {
          title: `${homeTeamName} Team Stats`,
          headers: ['Metric', 'Value', 'Description'],
          rows: homeTeamStatRows,
        },
      });
    }

    if (categories.length === 0) {
      return generateFallbackNbaBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }

    notes.unshift({ label: 'Note', value: 'Pre-game preview statistics will switch to live box score data after tip-off.' });

    return {
      league: 'NBA',
      notes,
      categories,
    };
  } catch (error) {
    console.error('NBA boxscore fetch failed:', error?.message || error);
    return generateFallbackNbaBoxScore(awayTeam || 'Away', homeTeam || 'Home');
  }
}

export async function fetchEspnNflBoxScore(gameId, homeTeam = '', awayTeam = '', gameDate = '', homeAbbr = '', awayAbbr = '') {
  let cleanId = resolveNflEventId(gameId);
  try {
    let response = cleanId ? await fetch(`${ESPN_NFL_SUMMARY_URL}?event=${cleanId}`, { headers: espnHeaders() }) : null;

    if (!response?.ok) {
      const lookedUpId = await lookupEspnNflEventId(homeTeam, awayTeam, gameDate, homeAbbr, awayAbbr);
      if (lookedUpId) {
        cleanId = String(lookedUpId);
        response = await fetch(`${ESPN_NFL_SUMMARY_URL}?event=${cleanId}`, { headers: espnHeaders() });
      }
    }

    if (!response?.ok) {
      return generateUnavailableNflBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }

    const data = await response.json();
    const boxPlayers = data.boxscore?.players ?? [];

    if (boxPlayers.length < 2) {
      return generateUnavailableNflBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }

    const competitors = data.header?.competitions?.[0]?.competitors ?? [];
    const awayComp = competitors.find((competitor) => competitor.homeAway === 'away');
    const homeComp = competitors.find((competitor) => competitor.homeAway === 'home');
    const awayData = findBoxScoreTeam(boxPlayers, awayComp, awayTeam, awayAbbr);
    const homeData = findBoxScoreTeam(boxPlayers, homeComp, homeTeam, homeAbbr);

    if (!awayData || !homeData) {
      return generateUnavailableNflBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }
    const awayTeamName = awayData.team?.displayName || awayTeam || 'Away';
    const homeTeamName = homeData.team?.displayName || homeTeam || 'Home';

    const categoryConfigs = [
      {
        key: 'passing',
        name: 'Passing',
        espnName: 'passing',
        headers: ['Player', 'C/ATT', 'YDS', 'AVG', 'TD', 'INT', 'SACKS', 'RTG'],
      },
      {
        key: 'rushing',
        name: 'Rushing',
        espnName: 'rushing',
        headers: ['Player', 'CAR', 'YDS', 'AVG', 'TD', 'LONG'],
      },
      {
        key: 'receiving',
        name: 'Receiving',
        espnName: 'receiving',
        headers: ['Player', 'REC', 'YDS', 'AVG', 'TD', 'LONG', 'TGTS'],
      },
      {
        key: 'defensive',
        name: 'Defense',
        espnName: 'defensive',
        headers: ['Player', 'TOT', 'SOLO', 'SACKS', 'TFL', 'PD', 'INT', 'TD'],
      },
      {
        key: 'kicking',
        name: 'Kicking',
        espnName: 'kicking',
        headers: ['Player', 'FG', 'PCT', 'LONG', 'XP', 'PTS'],
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
      return generateUnavailableNflBoxScore(awayTeam || 'Away', homeTeam || 'Home');
    }

    const notes = [];
    if (data.gameInfo?.venue?.fullName) {
      notes.push({ label: 'Venue', value: data.gameInfo.venue.fullName });
    }
    if (data.weather?.displayValue) {
      notes.push({ label: 'Weather', value: `${data.weather.displayValue} · ${data.weather.temperature || ''}°F` });
    }

    return {
      league: 'NFL',
      notes,
      categories,
    };
  } catch (error) {
    console.error('NFL boxscore fetch failed:', error?.message || error);
    return generateUnavailableNflBoxScore(awayTeam || 'Away', homeTeam || 'Home');
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
  homeAbbr = '',
  awayAbbr = '',
}) {
  if (!league) {
    throw new Error('The league parameter is required.');
  }

  const cacheKey = `${league}:${gameId}:${seasonId}:${seriesId}:${gameDate}:${homeAbbr}:${awayAbbr}`;
  const cached = boxScoreCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  let result = null;

  if (league === 'NBA') {
    result = await fetchEspnNbaBoxScore(gameId, homeTeam, awayTeam, gameDate, homeAbbr, awayAbbr);
  } else if (league === 'NFL') {
    result = await fetchEspnNflBoxScore(gameId, homeTeam, awayTeam, gameDate, homeAbbr, awayAbbr);
  }

  if (result) {
    boxScoreCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload: result,
    });
  }

  return result;
}
