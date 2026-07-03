const KBO_SCOREBOARD_URL = 'https://www.koreabaseball.com/Schedule/ScoreBoard.aspx';

const TEAM_MAP = {
  LG: { abbr: 'LGT', name: 'LG Twins' },
  한화: { abbr: 'HAN', name: 'Hanwha Eagles' },
  SSG: { abbr: 'SSG', name: 'SSG Landers' },
  삼성: { abbr: 'SAM', name: 'Samsung Lions' },
  NC: { abbr: 'NCD', name: 'NC Dinos' },
  KT: { abbr: 'KTW', name: 'KT Wiz' },
  롯데: { abbr: 'LOT', name: 'Lotte Giants' },
  KIA: { abbr: 'KIA', name: 'KIA Tigers' },
  두산: { abbr: 'DSB', name: 'Doosan Bears' },
  키움: { abbr: 'KIW', name: 'Kiwoom Heroes' },
};

const TEAM_KEYS = Object.keys(TEAM_MAP);
const EXCLUDED_STATUS_PATTERN = /취소|서스펜디드/;

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeText(html) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(div|p|li|tr|h\d|section|article|ul|ol|table|tbody|thead|tfoot)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim(),
  );
}

function toSeoulDate(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function resolveDateBucket(dateString) {
  const target = toSeoulDate(new Date(dateString));
  const today = toSeoulDate();
  const yesterday = toSeoulDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  if (target === today) return 'TODAY';
  if (target === yesterday) return 'YESTERDAY';
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

function parseDateLine(lines) {
  const line = lines.find((entry) => /^\d{4}\.\d{2}\.\d{2}\(/.test(entry));
  if (!line) {
    return toSeoulDate().replaceAll('-', '.');
  }
  return line.slice(0, 10);
}

function isStatusLine(text) {
  return /경기전|경기종료|종료|취소|회|초|말|연장|서스펜디드|클리닝타임|우천/.test(text);
}

function parseVenueTime(line) {
  const match = line.match(/^(.*)\s+(\d{1,2}:\d{2})$/);
  if (!match) {
    return { venue: line.trim(), time: '18:30' };
  }

  return {
    venue: match[1].trim(),
    time: match[2],
  };
}

function parseScoreRow(line, teamLabel) {
  const normalized = line.replace(teamLabel, '').trim();
  const parts = normalized.split(/\s+/).filter(Boolean);
  return {
    innings: parts.slice(0, 12),
    totals: parts.slice(-4),
  };
}

function parseScoreCells(lines, startIndex, stopLabels) {
  const values = [];
  let cursor = startIndex;

  while (cursor < lines.length) {
    const value = lines[cursor];
    if (!value || stopLabels.includes(value) || isStatusLine(value) || /\d{4}\.\d{2}\.\d{2}\(/.test(value)) {
      break;
    }

    values.push(value);
    cursor += 1;
  }

  return { values, nextIndex: cursor };
}

function buildScoreRowFromCells(values) {
  const innings = values.slice(0, 12);
  const totals = values.length >= 16 ? values.slice(12, 16) : ['-', '-', '-', '-'];
  while (innings.length < 12) innings.push('-');
  return { innings, totals };
}

function toNumber(value) {
  return /^\d+$/.test(value ?? '') ? Number(value) : 0;
}

function buildStatus(statusLine, awayScore, homeScore) {
  if (/경기전|취소/.test(statusLine)) return 'UPCOMING';
  if (/종료/.test(statusLine)) return 'FINAL';
  if (awayScore > 0 || homeScore > 0 || /회|초|말|연장/.test(statusLine)) return 'LIVE';
  return 'UPCOMING';
}

function isOfficialKboMatch({ awayLabel, homeLabel, venue, statusLine }) {
  if (!TEAM_MAP[awayLabel] || !TEAM_MAP[homeLabel]) return false;
  if (!venue) return false;
  if (EXCLUDED_STATUS_PATTERN.test(statusLine)) return false;
  return true;
}

function buildSummary(status, awayName, homeName, venue, awayScore, homeScore) {
  if (status === 'FINAL') {
    return `${venue}에서 ${awayName} ${awayScore} - ${homeScore} ${homeName}로 경기가 종료됐습니다.`;
  }
  if (status === 'LIVE') {
    return `${venue}에서 ${awayName}와 ${homeName}의 경기가 실시간 진행 중입니다.`;
  }
  return `${venue}에서 ${awayName}와 ${homeName}의 경기가 예정되어 있습니다.`;
}

function buildHeadline(statusLine, awayName, homeName) {
  if (/경기전/.test(statusLine)) return `${awayName} vs ${homeName} 경기 시작 전`;
  if (/종료/.test(statusLine)) return `${awayName} vs ${homeName} 경기 종료`;
  return `${awayName} vs ${homeName} · ${statusLine}`;
}

function buildKeyStats(awayRow, homeRow) {
  const innings = awayRow.innings.map((awayValue, index) => ({
    label: `${index + 1}회`,
    value: `${awayValue ?? '-'} - ${homeRow.innings[index] ?? '-'}`,
  }));

  return [
    ...innings.slice(0, 9),
    { label: 'R', value: `${awayRow.totals[0] ?? '-'} - ${homeRow.totals[0] ?? '-'}`, awayValue: toNumber(awayRow.totals[0]), homeValue: toNumber(homeRow.totals[0]) },
    { label: 'H', value: `${awayRow.totals[1] ?? '-'} - ${homeRow.totals[1] ?? '-'}`, awayValue: toNumber(awayRow.totals[1]), homeValue: toNumber(homeRow.totals[1]) },
    { label: 'E', value: `${awayRow.totals[2] ?? '-'} - ${homeRow.totals[2] ?? '-'}`, awayValue: toNumber(awayRow.totals[2]), homeValue: toNumber(homeRow.totals[2]) },
    { label: 'B', value: `${awayRow.totals[3] ?? '-'} - ${homeRow.totals[3] ?? '-'}`, awayValue: toNumber(awayRow.totals[3]), homeValue: toNumber(homeRow.totals[3]) },
  ];
}

function createMatchId(datePart, awayAbbr, homeAbbr) {
  const compactDate = datePart.replaceAll('.', '');
  const teamHash =
    [...`${awayAbbr}${homeAbbr}`].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000;
  return Number(`3${compactDate}${teamHash.toString().padStart(3, '0')}`);
}

function parseGamesFromLines(lines) {
  const datePart = parseDateLine(lines);
  const games = [];

  for (let index = 0; index < lines.length; index += 1) {
    const awayLabel = lines[index];
    if (!TEAM_KEYS.includes(awayLabel)) continue;

    const rawStatusCandidates = [lines[index + 1], lines[index + 2], lines[index + 3]].map((entry) => entry?.trim() ?? '');
    const statusLine = rawStatusCandidates.find((entry) => isStatusLine(entry));
    if (!statusLine) continue;

    const homeIndex = [index + 2, index + 3, index + 4, index + 5, index + 6].find((candidate) => TEAM_KEYS.includes(lines[candidate]));
    if (!homeIndex) continue;

    const homeLabel = lines[homeIndex];
    const venueIndex = [homeIndex + 1, homeIndex + 2, homeIndex + 3, homeIndex + 4, homeIndex + 5, homeIndex + 6, homeIndex + 7].find((candidate) =>
      /\d{1,2}:\d{2}$/.test(lines[candidate] ?? ''),
    );
    if (!venueIndex) continue;

    const scoreboardIndex = [venueIndex + 1, venueIndex + 2, venueIndex + 3, venueIndex + 4].find((candidate) =>
      (lines[candidate] ?? '').startsWith('경기현황'),
    );
    if (!scoreboardIndex) continue;

    const awayRowStart = [scoreboardIndex + 1, scoreboardIndex + 2, scoreboardIndex + 3, scoreboardIndex + 4, scoreboardIndex + 5, scoreboardIndex + 6, scoreboardIndex + 7, scoreboardIndex + 8, scoreboardIndex + 9, scoreboardIndex + 10, scoreboardIndex + 11, scoreboardIndex + 12, scoreboardIndex + 13, scoreboardIndex + 14, scoreboardIndex + 15, scoreboardIndex + 16, scoreboardIndex + 17, scoreboardIndex + 18, scoreboardIndex + 19].find(
      (candidate) => lines[candidate] === awayLabel,
    );
    if (awayRowStart === undefined) continue;

    const homeRowStart = [awayRowStart + 1, awayRowStart + 2, awayRowStart + 3, awayRowStart + 4, awayRowStart + 5, awayRowStart + 6, awayRowStart + 7, awayRowStart + 8, awayRowStart + 9, awayRowStart + 10, awayRowStart + 11, awayRowStart + 12, awayRowStart + 13, awayRowStart + 14, awayRowStart + 15, awayRowStart + 16, awayRowStart + 17].find(
      (candidate) => lines[candidate] === homeLabel,
    );
    if (homeRowStart === undefined) continue;

    const away = TEAM_MAP[awayLabel];
    const home = TEAM_MAP[homeLabel];
    const { venue, time } = parseVenueTime(lines[venueIndex]);
    const awayCells = parseScoreCells(lines, awayRowStart + 1, [homeLabel, ...TEAM_KEYS]);
    const homeCells = parseScoreCells(lines, homeRowStart + 1, TEAM_KEYS);
    const awayRow = buildScoreRowFromCells(awayCells.values);
    const homeRow = buildScoreRowFromCells(homeCells.values);
    const awayScore = toNumber(awayRow.totals[0]);
    const homeScore = toNumber(homeRow.totals[0]);
    const startDate = `${datePart}T${time}:00+09:00`.replace(/\./g, '-');
    const status = buildStatus(statusLine, awayScore, homeScore);

    if (!isOfficialKboMatch({ awayLabel, homeLabel, venue, statusLine })) {
      index = homeCells.nextIndex - 1;
      continue;
    }

    games.push({
      id: createMatchId(datePart, away.abbr, home.abbr),
      league: 'KBO',
      status,
      dateBucket: resolveDateBucket(startDate),
      startDate,
      homeAbbr: home.abbr,
      awayAbbr: away.abbr,
      homeTeam: home.name,
      awayTeam: away.name,
      homeScore,
      awayScore,
      period: statusLine,
      startTime: `${datePart.replace(/\./g, '-')} ${time}`,
      venue,
      headline: buildHeadline(statusLine, away.name, home.name),
      summary: buildSummary(status, away.name, home.name, venue, awayScore, homeScore),
      keyStats: buildKeyStats(awayRow, homeRow),
      playByPlay: [
        `${statusLine} · ${venue}`,
        `R/H/E/B ${awayLabel} ${awayRow.totals.join('/')} - ${homeLabel} ${homeRow.totals.join('/')}`,
      ],
      lastUpdated: relativeUpdatedAt(),
    });

    index = homeCells.nextIndex - 1;
  }

  return games;
}

export async function fetchKboScoreboard() {
  const response = await fetch(KBO_SCOREBOARD_URL, {
    headers: {
      'User-Agent': 'sport-dashboard/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`KBO 스코어보드 요청 실패 (${response.status})`);
  }

  const html = await response.text();
  const text = normalizeText(html);
  return parseGamesFromLines(text.split('\n').map((line) => line.trim()).filter(Boolean));
}
