function formatDateLabel(dateString) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toSeoulDayKey(dateString) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString));
}

function resolveDateBucket(dateString) {
  const target = toSeoulDayKey(dateString);
  const today = toSeoulDayKey(new Date().toISOString());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(yesterdayDate);

  if (target === today) {
    return 'TODAY';
  }

  if (target === yesterday) {
    return 'YESTERDAY';
  }

  return target > today ? 'UPCOMING' : 'YESTERDAY';
}

function relativeUpdatedAt() {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
}

function normalizeStatus(status) {
  const lower = status.toLowerCase();

  if (lower.includes('final')) {
    return 'FINAL';
  }

  if (lower.includes('qtr') || lower.includes('half') || lower.includes('live') || lower.includes('ot')) {
    return 'LIVE';
  }

  return 'UPCOMING';
}

function buildNbaPeriod(game) {
  const normalizedStatus = normalizeStatus(game.status);

  if (normalizedStatus === 'LIVE') {
    return `${game.status}${game.time && game.time !== 'Final' ? ` · ${game.time}` : ''}`;
  }

  if (normalizedStatus === 'FINAL') {
    return '경기 종료';
  }

  return game.status;
}

function buildNflPeriod(game) {
  const normalizedStatus = normalizeStatus(game.status);

  if (normalizedStatus === 'FINAL') {
    return '경기 종료';
  }

  return game.status;
}

function sortMatches(a, b) {
  const statusRank = { LIVE: 0, UPCOMING: 1, FINAL: 2 };
  const statusDelta = statusRank[a.status] - statusRank[b.status];

  if (statusDelta !== 0) {
    return statusDelta;
  }

  return a.id - b.id;
}

function dayDiffFromToday(dateString) {
  const target = new Date(toSeoulDayKey(dateString));
  const today = new Date(toSeoulDayKey(new Date().toISOString()));
  const millisPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - today.getTime()) / millisPerDay);
}

function isScheduleWindow(dateString) {
  const diff = dayDiffFromToday(dateString);
  return diff >= -1 && diff <= 7;
}

export function transformNbaGames(payload) {
  return payload.data
    .map((game) => ({
      id: Number(`1${game.id}`),
      league: 'NBA',
      status: normalizeStatus(game.status),
      dateBucket: resolveDateBucket(game.datetime ?? game.date),
      startDate: game.datetime ?? game.date,
      homeAbbr: game.home_team.abbreviation,
      awayAbbr: game.visitor_team.abbreviation,
      homeTeam: game.home_team.name,
      awayTeam: game.visitor_team.name,
      homeScore: game.home_team_score ?? 0,
      awayScore: game.visitor_team_score ?? 0,
      period: buildNbaPeriod(game),
      startTime: formatDateLabel(game.datetime ?? game.date),
      venue: `${game.home_team.city} 홈경기`,
      headline:
        normalizeStatus(game.status) === 'LIVE'
          ? `${game.home_team.name} vs ${game.visitor_team.name} 실시간 진행 중`
          : `${game.visitor_team.name} @ ${game.home_team.name}`,
      summary:
        normalizeStatus(game.status) === 'FINAL'
          ? `${game.home_team.name} ${game.home_team_score} - ${game.visitor_team_score} ${game.visitor_team.name} 결과입니다.`
          : `${game.status} 상태의 NBA 경기입니다.`,
      keyStats: [
        { label: '1쿼터', value: `${game.visitor_q1 ?? 0} - ${game.home_q1 ?? 0}` },
        { label: '2쿼터', value: `${game.visitor_q2 ?? 0} - ${game.home_q2 ?? 0}` },
        { label: '3쿼터', value: `${game.visitor_q3 ?? 0} - ${game.home_q3 ?? 0}` },
        { label: '4쿼터', value: `${game.visitor_q4 ?? 0} - ${game.home_q4 ?? 0}` },
      ],
      lastUpdated: relativeUpdatedAt(),
    }))
    .filter((game) => isScheduleWindow(game.startDate))
    .sort(sortMatches);
}

export function transformNflGames(payload) {
  return payload.data
    .map((game) => ({
      id: Number(`2${game.id}`),
      league: 'NFL',
      status: normalizeStatus(game.status),
      dateBucket: resolveDateBucket(game.date),
      startDate: game.date,
      homeAbbr: game.home_team.abbreviation ?? game.home_team.code,
      awayAbbr: game.visitor_team.abbreviation ?? game.visitor_team.code,
      homeTeam: game.home_team.name,
      awayTeam: game.visitor_team.name,
      homeScore: game.home_team_score ?? 0,
      awayScore: game.visitor_team_score ?? 0,
      period: buildNflPeriod(game),
      startTime: formatDateLabel(game.date),
      venue: game.venue ?? `${game.home_team.location} 홈경기`,
      headline: `Week ${game.week} · ${game.home_team.name} vs ${game.visitor_team.name}`,
      summary: game.summary || `${game.status} 상태의 NFL 경기입니다.`,
      keyStats: [
        { label: '1쿼터', value: `${game.visitor_team_q1 ?? 0} - ${game.home_team_q1 ?? 0}` },
        { label: '2쿼터', value: `${game.visitor_team_q2 ?? 0} - ${game.home_team_q2 ?? 0}` },
        { label: '3쿼터', value: `${game.visitor_team_q3 ?? 0} - ${game.home_team_q3 ?? 0}` },
        { label: '4쿼터', value: `${game.visitor_team_q4 ?? 0} - ${game.home_team_q4 ?? 0}` },
      ],
      lastUpdated: relativeUpdatedAt(),
    }))
    .filter((game) => isScheduleWindow(game.startDate))
    .sort(sortMatches);
}
