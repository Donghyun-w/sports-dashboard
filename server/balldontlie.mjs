const BASE_URL = 'https://api.balldontlie.io';
const ESPN_NBA_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ESPN_NFL_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

function withArrayParams(searchParams, key, values) {
  values.forEach((value) => {
    searchParams.append(`${key}[]`, String(value));
  });
}

async function fetchJson(path, params, apiKey) {
  const url = new URL(path, BASE_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      withArrayParams(url.searchParams, key, value);
      return;
    }

    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BALLDONTLIE request failed (${response.status}): ${text || response.statusText}`);
  }

  return response.json();
}

async function fetchEspnScoreboardEvents(scoreboardUrl, offsets = [0]) {
  try {
    const requests = offsets.map(async (offset) => {
      const url = new URL(scoreboardUrl);
      const dateKey = toLocalDateString(addDays(new Date(), offset)).replaceAll('-', '');
      url.searchParams.set('dates', dateKey);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.events ?? [];
    });

    const events = (await Promise.all(requests)).flat();
    return Array.from(new Map(events.map((event) => [event.id, event])).values());
  } catch (error) {
    console.error('ESPN scoreboard fetch error:', error?.message || error);
    return [];
  }
}

export async function fetchEspnNbaScoreboard() {
  return fetchEspnScoreboardEvents(ESPN_NBA_SCOREBOARD_URL, [0, 1]);
}

export async function fetchEspnNflScoreboard() {
  return fetchEspnScoreboardEvents(ESPN_NFL_SCOREBOARD_URL);
}

function toLocalDateString(date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNflSeasonYear(today) {
  const month = today.getUTCMonth() + 1;
  const year = today.getUTCFullYear();
  return month >= 8 ? year : year - 1;
}

function getNflWeek(today, season) {
  const kickoffWindowStart = new Date(Date.UTC(season, 8, 7));
  const daysUntilThursday = (4 - kickoffWindowStart.getUTCDay() + 7) % 7;
  const seasonKickoff = addDays(kickoffWindowStart, daysUntilThursday);
  const elapsedWeeks = Math.floor((today.getTime() - seasonKickoff.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(18, Math.max(1, elapsedWeeks + 1));
}

function getNflWeekWindow(today, season) {
  const currentWeek = getNflWeek(today, season);
  const firstWeek = Math.max(1, currentWeek - 2);
  const lastWeek = Math.min(18, currentWeek + 2);
  return Array.from({ length: lastWeek - firstWeek + 1 }, (_, index) => firstWeek + index);
}

export async function fetchNbaGames(apiKey, today = new Date()) {
  if (!apiKey) {
    return { data: [] };
  }
  const startDate = toLocalDateString(addDays(today, -14));
  const endDate = toLocalDateString(addDays(today, 14));

  return fetchJson('/v1/games', { start_date: startDate, end_date: endDate, per_page: 100 }, apiKey);
}

export async function fetchNflGames(apiKey, today = new Date()) {
  if (!apiKey) {
    return { data: [] };
  }
  const season = getNflSeasonYear(today);
  return fetchJson('/nfl/v1/games', { seasons: [season], weeks: getNflWeekWindow(today, season), per_page: 100 }, apiKey);
}
