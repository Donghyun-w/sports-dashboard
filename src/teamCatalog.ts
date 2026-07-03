import type { League } from './types';

export type TeamCatalogEntry = {
  key: string;
  abbr: string;
  name: string;
  league: League;
  colors: [string, string];
  mark: string;
  newsQuery: string;
  logoUrl?: string;
};

const nbaLogoSlugMap: Record<string, string> = {
  NOP: 'no',
  NYK: 'ny',
  SAS: 'sa',
  UTA: 'utah',
  WAS: 'wsh',
};

function nbaLogo(abbr: string) {
  const slug = nbaLogoSlugMap[abbr] ?? abbr.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nba/500/${slug}.png`;
}

function nflLogo(abbr: string) {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`;
}

const kboLogoCodeMap: Record<string, string> = {
  DSB: 'OB',
  HAN: 'HH',
  KIA: 'HT',
  KIW: 'WO',
  KTW: 'KT',
  LGT: 'LG',
  LOT: 'LT',
  NCD: 'NC',
  SAM: 'SS',
  SSG: 'SK',
};

function kboLogo(abbr: string) {
  const code = kboLogoCodeMap[abbr] ?? abbr;
  return `https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/KBOHome/resources/images/emblem/regular/2026/emblem_${code}.png`;
}

function team(entry: Omit<TeamCatalogEntry, 'key'>): TeamCatalogEntry {
  return {
    ...entry,
    key: `${entry.league}:${entry.abbr}`,
  };
}

export const allTeams: TeamCatalogEntry[] = [
  team({ abbr: 'ATL', name: 'Atlanta Hawks', league: 'NBA', colors: ['#C8102E', '#FDB927'], mark: 'A', newsQuery: 'Atlanta Hawks NBA', logoUrl: nbaLogo('ATL') }),
  team({ abbr: 'BOS', name: 'Boston Celtics', league: 'NBA', colors: ['#007A33', '#BA9653'], mark: '☘', newsQuery: 'Boston Celtics NBA', logoUrl: nbaLogo('BOS') }),
  team({ abbr: 'BKN', name: 'Brooklyn Nets', league: 'NBA', colors: ['#111111', '#FFFFFF'], mark: 'B', newsQuery: 'Brooklyn Nets NBA', logoUrl: nbaLogo('BKN') }),
  team({ abbr: 'CHA', name: 'Charlotte Hornets', league: 'NBA', colors: ['#1D1160', '#00788C'], mark: 'C', newsQuery: 'Charlotte Hornets NBA', logoUrl: nbaLogo('CHA') }),
  team({ abbr: 'CHI', name: 'Chicago Bulls', league: 'NBA', colors: ['#CE1141', '#111111'], mark: 'C', newsQuery: 'Chicago Bulls NBA', logoUrl: nbaLogo('CHI') }),
  team({ abbr: 'CLE', name: 'Cleveland Cavaliers', league: 'NBA', colors: ['#6F263D', '#FFB81C'], mark: 'C', newsQuery: 'Cleveland Cavaliers NBA', logoUrl: nbaLogo('CLE') }),
  team({ abbr: 'DAL', name: 'Dallas Mavericks', league: 'NBA', colors: ['#00538C', '#B8C4CA'], mark: 'D', newsQuery: 'Dallas Mavericks NBA', logoUrl: nbaLogo('DAL') }),
  team({ abbr: 'DEN', name: 'Denver Nuggets', league: 'NBA', colors: ['#0E2240', '#FEC524'], mark: 'D', newsQuery: 'Denver Nuggets NBA', logoUrl: nbaLogo('DEN') }),
  team({ abbr: 'DET', name: 'Detroit Pistons', league: 'NBA', colors: ['#C8102E', '#1D42BA'], mark: 'D', newsQuery: 'Detroit Pistons NBA', logoUrl: nbaLogo('DET') }),
  team({ abbr: 'GSW', name: 'Golden State Warriors', league: 'NBA', colors: ['#1D428A', '#FFC72C'], mark: 'G', newsQuery: 'Golden State Warriors NBA', logoUrl: nbaLogo('GSW') }),
  team({ abbr: 'HOU', name: 'Houston Rockets', league: 'NBA', colors: ['#CE1141', '#111111'], mark: 'H', newsQuery: 'Houston Rockets NBA', logoUrl: nbaLogo('HOU') }),
  team({ abbr: 'IND', name: 'Indiana Pacers', league: 'NBA', colors: ['#002D62', '#FDBB30'], mark: 'I', newsQuery: 'Indiana Pacers NBA', logoUrl: nbaLogo('IND') }),
  team({ abbr: 'LAC', name: 'LA Clippers', league: 'NBA', colors: ['#C8102E', '#1D428A'], mark: 'C', newsQuery: 'LA Clippers NBA', logoUrl: nbaLogo('LAC') }),
  team({ abbr: 'LAL', name: 'Los Angeles Lakers', league: 'NBA', colors: ['#552583', '#FDB927'], mark: 'L', newsQuery: 'Los Angeles Lakers NBA', logoUrl: nbaLogo('LAL') }),
  team({ abbr: 'MEM', name: 'Memphis Grizzlies', league: 'NBA', colors: ['#5D76A9', '#12173F'], mark: 'M', newsQuery: 'Memphis Grizzlies NBA', logoUrl: nbaLogo('MEM') }),
  team({ abbr: 'MIA', name: 'Miami Heat', league: 'NBA', colors: ['#98002E', '#F9A01B'], mark: 'H', newsQuery: 'Miami Heat NBA', logoUrl: nbaLogo('MIA') }),
  team({ abbr: 'MIL', name: 'Milwaukee Bucks', league: 'NBA', colors: ['#00471B', '#EEE1C6'], mark: 'M', newsQuery: 'Milwaukee Bucks NBA', logoUrl: nbaLogo('MIL') }),
  team({ abbr: 'MIN', name: 'Minnesota Timberwolves', league: 'NBA', colors: ['#0C2340', '#236192'], mark: 'M', newsQuery: 'Minnesota Timberwolves NBA', logoUrl: nbaLogo('MIN') }),
  team({ abbr: 'NOP', name: 'New Orleans Pelicans', league: 'NBA', colors: ['#0C2340', '#C8102E'], mark: 'N', newsQuery: 'New Orleans Pelicans NBA', logoUrl: nbaLogo('NOP') }),
  team({ abbr: 'NYK', name: 'New York Knicks', league: 'NBA', colors: ['#006BB6', '#F58426'], mark: 'K', newsQuery: 'New York Knicks NBA', logoUrl: nbaLogo('NYK') }),
  team({ abbr: 'OKC', name: 'Oklahoma City Thunder', league: 'NBA', colors: ['#007AC1', '#EF3B24'], mark: 'O', newsQuery: 'Oklahoma City Thunder NBA', logoUrl: nbaLogo('OKC') }),
  team({ abbr: 'ORL', name: 'Orlando Magic', league: 'NBA', colors: ['#0077C0', '#C4CED4'], mark: 'O', newsQuery: 'Orlando Magic NBA', logoUrl: nbaLogo('ORL') }),
  team({ abbr: 'PHI', name: 'Philadelphia 76ers', league: 'NBA', colors: ['#006BB6', '#ED174C'], mark: 'P', newsQuery: 'Philadelphia 76ers NBA', logoUrl: nbaLogo('PHI') }),
  team({ abbr: 'PHX', name: 'Phoenix Suns', league: 'NBA', colors: ['#1D1160', '#E56020'], mark: 'S', newsQuery: 'Phoenix Suns NBA', logoUrl: nbaLogo('PHX') }),
  team({ abbr: 'POR', name: 'Portland Trail Blazers', league: 'NBA', colors: ['#E03A3E', '#111111'], mark: 'P', newsQuery: 'Portland Trail Blazers NBA', logoUrl: nbaLogo('POR') }),
  team({ abbr: 'SAC', name: 'Sacramento Kings', league: 'NBA', colors: ['#5A2D81', '#63727A'], mark: 'S', newsQuery: 'Sacramento Kings NBA', logoUrl: nbaLogo('SAC') }),
  team({ abbr: 'SAS', name: 'San Antonio Spurs', league: 'NBA', colors: ['#111111', '#C4CED4'], mark: 'S', newsQuery: 'San Antonio Spurs NBA', logoUrl: nbaLogo('SAS') }),
  team({ abbr: 'TOR', name: 'Toronto Raptors', league: 'NBA', colors: ['#CE1141', '#111111'], mark: 'T', newsQuery: 'Toronto Raptors NBA', logoUrl: nbaLogo('TOR') }),
  team({ abbr: 'UTA', name: 'Utah Jazz', league: 'NBA', colors: ['#002B5C', '#F9A01B'], mark: 'U', newsQuery: 'Utah Jazz NBA', logoUrl: nbaLogo('UTA') }),
  team({ abbr: 'WAS', name: 'Washington Wizards', league: 'NBA', colors: ['#002B5C', '#E31837'], mark: 'W', newsQuery: 'Washington Wizards NBA', logoUrl: nbaLogo('WAS') }),

  team({ abbr: 'ARI', name: 'Arizona Cardinals', league: 'NFL', colors: ['#97233F', '#000000'], mark: 'A', newsQuery: 'Arizona Cardinals NFL', logoUrl: nflLogo('ARI') }),
  team({ abbr: 'ATL', name: 'Atlanta Falcons', league: 'NFL', colors: ['#A71930', '#000000'], mark: 'F', newsQuery: 'Atlanta Falcons NFL', logoUrl: nflLogo('ATL') }),
  team({ abbr: 'BAL', name: 'Baltimore Ravens', league: 'NFL', colors: ['#241773', '#000000'], mark: 'R', newsQuery: 'Baltimore Ravens NFL', logoUrl: nflLogo('BAL') }),
  team({ abbr: 'BUF', name: 'Buffalo Bills', league: 'NFL', colors: ['#00338D', '#C60C30'], mark: 'B', newsQuery: 'Buffalo Bills NFL', logoUrl: nflLogo('BUF') }),
  team({ abbr: 'CAR', name: 'Carolina Panthers', league: 'NFL', colors: ['#0085CA', '#101820'], mark: 'C', newsQuery: 'Carolina Panthers NFL', logoUrl: nflLogo('CAR') }),
  team({ abbr: 'CHI', name: 'Chicago Bears', league: 'NFL', colors: ['#0B162A', '#C83803'], mark: 'B', newsQuery: 'Chicago Bears NFL', logoUrl: nflLogo('CHI') }),
  team({ abbr: 'CIN', name: 'Cincinnati Bengals', league: 'NFL', colors: ['#FB4F14', '#111111'], mark: 'B', newsQuery: 'Cincinnati Bengals NFL', logoUrl: nflLogo('CIN') }),
  team({ abbr: 'CLE', name: 'Cleveland Browns', league: 'NFL', colors: ['#311D00', '#FF3C00'], mark: 'B', newsQuery: 'Cleveland Browns NFL', logoUrl: nflLogo('CLE') }),
  team({ abbr: 'DAL', name: 'Dallas Cowboys', league: 'NFL', colors: ['#041E42', '#869397'], mark: 'D', newsQuery: 'Dallas Cowboys NFL', logoUrl: nflLogo('DAL') }),
  team({ abbr: 'DEN', name: 'Denver Broncos', league: 'NFL', colors: ['#FB4F14', '#002244'], mark: 'D', newsQuery: 'Denver Broncos NFL', logoUrl: nflLogo('DEN') }),
  team({ abbr: 'DET', name: 'Detroit Lions', league: 'NFL', colors: ['#0076B6', '#B0B7BC'], mark: 'L', newsQuery: 'Detroit Lions NFL', logoUrl: nflLogo('DET') }),
  team({ abbr: 'GB', name: 'Green Bay Packers', league: 'NFL', colors: ['#203731', '#FFB612'], mark: 'G', newsQuery: 'Green Bay Packers NFL', logoUrl: nflLogo('GB') }),
  team({ abbr: 'HOU', name: 'Houston Texans', league: 'NFL', colors: ['#03202F', '#A71930'], mark: 'H', newsQuery: 'Houston Texans NFL', logoUrl: nflLogo('HOU') }),
  team({ abbr: 'IND', name: 'Indianapolis Colts', league: 'NFL', colors: ['#002C5F', '#A2AAAD'], mark: 'I', newsQuery: 'Indianapolis Colts NFL', logoUrl: nflLogo('IND') }),
  team({ abbr: 'JAX', name: 'Jacksonville Jaguars', league: 'NFL', colors: ['#006778', '#9F792C'], mark: 'J', newsQuery: 'Jacksonville Jaguars NFL', logoUrl: nflLogo('JAX') }),
  team({ abbr: 'KC', name: 'Kansas City Chiefs', league: 'NFL', colors: ['#E31837', '#FFB81C'], mark: 'KC', newsQuery: 'Kansas City Chiefs NFL', logoUrl: nflLogo('KC') }),
  team({ abbr: 'LAC', name: 'Los Angeles Chargers', league: 'NFL', colors: ['#0080C6', '#FFC20E'], mark: 'C', newsQuery: 'Los Angeles Chargers NFL', logoUrl: nflLogo('LAC') }),
  team({ abbr: 'LAR', name: 'Los Angeles Rams', league: 'NFL', colors: ['#003594', '#FFA300'], mark: 'R', newsQuery: 'Los Angeles Rams NFL', logoUrl: nflLogo('LAR') }),
  team({ abbr: 'LV', name: 'Las Vegas Raiders', league: 'NFL', colors: ['#000000', '#A5ACAF'], mark: 'R', newsQuery: 'Las Vegas Raiders NFL', logoUrl: nflLogo('LV') }),
  team({ abbr: 'MIA', name: 'Miami Dolphins', league: 'NFL', colors: ['#008E97', '#FC4C02'], mark: 'M', newsQuery: 'Miami Dolphins NFL', logoUrl: nflLogo('MIA') }),
  team({ abbr: 'MIN', name: 'Minnesota Vikings', league: 'NFL', colors: ['#4F2683', '#FFC62F'], mark: 'V', newsQuery: 'Minnesota Vikings NFL', logoUrl: nflLogo('MIN') }),
  team({ abbr: 'NE', name: 'New England Patriots', league: 'NFL', colors: ['#002244', '#C60C30'], mark: 'P', newsQuery: 'New England Patriots NFL', logoUrl: nflLogo('NE') }),
  team({ abbr: 'NO', name: 'New Orleans Saints', league: 'NFL', colors: ['#D3BC8D', '#101820'], mark: 'S', newsQuery: 'New Orleans Saints NFL', logoUrl: nflLogo('NO') }),
  team({ abbr: 'NYG', name: 'New York Giants', league: 'NFL', colors: ['#0B2265', '#A71930'], mark: 'G', newsQuery: 'New York Giants NFL', logoUrl: nflLogo('NYG') }),
  team({ abbr: 'NYJ', name: 'New York Jets', league: 'NFL', colors: ['#125740', '#FFFFFF'], mark: 'J', newsQuery: 'New York Jets NFL', logoUrl: nflLogo('NYJ') }),
  team({ abbr: 'PHI', name: 'Philadelphia Eagles', league: 'NFL', colors: ['#004C54', '#A5ACAF'], mark: 'E', newsQuery: 'Philadelphia Eagles NFL', logoUrl: nflLogo('PHI') }),
  team({ abbr: 'PIT', name: 'Pittsburgh Steelers', league: 'NFL', colors: ['#FFB612', '#101820'], mark: 'P', newsQuery: 'Pittsburgh Steelers NFL', logoUrl: nflLogo('PIT') }),
  team({ abbr: 'SEA', name: 'Seattle Seahawks', league: 'NFL', colors: ['#002244', '#69BE28'], mark: 'S', newsQuery: 'Seattle Seahawks NFL', logoUrl: nflLogo('SEA') }),
  team({ abbr: 'SF', name: 'San Francisco 49ers', league: 'NFL', colors: ['#AA0000', '#B3995D'], mark: 'SF', newsQuery: 'San Francisco 49ers NFL', logoUrl: nflLogo('SF') }),
  team({ abbr: 'TB', name: 'Tampa Bay Buccaneers', league: 'NFL', colors: ['#D50A0A', '#34302B'], mark: 'T', newsQuery: 'Tampa Bay Buccaneers NFL', logoUrl: nflLogo('TB') }),
  team({ abbr: 'TEN', name: 'Tennessee Titans', league: 'NFL', colors: ['#0C2340', '#4B92DB'], mark: 'T', newsQuery: 'Tennessee Titans NFL', logoUrl: nflLogo('TEN') }),
  team({ abbr: 'WSH', name: 'Washington Commanders', league: 'NFL', colors: ['#5A1414', '#FFB612'], mark: 'W', newsQuery: 'Washington Commanders NFL', logoUrl: nflLogo('WSH') }),

  team({ abbr: 'DSB', name: 'Doosan Bears', league: 'KBO', colors: ['#131230', '#ED1C24'], mark: 'DB', newsQuery: 'Doosan Bears KBO', logoUrl: kboLogo('DSB') }),
  team({ abbr: 'HAN', name: 'Hanwha Eagles', league: 'KBO', colors: ['#FF6600', '#1E3765'], mark: 'HE', newsQuery: 'Hanwha Eagles KBO', logoUrl: kboLogo('HAN') }),
  team({ abbr: 'KIA', name: 'KIA Tigers', league: 'KBO', colors: ['#EA0029', '#111111'], mark: 'K', newsQuery: 'KIA Tigers KBO', logoUrl: kboLogo('KIA') }),
  team({ abbr: 'KIW', name: 'Kiwoom Heroes', league: 'KBO', colors: ['#5B0D1B', '#B79E6E'], mark: 'KH', newsQuery: 'Kiwoom Heroes KBO', logoUrl: kboLogo('KIW') }),
  team({ abbr: 'KTW', name: 'KT Wiz', league: 'KBO', colors: ['#111111', '#ED1B2F'], mark: 'KT', newsQuery: 'KT Wiz KBO', logoUrl: kboLogo('KTW') }),
  team({ abbr: 'LGT', name: 'LG Twins', league: 'KBO', colors: ['#A50034', '#C6C9CA'], mark: 'LG', newsQuery: 'LG Twins KBO', logoUrl: kboLogo('LGT') }),
  team({ abbr: 'LOT', name: 'Lotte Giants', league: 'KBO', colors: ['#002955', '#E31B23'], mark: 'LT', newsQuery: 'Lotte Giants KBO', logoUrl: kboLogo('LOT') }),
  team({ abbr: 'NCD', name: 'NC Dinos', league: 'KBO', colors: ['#1D467D', '#C2A25D'], mark: 'NC', newsQuery: 'NC Dinos KBO', logoUrl: kboLogo('NCD') }),
  team({ abbr: 'SAM', name: 'Samsung Lions', league: 'KBO', colors: ['#074CA1', '#FFFFFF'], mark: 'SL', newsQuery: 'Samsung Lions KBO', logoUrl: kboLogo('SAM') }),
  team({ abbr: 'SSG', name: 'SSG Landers', league: 'KBO', colors: ['#CE0E2D', '#FDB827'], mark: 'SSG', newsQuery: 'SSG Landers KBO', logoUrl: kboLogo('SSG') }),
];

export const teamsByKey = Object.fromEntries(allTeams.map((entry) => [entry.key, entry])) as Record<string, TeamCatalogEntry>;

export function getTeamByAbbr(abbr?: string, league?: League) {
  if (!abbr) {
    return undefined;
  }

  return allTeams.find((entry) => entry.abbr === abbr && (!league || entry.league === league));
}

export function getTeamByKey(key?: string) {
  if (!key) {
    return undefined;
  }

  return teamsByKey[key];
}

export function getLeagueTeams(league: 'ALL' | League) {
  return allTeams.filter((entry) => league === 'ALL' || entry.league === league);
}

export function resolveLeagueFromAbbr(abbr: string): League {
  return getTeamByAbbr(abbr)?.league ?? 'NBA';
}
