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
  const query = `${team} ${league} latest news`;
  return encodeURIComponent(query);
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
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, 7)
    .map((match) => {
      const block = match[1];
      return {
        title: readTag(block, 'title'),
        link: readTag(block, 'link'),
        pubDate: readTag(block, 'pubDate'),
        source: readTag(block, 'source'),
      };
    })
    .filter((article) => article.title && article.link);

  return items;
}
