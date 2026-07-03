const BASE_URL = 'https://api.balldontlie.io';

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
    throw new Error(`BALLDONTLIE 요청 실패 (${response.status}): ${text || response.statusText}`);
  }

  return response.json();
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

export async function fetchNbaGames(apiKey, today = new Date()) {
  const startDate = toLocalDateString(addDays(today, -14));
  const endDate = toLocalDateString(addDays(today, 7));

  return fetchJson('/v1/games', { start_date: startDate, end_date: endDate, per_page: 100 }, apiKey);
}

export async function fetchNflGames(apiKey, today = new Date()) {
  const season = getNflSeasonYear(today);
  return fetchJson('/nfl/v1/games', { seasons: [season, season + 1], weeks: [1, 2, 3, 4, 5, 6], per_page: 100 }, apiKey);
}
