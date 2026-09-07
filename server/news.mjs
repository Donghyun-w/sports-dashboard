function decodeXml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripCdata(text) {
  return text.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
}

function readTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(stripCdata(match[1].trim())) : '';
}

function toGoogleNewsQuery(team, league) {
  const query = `${team} ${league} latest news OR preview OR recap`;
  return encodeURIComponent(query);
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s+-\s+[^-]+$/u, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function classifyArticle(title) {
  const text = title.toLowerCase();

  if (/injur|부상|라인업|lineup/.test(text)) return 'Injury';
  if (/preview|프리뷰|vs\.?|대결|전망/.test(text)) return 'Preview';
  if (/recap|review|결과|승리|패배|완파|제압|하이라이트/.test(text)) return 'Recap';
  if (/trade|roster|contract|계약|이적|등록|말소|콜업/.test(text)) return 'Roster';
  return 'News';
}

function formatDisplayDate(pubDate) {
  const parsed = Date.parse(pubDate);

  if (!Number.isFinite(parsed)) {
    return pubDate;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(parsed));
}

function relevanceScore(article, team, league, queryOverride) {
  const haystack = `${article.title} ${article.source}`.toLowerCase();
  const teamWords = team
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
  const queryWords = queryOverride
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  let score = 0;
  if (haystack.includes(team.toLowerCase())) score += 6;
  if (league && haystack.includes(league.toLowerCase())) score += 3;
  score += teamWords.filter((word) => haystack.includes(word)).length * 2;
  score += queryWords.filter((word) => haystack.includes(word)).length;
  if (article.category !== 'News') score += 1;
  return score;
}

export async function fetchTeamNews(team, league, queryOverride = '') {
  const query = queryOverride.trim() ? encodeURIComponent(queryOverride.trim()) : toGoogleNewsQuery(team, league);
  const url = `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'sport-dashboard/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`팀 뉴스 요청 실패 (${response.status})`);
  }

  const xml = await response.text();
  const seen = new Set();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const block = match[1];
      const article = {
        title: readTag(block, 'title'),
        link: readTag(block, 'link'),
        pubDate: readTag(block, 'pubDate'),
        source: readTag(block, 'source'),
      };
      const category = classifyArticle(article.title);
      return {
        ...article,
        category,
        displayDate: formatDisplayDate(article.pubDate),
      };
    })
    .filter((article) => article.title && article.link)
    .map((article) => ({
      ...article,
      relevance: relevanceScore(article, team, league, queryOverride),
    }))
    .filter((article) => article.relevance > 0)
    .filter((article) => {
      const key = normalizeTitle(article.title);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => {
      if (right.relevance !== left.relevance) return right.relevance - left.relevance;
      return (Date.parse(right.pubDate) || 0) - (Date.parse(left.pubDate) || 0);
    })
    .slice(0, 9)
    .map(({ relevance, ...article }) => article);

  return items;
}
