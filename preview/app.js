import { allTeams, getLeagueTeams, getTeamByAbbr, getTeamByKey } from './teamCatalog.js?v=20260703-2006';

function pad(value) {
  return String(value).padStart(2, '0');
}

function buildSeedSchedule(offsetDays, hour, minute) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const startDate = `${year}-${month}-${day}T${pad(hour)}:${pad(minute)}:00+09:00`;

  let startTime = `${month}월 ${day}일 ${pad(hour)}:${pad(minute)}`;
  if (offsetDays === 0) startTime = `오늘 ${pad(hour)}:${pad(minute)}`;
  if (offsetDays === -1) startTime = `어제 ${pad(hour)}:${pad(minute)}`;
  if (offsetDays === 1) startTime = `내일 ${pad(hour)}:${pad(minute)}`;

  let bucket = 'TODAY';
  if (offsetDays < 0) bucket = 'YESTERDAY';
  if (offsetDays > 0) bucket = 'UPCOMING';

  return { startDate, startTime, bucket };
}

const initialMatches = [
  { id: 1, league: 'NBA', status: 'LIVE', ...buildSeedSchedule(0, 20, 30), awayTeam: 'Boston Celtics', awayAbbr: 'BOS', awayScore: 99, awayRecord: '55-21', homeTeam: 'Los Angeles Lakers', homeAbbr: 'LAL', homeScore: 102, homeRecord: '49-27', headline: '접전 끝 승부처 돌입', period: '4Q · 02:14', venue: 'Crypto.com Arena', stats: [{ label: '리바운드', away: 40, home: 44 }, { label: '3점 성공', away: 13, home: 14 }, { label: '턴오버', away: 11, home: 9 }], play: ['2:14 레이커스 자유투 2개 성공', '3:02 테이텀 3점 성공', '4:15 르브론 속공 덩크'] },
  { id: 2, league: 'NFL', status: 'LIVE', ...buildSeedSchedule(0, 21, 0), awayTeam: 'Buffalo Bills', awayAbbr: 'BUF', awayScore: 21, awayRecord: '9-4', homeTeam: 'Kansas City Chiefs', homeAbbr: 'KC', homeScore: 24, homeRecord: '10-3', headline: '터치다운 공방 계속', period: '4Q · 08:41', venue: 'Arrowhead Stadium', stats: [{ label: '패싱 야드', away: 271, home: 286 }, { label: '러싱 야드', away: 88, home: 97 }, { label: '턴오버', away: 1, home: 0 }], play: ['08:41 치프스 필드골 성공', '10:12 빌스 터치다운 드라이브', '12:55 치프스 인터셉션 유도'] },
  { id: 3, league: 'NBA', status: 'FINAL', ...buildSeedSchedule(0, 17, 0), awayTeam: 'Phoenix Suns', awayAbbr: 'PHX', awayScore: 110, awayRecord: '43-33', homeTeam: 'Golden State Warriors', homeAbbr: 'GSW', homeScore: 118, homeRecord: '46-30', headline: '커리 34점 활약', period: 'Final', venue: 'Chase Center', stats: [{ label: '3점 성공', away: 12, home: 19 }, { label: '어시스트', away: 24, home: 31 }, { label: '자유투', away: 18, home: 15 }], play: ['4Q 종료 워리어스 승리 확정', '1:22 커리 3점 성공', '2:01 듀란트 점퍼 성공'] },
  { id: 7, league: 'KBO', status: 'LIVE', ...buildSeedSchedule(0, 18, 30), awayTeam: 'KIA Tigers', awayAbbr: 'KIA', awayScore: 6, awayRecord: '45-27', homeTeam: 'LG Twins', homeAbbr: 'LGT', homeScore: 5, homeRecord: '43-29', headline: '선두권 맞대결, KIA 1점 차 리드', period: '8회초 · 1사', venue: 'Jamsil Baseball Stadium', stats: [{ label: '안타', away: 9, home: 8 }, { label: '홈런', away: 2, home: 1 }, { label: '볼넷', away: 4, home: 3 }], play: ['8회초 KIA 적시 2루타', '7회말 LG 희생플라이 득점', '5회초 KIA 투런 홈런'] },
  { id: 8, league: 'KBO', status: 'FINAL', ...buildSeedSchedule(0, 18, 30), awayTeam: 'Doosan Bears', awayAbbr: 'DSB', awayScore: 7, awayRecord: '36-37', homeTeam: 'SSG Landers', homeAbbr: 'SSG', homeScore: 3, homeRecord: '38-34', headline: '두산, 원정에서 7득점 완승', period: 'Final', venue: 'Incheon SSG Landers Field', stats: [{ label: '안타', away: 11, home: 6 }, { label: '실책', away: 0, home: 2 }, { label: '잔루', away: 7, home: 5 }], play: ['7회초 두산 3점 추가', '4회초 두산 적시타 2개', '9회말 SSG 마지막 타자 삼진'] },
  { id: 9, league: 'KBO', status: 'UPCOMING', ...buildSeedSchedule(1, 18, 30), awayTeam: 'Lotte Giants', awayAbbr: 'LOT', awayScore: 0, awayRecord: '34-38', homeTeam: 'Samsung Lions', homeAbbr: 'SAM', homeScore: 0, homeRecord: '39-33', headline: '영남 라이벌전 예정', period: '내일 18:30', venue: 'Daegu Samsung Lions Park', stats: [{ label: '선발 매치업', text: '원태인 vs 반즈' }, { label: '최근 10경기', text: '6승 4패 - 4승 6패' }, { label: '관전 포인트', text: '초반 선취점' }], play: ['라인업 발표 전입니다.'] },
  { id: 10, league: 'KBO', status: 'FINAL', ...buildSeedSchedule(-1, 18, 30), awayTeam: 'Kiwoom Heroes', awayAbbr: 'KIW', awayScore: 2, awayRecord: '30-42', homeTeam: 'Hanwha Eagles', homeAbbr: 'HAN', homeScore: 4, homeRecord: '37-35', headline: '한화, 불펜 지키며 2점 차 승리', period: 'Final', venue: 'Daejeon Hanwha Life Ballpark', stats: [{ label: '안타', away: 8, home: 5 }, { label: '볼넷', away: 2, home: 4 }, { label: '도루', away: 1, home: 0 }], play: ['8회말 한화 결승타', '9회초 마무리 삼자범퇴'] },
];

const bucketLabels = { YESTERDAY: 'Yesterday', TODAY: 'Today', UPCOMING: 'Upcoming' };
const storageKey = 'sport-dashboard-preview-favorites';
const apiBase = location.protocol === 'file:' || location.port === '4174' ? 'http://127.0.0.1:8787' : '';
let matches = [];
const state = {
  league: 'ALL',
  bucket: 'TODAY',
  selected: 1,
  detailTab: 'stats',
  teamTab: 'recent',
  teamSearchQuery: '',
  selectedTeam: 'NBA:LAL',
  scheduleTeam: null,
  favorites: JSON.parse(localStorage.getItem(storageKey) || '[]'),
  teamNews: { teamKey: '', loading: false, message: null, articles: [] },
  loadingScores: false,
  scoreMessage: null,
};

const app = document.querySelector('#app');

function brandFor(abbr, league) {
  return getTeamByAbbr(abbr, league) || { abbr, colors: ['#1b2c49', '#4f79ff'], mark: abbr.slice(0, 2), logo: '' };
}

function fallbackLogo(abbr, league) {
  const brand = brandFor(abbr, league);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><radialGradient id="g" cx="30%" cy="30%" r="85%"><stop offset="0%" stop-color="${brand.colors[1]}"/><stop offset="100%" stop-color="${brand.colors[0]}"/></radialGradient></defs><rect x="4" y="4" width="112" height="112" rx="28" fill="url(#g)"/><text x="60" y="58" text-anchor="middle" font-size="34" font-weight="900" fill="white" font-family="Inter, Arial, sans-serif">${brand.mark}</text><text x="60" y="90" text-anchor="middle" font-size="14" letter-spacing="4" font-weight="700" fill="rgba(255,255,255,0.92)" font-family="Inter, Arial, sans-serif">${abbr}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function logo(abbr, league) {
  const brand = brandFor(abbr, league);
  return brand.logo || fallbackLogo(abbr, league);
}

function filtered() {
  const scopedTeam = state.scheduleTeam ? getTeamByKey(state.scheduleTeam) : null;
  const kboReferenceDate = getKboReferenceDate();
  return matches
    .filter((m) => {
      const leagueOk = state.league === 'ALL' || m.league === state.league;
      const bucketOk = (m.league === 'KBO' ? resolveKboBucket(m, kboReferenceDate) : resolveBucket(m)) === state.bucket;
      const teamOk = scopedTeam ? m.homeAbbr === scopedTeam.abbr || m.awayAbbr === scopedTeam.abbr : true;
      return leagueOk && bucketOk && teamOk;
    })
    .sort((a, b) => {
      const af = state.favorites.includes(a.awayAbbr) || state.favorites.includes(a.homeAbbr);
      const bf = state.favorites.includes(b.awayAbbr) || state.favorites.includes(b.homeAbbr);
      if (af !== bf) return af ? -1 : 1;
      return a.id - b.id;
    });
}

function selected() {
  return filtered().find((m) => m.id === state.selected) || filtered()[0];
}

function leagueMatches() {
  return matches.filter((m) => state.league === 'ALL' || m.league === state.league);
}

function teamProfiles() {
  return getLeagueTeams(state.league).sort((a, b) => {
    const af = state.favorites.includes(a.abbr);
    const bf = state.favorites.includes(b.abbr);
    if (af !== bf) return af ? -1 : 1;
    if (state.league === 'ALL' && a.league !== b.league) return a.league.localeCompare(b.league);
    return a.name.localeCompare(b.name);
  });
}

function visibleTeamProfiles() {
  const query = state.teamSearchQuery.trim().toLowerCase();
  const teams = teamProfiles();
  if (!query) return teams;
  return teams.filter((team) => team.name.toLowerCase().includes(query) || team.abbr.toLowerCase().includes(query) || team.league.toLowerCase().includes(query));
}

function selectedTeamProfile() {
  return getTeamByKey(state.selectedTeam) || visibleTeamProfiles()[0] || teamProfiles()[0];
}

function selectedTeamGames() {
  const team = selectedTeamProfile();
  if (!team) return { recent: [], upcoming: [] };
  const related = leagueMatches().filter((m) => m.homeAbbr === team.abbr || m.awayAbbr === team.abbr);
  const referenceDate = team.league === 'KBO' ? getKboReferenceDate() : new Date().toISOString();
  return {
    recent: related.filter((m) => getDayDiff(m.startDate, referenceDate) >= -5 && getDayDiff(m.startDate, referenceDate) <= 0).sort((a, b) => (Date.parse(b.startDate || '') || 0) - (Date.parse(a.startDate || '') || 0)).slice(0, 5),
    upcoming: related.filter((m) => getDayDiff(m.startDate, referenceDate) >= 1 && getDayDiff(m.startDate, referenceDate) <= 5).sort((a, b) => (Date.parse(a.startDate || '') || 0) - (Date.parse(b.startDate || '') || 0)).slice(0, 5),
  };
}

function toggleFavorite(abbr) {
  state.favorites = state.favorites.includes(abbr) ? state.favorites.filter((item) => item !== abbr) : [...state.favorites, abbr];
  localStorage.setItem(storageKey, JSON.stringify(state.favorites));
  render();
}

function renderStats(stats) {
  return stats.map((stat) => {
    const awayValue = stat.away ?? stat.awayValue;
    const homeValue = stat.home ?? stat.homeValue;
    if (awayValue === undefined || homeValue === undefined) {
      return `<div class="stat"><div class="stat-head"><strong>${stat.text}</strong><span>${stat.label}</span><strong></strong></div></div>`;
    }
    const total = awayValue + homeValue || 1;
    return `<div class="stat"><div class="stat-head"><strong>${awayValue}</strong><span>${stat.label}</span><strong>${homeValue}</strong></div><div class="split"><i class="a" style="width:${(awayValue / total) * 100}%"></i><i class="h" style="width:${(homeValue / total) * 100}%"></i></div></div>`;
  }).join('');
}

function inferDateBucket(match) {
  if (match.status === 'UPCOMING') return 'UPCOMING';
  return 'TODAY';
}

function resolveBucket(match) {
  if (match.dateBucket) return match.dateBucket;
  if (match.bucket) return match.bucket;
  if (match.startDate) {
    const target = toSeoulDayKey(match.startDate);
    const today = toSeoulDayKey(new Date().toISOString());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = toSeoulDayKey(yesterdayDate.toISOString());

    if (target === today) return 'TODAY';
    if (target === yesterday) return 'YESTERDAY';
    return target > today ? 'UPCOMING' : 'YESTERDAY';
  }
  return inferDateBucket(match);
}

function getKboReferenceDate() {
  const todayKboMatch = matches.find((match) => match.league === 'KBO' && match.startDate && resolveBucket(match) === 'TODAY');
  return todayKboMatch?.startDate || new Date().toISOString();
}

function resolveKboBucket(match, referenceDate) {
  const diff = getDayDiff(match.startDate, referenceDate);
  if (diff <= -1) return 'YESTERDAY';
  if (diff >= 1) return 'UPCOMING';
  return 'TODAY';
}

function getDayDiff(matchDate, referenceDate) {
  if (!matchDate || !referenceDate) return 0;
  const target = new Date(toSeoulDayKey(matchDate));
  const anchor = new Date(toSeoulDayKey(referenceDate));
  return Math.round((target.getTime() - anchor.getTime()) / (24 * 60 * 60 * 1000));
}

function toSeoulDayKey(dateString) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString));
}

function normalizeStat(stat) {
  if (stat.away !== undefined || stat.home !== undefined) {
    return {
      ...stat,
      awayValue: stat.away,
      homeValue: stat.home,
      value: stat.value || `${stat.away} - ${stat.home}`,
    };
  }

  return stat;
}

function normalizeMatch(match) {
  const dateBucket = resolveBucket(match);
  return {
    ...match,
    bucket: dateBucket,
    dateBucket,
    keyStats: (match.keyStats || match.stats || []).map(normalizeStat),
    playByPlay: match.playByPlay || match.play || ['표시할 중계 내용이 없습니다.'],
    summary: match.summary || match.headline || `${match.awayTeam} vs ${match.homeTeam}`,
    lastUpdated: match.lastUpdated || '방금 전',
  };
}

async function fetchScoreboard() {
  if (!apiBase) return;
  state.loadingScores = true;
  render();

  try {
    const response = await fetch(`${apiBase}/api/scoreboard`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || '점수 데이터를 불러오지 못했습니다.');
    matches = Array.isArray(payload.matches) ? payload.matches.map(normalizeMatch) : [];
    state.scoreMessage = payload.message || null;
  } catch (error) {
    state.scoreMessage = error instanceof Error ? error.message : '점수 데이터를 불러오지 못했습니다.';
  } finally {
    state.loadingScores = false;
    render();
  }
}

function teamBlock(match, side) {
  const team = side === 'away' ? match.awayTeam : match.homeTeam;
  const abbr = side === 'away' ? match.awayAbbr : match.homeAbbr;
  const favorite = state.favorites.includes(abbr);
  return `<div class="match-team"><img class="team-emblem sm team-emblem-image" src="${logo(abbr, match.league)}" alt="${team}" onerror="this.src='${fallbackLogo(abbr, match.league)}'" /><div><strong>${team}</strong><span>${abbr}</span></div><button class="favorite-toggle ${favorite ? 'active' : ''}" data-fav="${abbr}">★</button></div>`;
}

function heroBlock(match, side) {
  const team = side === 'away' ? match.awayTeam : match.homeTeam;
  const abbr = side === 'away' ? match.awayAbbr : match.homeAbbr;
  const score = side === 'away' ? match.awayScore : match.homeScore;
  const record = side === 'away' ? match.awayRecord : match.homeRecord;
  const favorite = state.favorites.includes(abbr);
  return `<div class="hero-team"><button class="favorite-toggle hero-favorite ${favorite ? 'active' : ''}" data-fav="${abbr}">★</button><img class="team-emblem lg team-emblem-image" src="${logo(abbr, match.league)}" alt="${team}" onerror="this.src='${fallbackLogo(abbr, match.league)}'" /><strong>${score}</strong><h3>${team}</h3><span>${record}</span></div>`;
}

function teamGameCard(match, teamAbbr) {
  const selectedIsHome = match.homeAbbr === teamAbbr;
  const opponent = selectedIsHome ? match.awayTeam : match.homeTeam;
  const opponentAbbr = selectedIsHome ? match.awayAbbr : match.homeAbbr;
  const teamScore = selectedIsHome ? match.homeScore : match.awayScore;
  const opponentScore = selectedIsHome ? match.awayScore : match.homeScore;
  return `<article class="team-game-card"><div class="team-game-head"><span class="badge ${match.status.toLowerCase()}">${match.status === 'FINAL' ? 'Final' : match.period}</span><span class="league-badge">${match.league}</span></div><div class="team-game-body"><div class="team-game-score"><strong>${teamScore}</strong><span>vs</span><strong>${opponentScore}</strong></div><div class="team-game-opponent"><img class="team-emblem sm team-emblem-image" src="${logo(opponentAbbr, match.league)}" alt="${opponent}" onerror="this.src='${fallbackLogo(opponentAbbr, match.league)}'" /><div><h4>${opponent}</h4><p>${match.venue}</p></div></div></div><p class="team-game-time">${match.startTime}</p></article>`;
}

async function fetchTeamNews(team) {
  state.teamNews = { teamKey: team.key, loading: true, message: null, articles: [] };
  render();

  try {
    const response = await fetch(`${apiBase}/api/team-news?team=${encodeURIComponent(team.name)}&league=${encodeURIComponent(team.league)}&query=${encodeURIComponent(team.newsQuery)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || '팀 뉴스를 불러오지 못했습니다.');
    state.teamNews = { teamKey: team.key, loading: false, message: payload.message || null, articles: payload.articles || [] };
  } catch (error) {
    state.teamNews = { teamKey: team.key, loading: false, message: error instanceof Error ? error.message : '팀 뉴스 요청 중 오류가 발생했습니다.', articles: [] };
  }

  render();
}

function render() {
  const list = filtered();
  const match = selected();
  const teams = teamProfiles();
  const visibleTeams = visibleTeamProfiles();
  if (!teams.find((team) => team.key === state.selectedTeam)) state.selectedTeam = teams[0]?.key || '';
  if (visibleTeams.length && !visibleTeams.find((team) => team.key === state.selectedTeam)) state.selectedTeam = visibleTeams[0]?.key || state.selectedTeam;
  if (state.scheduleTeam) {
    const scoped = getTeamByKey(state.scheduleTeam);
    if (scoped && state.league !== 'ALL' && scoped.league !== state.league) state.scheduleTeam = null;
  }
  const team = selectedTeamProfile();
  const teamGames = selectedTeamGames();
  const scopedScheduleTeam = state.scheduleTeam ? getTeamByKey(state.scheduleTeam) : null;

  if (state.teamTab === 'news' && team && state.teamNews.teamKey !== team.key && !state.teamNews.loading) {
    void fetchTeamNews(team);
  }

  app.innerHTML = `
    <div class="desktop-shell">
      <header class="hero">
        <div>
          <p class="eyebrow">LIVE SPORTS CENTER</p>
          <h1>NBA · NFL · KBO Scores Dashboard</h1>
          <p class="hero-description">전체 팀 목록을 추가했고, 팀 탭에서 실제 뉴스 기사까지 바로 볼 수 있게 연결했습니다.</p>
        </div>
        <div class="hero-actions">
          <div class="top-pills">
            ${['ALL', 'NBA', 'NFL', 'KBO'].map((f) => `<button class="top-pill ${state.league === f ? 'active' : ''}" data-league="${f}">${f === 'ALL' ? 'All Leagues' : f}</button>`).join('')}
          </div>
          <div class="status-card"><span class="status-chip demo">Preview mode</span><p>${state.scoreMessage || (team ? `${team.name} team center` : 'Desktop layout preview')}</p><button class="refresh-button">${state.loadingScores ? 'Refreshing...' : 'Refresh Scores'}</button></div>
        </div>
      </header>
      ${state.favorites.length ? `<section class="favorite-strip"><span class="section-label">Favorites</span><div class="favorite-list">${state.favorites.map((abbr) => `<button class="favorite-chip"><img class="team-emblem sm team-emblem-image" src="${logo(abbr, getTeamByAbbr(abbr)?.league)}" alt="${abbr}" onerror="this.src='${fallbackLogo(abbr, getTeamByAbbr(abbr)?.league)}'" /><span>${abbr}</span></button>`).join('')}</div></section>` : ''}
      <section class="summary-grid">
        <article class="summary-card"><span>Live Games</span><strong>${list.filter((m) => m.status === 'LIVE').length}</strong></article>
        <article class="summary-card"><span>Final Games</span><strong>${list.filter((m) => m.status === 'FINAL').length}</strong></article>
        <article class="summary-card"><span>Upcoming</span><strong>${list.filter((m) => m.status === 'UPCOMING').length}</strong></article>
        <article class="summary-card"><span>All Teams</span><strong>${teams.length}</strong></article>
      </section>
      <section class="team-strip">
        <div class="panel-header"><div><p class="section-label">Teams</p><h2>Browse by Team</h2></div><span class="match-count">${team ? team.name : ''}</span></div>
        <div class="team-tools"><label class="team-search"><span>Search team</span><input type="text" value="${state.teamSearchQuery.replaceAll('"', '&quot;')}" placeholder="팀명 / 약자 / 리그 검색" data-team-search /></label><span class="team-search-meta">${visibleTeams.length} / ${teams.length} teams</span></div>
        <div class="team-tabs compact">${visibleTeams.map((item) => `<button class="team-tab ${state.scheduleTeam === item.key ? 'active' : ''}" data-team="${item.key}"><img class="team-emblem sm team-emblem-image" src="${logo(item.abbr, item.league)}" alt="${item.name}" onerror="this.src='${fallbackLogo(item.abbr, item.league)}'" /><span>${item.abbr}</span></button>`).join('')}</div>
        ${visibleTeams.length ? '' : '<div class="empty-card team-empty">검색된 팀이 없습니다.</div>'}
      </section>
      <section class="board-layout">
        <aside class="schedule-panel">
          <div class="panel-header"><div><p class="section-label">Schedule</p><h2>${scopedScheduleTeam ? `${scopedScheduleTeam.name} · ${bucketLabels[state.bucket]}` : bucketLabels[state.bucket]}</h2>${scopedScheduleTeam ? `<div class="schedule-scope"><img class="team-emblem sm team-emblem-image" src="${logo(scopedScheduleTeam.abbr, scopedScheduleTeam.league)}" alt="${scopedScheduleTeam.name}" onerror="this.src='${fallbackLogo(scopedScheduleTeam.abbr, scopedScheduleTeam.league)}'" /><span>${scopedScheduleTeam.name} only</span></div>` : ''}</div><span class="match-count">${list.length} games</span></div>
          ${scopedScheduleTeam ? `<div class="schedule-tabs"><button class="schedule-tab active" data-clear-team="1">All Teams</button></div>` : ''}
          <div class="schedule-tabs">${Object.keys(bucketLabels).map((b) => `<button class="schedule-tab ${state.bucket === b ? 'active' : ''}" data-bucket="${b}">${bucketLabels[b]}</button>`).join('')}</div>
          <div class="match-list">${list.map((m) => `<article class="match-row ${state.selected === m.id ? 'selected' : ''}" data-open="${m.id}" tabindex="0"><div class="row-top"><span class="badge ${m.status.toLowerCase()}">${m.status === 'FINAL' ? 'Final' : m.period}</span><div class="row-top-right">${state.favorites.includes(m.awayAbbr) || state.favorites.includes(m.homeAbbr) ? '<span class="favorite-mark">★</span>' : ''}<span class="league-badge">${m.league}</span></div></div><div class="row-main">${teamBlock(m, 'away')}<div class="center-score"><strong>${m.awayScore}</strong><span>:</span><strong>${m.homeScore}</strong></div>${teamBlock(m, 'home')}</div><div class="row-foot"><span>${m.venue}</span><span>${m.startTime}</span></div></article>`).join('') || '<div class="empty-card">선택한 조건에 맞는 경기가 없습니다.</div>'}</div>
        </aside>
        <section class="detail-panel">
          ${match ? `<div class="detail-top"><div><p class="section-label">Match Detail</p><h2>${match.awayTeam} vs ${match.homeTeam}</h2><p class="detail-meta">${match.venue} · ${match.startTime}</p></div><span class="status-chip ${match.status.toLowerCase()}">${match.status}</span></div><div class="score-hero">${heroBlock(match, 'away')}<div class="hero-center"><p class="mini-league">${match.league}</p><span class="badge ${match.status.toLowerCase()}">${match.status === 'FINAL' ? 'Final' : match.period}</span><h3>${match.headline}</h3><p>${match.summary}</p></div>${heroBlock(match, 'home')}</div><div class="detail-tabs">${[['stats','Stats'],['play','Play-By-Play'],['standings','Standings']].map(([k,l]) => `<button class="${state.detailTab === k ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>${state.detailTab === 'stats' ? `<div class="detail-grid"><section class="detail-card"><h4>Quick Notes</h4><div class="notes-grid"><div><span>League</span><strong>${match.league}</strong></div><div><span>Last Update</span><strong>${match.lastUpdated}</strong></div></div></section><section class="detail-card"><h4>Team Stats</h4><div class="bar-list">${renderStats(match.keyStats || [])}</div></section></div>` : ''}${state.detailTab === 'play' ? `<section class="detail-card"><h4>Play-By-Play</h4><div class="timeline">${(match.playByPlay || []).map((item) => `<div class="timeline-row"><span class="timeline-dot"></span><p>${item}</p></div>`).join('')}</div></section>` : ''}${state.detailTab === 'standings' ? `<section class="detail-card"><h4>Record Snapshot</h4><div class="notes-grid"><div><span>${match.awayTeam}</span><strong>${match.awayRecord || '데이터 준비 중'}</strong></div><div><span>${match.homeTeam}</span><strong>${match.homeRecord || '데이터 준비 중'}</strong></div></div></section>` : ''}` : '<div class="empty-card">경기를 선택해주세요.</div>'}
        </section>
      </section>
      <section class="team-center">
        <div class="panel-header"><div><p class="section-label">Team Center</p><h2>${team ? team.name : 'Select Team'}</h2></div><span class="match-count">${team ? `${team.league} · ${teamGames.recent.length} recent / ${teamGames.upcoming.length} upcoming` : ''}</span></div>
        <div class="team-tabs">${visibleTeams.map((item) => `<button class="team-tab ${state.selectedTeam === item.key ? 'active' : ''}" data-team="${item.key}"><img class="team-emblem sm team-emblem-image" src="${logo(item.abbr, item.league)}" alt="${item.name}" onerror="this.src='${fallbackLogo(item.abbr, item.league)}'" /><span>${item.abbr}</span></button>`).join('')}</div>
        <div class="team-view-tabs"><button class="${state.teamTab === 'recent' ? 'active' : ''}" data-team-view="recent">Prev 5 Days</button><button class="${state.teamTab === 'upcoming' ? 'active' : ''}" data-team-view="upcoming">Next 5 Days</button><button class="${state.teamTab === 'news' ? 'active' : ''}" data-team-view="news">Team News</button></div>
        ${state.teamTab === 'recent' ? `<section class="team-view-grid">${teamGames.recent.length ? teamGames.recent.map((item) => teamGameCard(item, team.abbr)).join('') : '<div class="empty-card">최근 경기 데이터가 없습니다.</div>'}</section>` : ''}
        ${state.teamTab === 'upcoming' ? `<section class="team-view-grid">${teamGames.upcoming.length ? teamGames.upcoming.map((item) => teamGameCard(item, team.abbr)).join('') : '<div class="empty-card">예정 경기 데이터가 없습니다.</div>'}</section>` : ''}
        ${state.teamTab === 'news' ? `<section class="news-list">${state.teamNews.loading ? '<div class="empty-card">뉴스를 불러오는 중입니다.</div>' : ''}${!state.teamNews.loading && state.teamNews.articles.length === 0 ? `<div class="empty-card">${state.teamNews.message || '표시할 뉴스가 없습니다.'}</div>` : ''}${state.teamNews.articles.map((article) => `<a class="news-card" href="${article.link}" target="_blank" rel="noreferrer"><span class="news-source">${article.source || team.name}</span><h3>${article.title}</h3><p>${article.pubDate}</p></a>`).join('')}</section>` : ''}
      </section>
    </div>`;

  app.querySelectorAll('[data-league]').forEach((el) => el.onclick = () => { state.league = el.dataset.league; state.selected = filtered()[0]?.id || state.selected; render(); });
  app.querySelectorAll('[data-bucket]').forEach((el) => el.onclick = () => { state.bucket = el.dataset.bucket; state.selected = filtered()[0]?.id || state.selected; render(); });
  app.querySelectorAll('[data-clear-team]').forEach((el) => el.onclick = () => { state.scheduleTeam = null; state.selected = filtered()[0]?.id || state.selected; render(); });
  app.querySelectorAll('[data-open]').forEach((el) => { el.onclick = () => { state.selected = Number(el.dataset.open); render(); }; el.onkeydown = (event) => { if (event.key === 'Enter' || event.key === ' ') { state.selected = Number(el.dataset.open); render(); } }; });
  app.querySelectorAll('[data-tab]').forEach((el) => el.onclick = () => { state.detailTab = el.dataset.tab; render(); });
  app.querySelectorAll('[data-fav]').forEach((el) => el.onclick = (event) => { event.stopPropagation(); toggleFavorite(el.dataset.fav); });
  app.querySelectorAll('[data-team]').forEach((el) => el.onclick = () => { state.selectedTeam = el.dataset.team; state.scheduleTeam = el.dataset.team; if (state.teamTab === 'news') state.teamNews = { teamKey: '', loading: false, message: null, articles: [] }; state.selected = filtered()[0]?.id || state.selected; render(); });
  app.querySelectorAll('[data-team-view]').forEach((el) => el.onclick = () => { state.teamTab = el.dataset.teamView; render(); });
  const refreshButton = app.querySelector('.refresh-button');
  if (refreshButton) refreshButton.onclick = () => void fetchScoreboard();
  const teamSearch = app.querySelector('[data-team-search]');
  if (teamSearch) {
    teamSearch.oninput = (event) => {
      state.teamSearchQuery = event.currentTarget.value;
      render();
    };
  }
}

render();
void fetchScoreboard();
