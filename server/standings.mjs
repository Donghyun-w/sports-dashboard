const STANDINGS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const standingsCache = new Map();

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function fetchNbaStandings() {
  try {
    const res = await fetch('https://site.api.espn.com/apis/v2/sports/basketball/nba/standings', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) throw new Error(`ESPN NBA Standings HTTP ${res.status}`);
    const data = await res.json();

    const groups = (data.children ?? []).map((conf) => {
      const confName = conf.name;
      const entries = conf.standings?.entries ?? [];

      const rows = entries.map((entry) => {
        const teamName = entry.team?.displayName || entry.team?.name || 'Team';
        const abbr = entry.team?.abbreviation || '';
        const statsMap = Object.fromEntries((entry.stats ?? []).map((s) => [s.name, s.displayValue]));

        const seed = statsMap.playoffSeed || statsMap.rank || '-';
        const wins = statsMap.wins || '0';
        const losses = statsMap.losses || '0';
        const winPct = statsMap.winPercent || '-';
        const gb = statsMap.gamesBehind === '0' || statsMap.gamesBehind === '-' ? '-' : statsMap.gamesBehind;
        const streak = statsMap.streak || '-';
        const l10 = statsMap['Last Ten Games'] || '-';
        const diff = statsMap.pointDifferential || '-';

        return {
          rank: seed,
          team: teamName,
          abbr,
          wins,
          losses,
          winPct,
          gb,
          diff,
          streak,
          l10,
        };
      });

      // Sort by rank numeric ascending
      rows.sort((a, b) => (Number(a.rank) || 99) - (Number(b.rank) || 99));

      return {
        groupName: confName,
        headers: ['Rank', 'Team', 'W', 'L', 'PCT', 'GB', 'DIFF', 'L10', 'STREAK'],
        rows,
      };
    });

    return {
      league: 'NBA',
      title: 'NBA Regular Season Standings',
      lastUpdated: new Date().toISOString(),
      groups,
    };
  } catch (error) {
    console.error('fetchNbaStandings error:', error?.message || error);
    return null;
  }
}

export async function fetchNflStandings() {
  try {
    const res = await fetch('https://site.api.espn.com/apis/v2/sports/football/nfl/standings', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) throw new Error(`ESPN NFL Standings HTTP ${res.status}`);
    const data = await res.json();

    const groups = (data.children ?? []).map((conf) => {
      const confName = conf.name;
      const entries = conf.standings?.entries ?? [];

      const rows = entries.map((entry) => {
        const teamName = entry.team?.displayName || entry.team?.name || 'Team';
        const abbr = entry.team?.abbreviation || '';
        const statsMap = Object.fromEntries((entry.stats ?? []).map((s) => [s.name, s.displayValue]));

        const seed = statsMap.playoffSeed || statsMap.rank || '-';
        const wins = statsMap.wins || '0';
        const losses = statsMap.losses || '0';
        const ties = statsMap.ties || '0';
        const winPct = statsMap.winPercent || '-';
        const gb = statsMap.gamesBehind === '0' || statsMap.gamesBehind === '-' ? '-' : statsMap.gamesBehind;
        const diff = statsMap.pointDifferential || '-';
        const streak = statsMap.streak || '-';

        return {
          rank: seed,
          team: teamName,
          abbr,
          wins,
          losses,
          ties,
          winPct,
          gb,
          diff,
          streak,
        };
      });

      rows.sort((a, b) => (Number(a.rank) || 99) - (Number(b.rank) || 99));

      return {
        groupName: confName,
        headers: ['Rank', 'Team', 'W', 'L', 'T', 'PCT', 'GB', 'DIFF', 'STREAK'],
        rows,
      };
    });

    return {
      league: 'NFL',
      title: 'NFL Conference Standings',
      lastUpdated: new Date().toISOString(),
      groups,
    };
  } catch (error) {
    console.error('fetchNflStandings error:', error?.message || error);
    return null;
  }
}

export async function fetchKboStandings() {
  try {
    const res = await fetch('https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) throw new Error(`KBO Standings HTTP ${res.status}`);
    const html = await res.text();

    const tableMatch = html.match(/<table[^>]*class=\"[^\"]*tData[^\"]*\"[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) throw new Error('KBO Standings table not found');

    const kboNameMap = {
      KT: { name: 'KT Wiz', abbr: 'KTW' },
      삼성: { name: 'Samsung Lions', abbr: 'SAM' },
      KIA: { name: 'KIA Tigers', abbr: 'KIA' },
      LG: { name: 'LG Twins', abbr: 'LGT' },
      두산: { name: 'Doosan Bears', abbr: 'DSB' },
      SSG: { name: 'SSG Landers', abbr: 'SSG' },
      롯데: { name: 'Lotte Giants', abbr: 'LOT' },
      한화: { name: 'Hanwha Eagles', abbr: 'HAN' },
      NC: { name: 'NC Dinos', abbr: 'NCD' },
      키움: { name: 'Kiwoom Heroes', abbr: 'KIW' },
    };

    const rowMatches = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    const rows = [];

    for (let i = 1; i < rowMatches.length; i++) {
      const cells = [...rowMatches[i][1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) =>
        decodeHtml(c[1].replace(/<[^>]+>/g, '').trim()),
      );

      if (cells.length >= 8) {
        const rawTeam = cells[1];
        const teamInfo = kboNameMap[rawTeam] || { name: rawTeam, abbr: rawTeam };

        rows.push({
          rank: cells[0],
          team: teamInfo.name,
          abbr: teamInfo.abbr,
          games: cells[2],
          wins: cells[3],
          losses: cells[4],
          ties: cells[5],
          winPct: cells[6],
          gb: cells[7] === '0' ? '-' : cells[7],
          streak: cells[9] || '-',
          l10: cells[8] || '-',
        });
      }
    }

    return {
      league: 'KBO',
      title: 'KBO Regular Season Standings',
      lastUpdated: new Date().toISOString(),
      groups: [
        {
          groupName: 'KBO Regular Season',
          headers: ['Rank', 'Team', 'GP', 'W', 'L', 'T', 'PCT', 'GB', 'L10', 'STREAK'],
          rows,
        },
      ],
    };
  } catch (error) {
    console.error('fetchKboStandings error:', error?.message || error);
    return null;
  }
}

export async function fetchUnifiedStandings(league = 'ALL') {
  const normLeague = (league || 'ALL').toUpperCase();
  const cacheKey = `standings:${normLeague}`;
  const cached = standingsCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  let standings = {};

  if (normLeague === 'NBA') {
    standings.NBA = await fetchNbaStandings();
  } else if (normLeague === 'NFL') {
    standings.NFL = await fetchNflStandings();
  } else if (normLeague === 'KBO') {
    standings.KBO = await fetchKboStandings();
  } else {
    // ALL
    const [nba, nfl, kbo] = await Promise.all([
      fetchNbaStandings(),
      fetchNflStandings(),
      fetchKboStandings(),
    ]);
    standings = { NBA: nba, NFL: nfl, KBO: kbo };
  }

  standingsCache.set(cacheKey, {
    expiresAt: Date.now() + STANDINGS_CACHE_TTL_MS,
    payload: standings,
  });

  return standings;
}

