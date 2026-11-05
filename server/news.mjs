// Team dictionary with Korean names, English names, and aliases
const teamMetaList = [
  // KBO
  { abbr: 'DSB', league: 'KBO', name: 'Doosan Bears', koName: '두산 베어스', shortKo: '두산', clubKo: '베어스' },
  { abbr: 'HAN', league: 'KBO', name: 'Hanwha Eagles', koName: '한화 이글스', shortKo: '한화', clubKo: '이글스' },
  { abbr: 'KIA', league: 'KBO', name: 'KIA Tigers', koName: 'KIA 타이거즈', shortKo: 'KIA', aliases: ['기아', '기아 타이거즈', '기아타이거즈'], clubKo: '타이거즈' },
  { abbr: 'KIW', league: 'KBO', name: 'Kiwoom Heroes', koName: '키움 히어로즈', shortKo: '키움', clubKo: '히어로즈' },
  { abbr: 'KTW', league: 'KBO', name: 'KT Wiz', koName: 'KT 위즈', shortKo: 'KT', aliases: ['kt wiz', '케이티'], clubKo: '위즈' },
  { abbr: 'LGT', league: 'KBO', name: 'LG Twins', koName: 'LG 트윈스', shortKo: 'LG', aliases: ['엘지', '엘지 트윈스', '엘지트윈스'], clubKo: '트윈스' },
  { abbr: 'LOT', league: 'KBO', name: 'Lotte Giants', koName: '롯데 자이언츠', shortKo: '롯데', clubKo: '자이언츠' },
  { abbr: 'NCD', league: 'KBO', name: 'NC Dinos', koName: 'NC 다이노스', shortKo: 'NC', aliases: ['엔씨', '엔씨 다이노스'], clubKo: '다이노스' },
  { abbr: 'SAM', league: 'KBO', name: 'Samsung Lions', koName: '삼성 라이온즈', shortKo: '삼성', clubKo: '라이온즈' },
  { abbr: 'SSG', league: 'KBO', name: 'SSG Landers', koName: 'SSG 랜더스', shortKo: 'SSG', aliases: ['랜더스', '쓱'], clubKo: '랜더스' },

  // NBA
  { abbr: 'ATL', league: 'NBA', name: 'Atlanta Hawks', koName: '애틀랜타 호크스', shortKo: '애틀랜타', clubKo: '호크스' },
  { abbr: 'BOS', league: 'NBA', name: 'Boston Celtics', koName: '보스턴 셀틱스', shortKo: '보스턴', clubKo: '셀틱스' },
  { abbr: 'BKN', league: 'NBA', name: 'Brooklyn Nets', koName: '브루클린 네츠', shortKo: '브루클린', clubKo: '네츠' },
  { abbr: 'CHA', league: 'NBA', name: 'Charlotte Hornets', koName: '샬럿 호네츠', shortKo: '샬럿', clubKo: '호네츠' },
  { abbr: 'CHI', league: 'NBA', name: 'Chicago Bulls', koName: '시카고 불스', shortKo: '시카고', clubKo: '불스' },
  { abbr: 'CLE', league: 'NBA', name: 'Cleveland Cavaliers', koName: '클리블랜드 캐벌리어스', shortKo: '클리블랜드', clubKo: '캐벌리어스' },
  { abbr: 'DAL', league: 'NBA', name: 'Dallas Mavericks', koName: '댈러스 매버릭스', shortKo: '댈러스', clubKo: '매버릭스' },
  { abbr: 'DEN', league: 'NBA', name: 'Denver Nuggets', koName: '덴버 너게츠', shortKo: '덴버', clubKo: '너게츠' },
  { abbr: 'DET', league: 'NBA', name: 'Detroit Pistons', koName: '디트로이트 피스톤스', shortKo: '디트로이트', clubKo: '피스톤스' },
  { abbr: 'GSW', league: 'NBA', name: 'Golden State Warriors', koName: '골든스테이트 워리어스', shortKo: '골든스테이트', clubKo: '워리어스', aliases: ['골스', 'GSW'] },
  { abbr: 'HOU', league: 'NBA', name: 'Houston Rockets', koName: '휴스턴 로키츠', shortKo: '휴스턴', clubKo: '로키츠' },
  { abbr: 'IND', league: 'NBA', name: 'Indiana Pacers', koName: '인디애나 페이서스', shortKo: '인디애나', clubKo: '페이서스' },
  { abbr: 'LAC', league: 'NBA', name: 'LA Clippers', koName: 'LA 클리퍼스', shortKo: '클리퍼스', clubKo: '클리퍼스', aliases: ['로스앤젤레스 클리퍼스'] },
  { abbr: 'LAL', league: 'NBA', name: 'Los Angeles Lakers', koName: 'LA 레이커스', shortKo: '레이커스', clubKo: '레이커스', aliases: ['로스앤젤레스 레이커스'] },
  { abbr: 'MEM', league: 'NBA', name: 'Memphis Grizzlies', koName: '멤피스 그리즐리스', shortKo: '멤피스', clubKo: '그리즐리스' },
  { abbr: 'MIA', league: 'NBA', name: 'Miami Heat', koName: '마이애미 히트', shortKo: '마이애미', clubKo: '히트' },
  { abbr: 'MIL', league: 'NBA', name: 'Milwaukee Bucks', koName: '밀워키 벅스', shortKo: '밀워키', clubKo: '벅스' },
  { abbr: 'MIN', league: 'NBA', name: 'Minnesota Timberwolves', koName: '미네소타 팀버울브스', shortKo: '미네소타', clubKo: '팀버울브스' },
  { abbr: 'NOP', league: 'NBA', name: 'New Orleans Pelicans', koName: '뉴올리언스 펠리컨스', shortKo: '뉴올리언스', clubKo: '펠리컨스' },
  { abbr: 'NYK', league: 'NBA', name: 'New York Knicks', koName: '뉴욕 닉스', shortKo: '뉴욕', clubKo: '닉스' },
  { abbr: 'OKC', league: 'NBA', name: 'Oklahoma City Thunder', koName: '오클라호마시티 썬더', shortKo: '오클라호마시티', clubKo: '썬더' },
  { abbr: 'ORL', league: 'NBA', name: 'Orlando Magic', koName: '올랜도 매직', shortKo: '올랜도', clubKo: '매직' },
  { abbr: 'PHI', league: 'NBA', name: 'Philadelphia 76ers', koName: '필라델피아 76ers', shortKo: '필라델피아', clubKo: '76ers', aliases: ['세븐티식서스', '식서스'] },
  { abbr: 'PHX', league: 'NBA', name: 'Phoenix Suns', koName: '피닉스 선즈', shortKo: '피닉스', clubKo: '선즈' },
  { abbr: 'POR', league: 'NBA', name: 'Portland Trail Blazers', koName: '포틀랜드 트레일블레이저스', shortKo: '포틀랜드', clubKo: '트레일블레이저스', aliases: ['블레이저스'] },
  { abbr: 'SAC', league: 'NBA', name: 'Sacramento Kings', koName: '새크라멘토 킹스', shortKo: '새크라멘토', clubKo: '킹스' },
  { abbr: 'SAS', league: 'NBA', name: 'San Antonio Spurs', koName: '샌안토니오 스퍼스', shortKo: '샌안토니오', clubKo: '스퍼스' },
  { abbr: 'TOR', league: 'NBA', name: 'Toronto Raptors', koName: '토론토 랩터스', shortKo: '토론토', clubKo: '랩터스' },
  { abbr: 'UTA', league: 'NBA', name: 'Utah Jazz', koName: '유타 재즈', shortKo: '유타', clubKo: '재즈' },
  { abbr: 'WAS', league: 'NBA', name: 'Washington Wizards', koName: '워싱턴 위저즈', shortKo: '워싱턴', clubKo: '위저즈' },

  // NFL
  { abbr: 'ARI', league: 'NFL', name: 'Arizona Cardinals', koName: '애리조나 카디널스', shortKo: '애리조나', clubKo: '카디널스' },
  { abbr: 'ATL', league: 'NFL', name: 'Atlanta Falcons', koName: '애틀랜타 팰컨스', shortKo: '애틀랜타', clubKo: '팰컨스' },
  { abbr: 'BAL', league: 'NFL', name: 'Baltimore Ravens', koName: '볼티모어 레이븐스', shortKo: '볼티모어', clubKo: '레이븐스' },
  { abbr: 'BUF', league: 'NFL', name: 'Buffalo Bills', koName: '버팔로 빌스', shortKo: '버팔로', clubKo: '빌스' },
  { abbr: 'CAR', league: 'NFL', name: 'Carolina Panthers', koName: '캐롤라이나 팬서스', shortKo: '캐롤라이나', clubKo: '팬서스' },
  { abbr: 'CHI', league: 'NFL', name: 'Chicago Bears', koName: '시카고 베어스', shortKo: '시카고', clubKo: '베어스' },
  { abbr: 'CIN', league: 'NFL', name: 'Cincinnati Bengals', koName: '신시내티 벵골스', shortKo: '신시내티', clubKo: '벵골스' },
  { abbr: 'CLE', league: 'NFL', name: 'Cleveland Browns', koName: '클리블랜드 브라운스', shortKo: '클리블랜드', clubKo: '브라운스' },
  { abbr: 'DAL', league: 'NFL', name: 'Dallas Cowboys', koName: '댈러스 카우보이스', shortKo: '댈러스', clubKo: '카우보이스' },
  { abbr: 'DEN', league: 'NFL', name: 'Denver Broncos', koName: '덴버 브롱코스', shortKo: '덴버', clubKo: '브롱코스' },
  { abbr: 'DET', league: 'NFL', name: 'Detroit Lions', koName: '디트로이트 라이온스', shortKo: '디트로이트', clubKo: '라이온스' },
  { abbr: 'GB', league: 'NFL', name: 'Green Bay Packers', koName: '그린베이 패커스', shortKo: '그린베이', clubKo: '패커스' },
  { abbr: 'HOU', league: 'NFL', name: 'Houston Texans', koName: '휴스턴 텍선스', shortKo: '휴스턴', clubKo: '텍선스' },
  { abbr: 'IND', league: 'NFL', name: 'Indianapolis Colts', koName: '인디애나폴리스 콜츠', shortKo: '인디애나폴리스', clubKo: '콜츠' },
  { abbr: 'JAX', league: 'NFL', name: 'Jacksonville Jaguars', koName: '잭슨빌 재규어스', shortKo: '잭슨빌', clubKo: '재규어스' },
  { abbr: 'KC', league: 'NFL', name: 'Kansas City Chiefs', koName: '캔자스시티 치프스', shortKo: '캔자스시티', clubKo: '치프스' },
  { abbr: 'LAC', league: 'NFL', name: 'Los Angeles Chargers', koName: 'LA 차저스', shortKo: '차저스', clubKo: '차저스', aliases: ['로스앤젤레스 차저스'] },
  { abbr: 'LAR', league: 'NFL', name: 'Los Angeles Rams', koName: 'LA 램스', shortKo: '램스', clubKo: '램스', aliases: ['로스앤젤레스 램스'] },
  { abbr: 'LV', league: 'NFL', name: 'Las Vegas Raiders', koName: '라스베이거스 레이더스', shortKo: '라스베이거스', clubKo: '레이더스' },
  { abbr: 'MIA', league: 'NFL', name: 'Miami Dolphins', koName: '마이애미 돌핀스', shortKo: '마이애미', clubKo: '돌핀스' },
  { abbr: 'MIN', league: 'NFL', name: 'Minnesota Vikings', koName: '미네소타 바이킹스', shortKo: '미네소타', clubKo: '바이킹스' },
  { abbr: 'NE', league: 'NFL', name: 'New England Patriots', koName: '뉴잉글랜드 패트리어츠', shortKo: '뉴잉글랜드', clubKo: '패트리어츠' },
  { abbr: 'NO', league: 'NFL', name: 'New Orleans Saints', koName: '뉴올리언스 세인츠', shortKo: '뉴올리언스', clubKo: '세인츠' },
  { abbr: 'NYG', league: 'NFL', name: 'New York Giants', koName: '뉴욕 자이언츠', shortKo: '뉴욕', clubKo: '자이언츠' },
  { abbr: 'NYJ', league: 'NFL', name: 'New York Jets', koName: '뉴욕 제츠', shortKo: '뉴욕', clubKo: '제츠' },
  { abbr: 'PHI', league: 'NFL', name: 'Philadelphia Eagles', koName: '필라델피아 이글스', shortKo: '필라델피아', clubKo: '이글스' },
  { abbr: 'PIT', league: 'NFL', name: 'Pittsburgh Steelers', koName: '피츠버그 스틸러스', shortKo: '피츠버그', clubKo: '스틸러스' },
  { abbr: 'SEA', league: 'NFL', name: 'Seattle Seahawks', koName: '시애틀 시호크스', shortKo: '시애틀', clubKo: '시호크스' },
  { abbr: 'SF', league: 'NFL', name: 'San Francisco 49ers', koName: '샌프란시스코 49ers', shortKo: '샌프란시스코', clubKo: '49ers', aliases: ['포티나이너스'] },
  { abbr: 'TB', league: 'NFL', name: 'Tampa Bay Buccaneers', koName: '탬파베이 버커니어스', shortKo: '탬파베이', clubKo: '버커니어스' },
  { abbr: 'TEN', league: 'NFL', name: 'Tennessee Titans', koName: '테네시 타이탄스', shortKo: '테네시', clubKo: '타이탄스' },
  { abbr: 'WSH', league: 'NFL', name: 'Washington Commanders', koName: '워싱턴 커맨더스', shortKo: '워싱턴', clubKo: '커맨더스' },
];

function findTeamMeta(teamName, league) {
  const norm = (teamName || '').trim().toLowerCase();
  const normLeague = (league || '').trim().toUpperCase();

  return (
    teamMetaList.find((item) => {
      if (normLeague && item.league !== normLeague) return false;
      if (item.name.toLowerCase() === norm) return true;
      if (item.koName.toLowerCase() === norm) return true;
      if (item.abbr.toLowerCase() === norm) return true;
      if (item.shortKo && item.shortKo.toLowerCase() === norm) return true;
      if (item.aliases?.some((a) => a.toLowerCase() === norm)) return true;
      return false;
    }) ||
    teamMetaList.find((item) => {
      if (item.name.toLowerCase() === norm) return true;
      if (item.koName.toLowerCase() === norm) return true;
      if (item.abbr.toLowerCase() === norm) return true;
      return false;
    })
  );
}

function decodeXml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripCdata(text) {
  return text.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
}

function readTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(stripCdata(match[1].trim())) : '';
}

function cleanTitle(title) {
  return title
    .replace(/(\s+-[^-]+)+$/u, '')
    .trim();
}

function normalizeTitle(title) {
  return cleanTitle(title)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

function classifyArticle(title) {
  const text = title.toLowerCase();
  if (/injur|부상|라인업|lineup|결장|이탈/.test(text)) return 'Injury';
  if (/preview|프리뷰|vs\.?|대결|전망|맞대결/.test(text)) return 'Preview';
  if (/recap|review|결과|승리|패배|완파|제압|하이라이트|대승|연패|연승/.test(text)) return 'Recap';
  if (/trade|roster|contract|계약|이적|등록|말소|콜업|영입|방출|FA|트레이드/.test(text)) return 'Roster';
  return 'News';
}

function formatDisplayDate(pubDate) {
  const parsed = Date.parse(pubDate);
  if (!Number.isFinite(parsed)) {
    return pubDate;
  }

  const now = Date.now();
  const diffSec = Math.floor((now - parsed) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60 && diffSec >= 0) {
    return 'Just now';
  }
  if (diffMin < 60 && diffMin >= 0) {
    return `${Math.max(1, diffMin)}m ago`;
  }
  if (diffHour < 24 && diffHour >= 0) {
    return `${diffHour}h ago`;
  }
  if (diffDay === 1) {
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(parsed));
    return `Yesterday ${time}`;
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(parsed));
}

// Strict relevance checking to eliminate irrelevant or homonym news
function isArticleRelevant(title, meta, rawTeam) {
  const titleLower = title.toLowerCase();

  if (!meta) {
    const fallback = rawTeam.toLowerCase();
    return titleLower.includes(fallback);
  }

  const { league, name, koName, shortKo, clubKo, aliases = [] } = meta;

  // 1. Full Korean name or English name in title
  if (koName && titleLower.includes(koName.toLowerCase())) return true;
  if (name && titleLower.includes(name.toLowerCase())) return true;

  // 2. Aliases
  for (const alias of aliases) {
    if (titleLower.includes(alias.toLowerCase())) return true;
  }

  // 3. KBO: clubKo or shortKo
  if (league === 'KBO') {
    if (clubKo && titleLower.includes(clubKo.toLowerCase())) return true;
    if (shortKo && titleLower.includes(shortKo.toLowerCase())) return true;
    return false;
  }

  // 4. NBA / NFL: clubKo or shortKo
  if (clubKo && titleLower.includes(clubKo.toLowerCase())) return true;
  if (shortKo && titleLower.includes(shortKo.toLowerCase())) return true;

  const engWords = name.split(/\s+/).filter((w) => w.length > 3);
  const lastEngWord = engWords[engWords.length - 1];
  if (lastEngWord && titleLower.includes(lastEngWord.toLowerCase())) {
    return true;
  }

  return false;
}

async function fetchRssFeed(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    if (!response.ok) return [];
    const xml = await response.text();

    const items = [];
    const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    for (const match of matches) {
      const block = match[1];
      const title = readTag(block, 'title');
      const link = readTag(block, 'link');
      const pubDate = readTag(block, 'pubDate');
      const source = readTag(block, 'source');

      if (title && link) {
        items.push({
          title,
          link,
          pubDate,
          source,
          timestamp: Date.parse(pubDate) || 0,
        });
      }
    }
    return items;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchTeamNews(team, league, queryOverride = '') {
  const meta = findTeamMeta(team, league);
  const feeds = [];

  if (meta && meta.league === 'KBO') {
    // KBO: Direct Korean news query for high precision
    feeds.push(
      `https://news.google.com/rss/search?q=${encodeURIComponent(meta.koName)}&hl=ko&gl=KR&ceid=KR:ko`,
    );
  } else if (meta && (meta.league === 'NBA' || meta.league === 'NFL')) {
    // NBA / NFL: Korean news first, English feed as complement
    feeds.push(
      `https://news.google.com/rss/search?q=${encodeURIComponent(meta.koName)}&hl=ko&gl=KR&ceid=KR:ko`,
    );
    feeds.push(
      `https://news.google.com/rss/search?q=${encodeURIComponent(meta.name)}&hl=en-US&gl=US&ceid=US:en`,
    );
  } else {
    const q = (queryOverride || team || '').trim();
    feeds.push(
      `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`,
    );
  }

  // Fetch in parallel
  const feedResults = await Promise.allSettled(feeds.map((url) => fetchRssFeed(url)));
  const allArticles = feedResults.flatMap((res) => (res.status === 'fulfilled' ? res.value : []));

  // Deduplicate and filter by accuracy
  const seenTitles = new Set();
  const seenLinks = new Set();
  const relevantArticles = [];

  for (const item of allArticles) {
    if (!item.title || !item.link) continue;

    const normTitle = normalizeTitle(item.title);
    if (seenTitles.has(normTitle) || seenLinks.has(item.link)) {
      continue;
    }

    if (!isArticleRelevant(item.title, meta, team)) {
      continue;
    }

    seenTitles.add(normTitle);
    seenLinks.add(item.link);

    relevantArticles.push({
      title: cleanTitle(item.title) || item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source || (meta ? (meta.league === 'KBO' ? meta.koName : meta.name) : team),
      category: classifyArticle(item.title),
      displayDate: formatDisplayDate(item.pubDate),
      timestamp: item.timestamp,
    });
  }

  // Sort strictly by latest publication time (descending)
  relevantArticles.sort((a, b) => b.timestamp - a.timestamp);

  // Return exactly the top 5 most recent articles
  const topArticles = relevantArticles.slice(0, 5).map(({ timestamp, ...rest }) => rest);

  return topArticles;
}
