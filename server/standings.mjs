const STANDINGS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const standingsCache = new Map();

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
  } else {
    const [nba, nfl] = await Promise.all([
      fetchNbaStandings(),
      fetchNflStandings(),
    ]);
    standings = { NBA: nba, NFL: nfl };
  }

  standingsCache.set(cacheKey, {
    expiresAt: Date.now() + STANDINGS_CACHE_TTL_MS,
    payload: standings,
  });

  return standings;
}

