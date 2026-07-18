export type League = 'NBA' | 'NFL' | 'KBO';
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

export type KboBoxScoreTable = {
  title: string;
  headers: string[];
  rows: string[][];
  footer?: string[];
};

export type KboBoxScore = {
  notes: Array<{
    label: string;
    value: string;
  }>;
  awayHitters: KboBoxScoreTable;
  homeHitters: KboBoxScoreTable;
  awayPitchers: KboBoxScoreTable;
  homePitchers: KboBoxScoreTable;
};
