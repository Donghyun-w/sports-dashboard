export type League = 'NBA' | 'NFL' | 'KBO';
export type MatchStatus = 'LIVE' | 'FINAL' | 'UPCOMING';
export type ScheduleBucket = 'YESTERDAY' | 'TODAY' | 'UPCOMING';

export type Match = {
  id: number;
  league: League;
  status: MatchStatus;
  dateBucket?: ScheduleBucket;
  startDate?: string;
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
