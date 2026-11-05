export type League = 'NBA' | 'NFL';
export type MatchStatus = 'LIVE' | 'FINAL' | 'UPCOMING';
export type ScheduleBucket = 'YESTERDAY' | 'TODAY' | 'UPCOMING';

export type Match = {
  id: number;
  league: League;
  status: MatchStatus;
  dateBucket?: ScheduleBucket;
  startDate?: string;
  externalGameId?: string;
  seasonId?: string;
  seriesId?: string;
  homeAbbr?: string;
  awayAbbr?: string;
  homeRecord?: string;
  awayRecord?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: string;
  startTime: string;
  venue: string;
  headline: string;
  summary: string;
  keyStats: Array<{
    label: string;
    value: string;
    homeValue?: number;
    awayValue?: number;
  }>;
  playByPlay?: string[];
  lastUpdated: string;
};

export type BoxScoreTable = {
  title: string;
  headers: string[];
  rows: string[][];
  footer?: string[];
};

export type BoxScoreCategory = {
  key: string;
  name: string;
  awayTable: BoxScoreTable;
  homeTable: BoxScoreTable;
};

export type LeagueBoxScore = {
  league: League;
  notes?: Array<{
    label: string;
    value: string;
  }>;
  categories: BoxScoreCategory[];
};

export type StandingRow = {
  rank: string;
  team: string;
  abbr: string;
  games?: string;
  wins: string;
  losses: string;
  ties?: string;
  winPct: string;
  gb: string;
  diff?: string;
  streak: string;
  l10?: string;
};

export type StandingGroup = {
  groupName: string;
  headers: string[];
  rows: StandingRow[];
};

export type LeagueStandingsData = {
  league: League;
  title: string;
  lastUpdated: string;
  groups: StandingGroup[];
};

export type AllStandings = {
  NBA?: LeagueStandingsData | null;
  NFL?: LeagueStandingsData | null;
};
