import type { AllStandings, LeagueBoxScore, Match } from './types';

export type ScoreboardResponse = {
  matches: Match[];
  lastUpdated: string | null;
  source: 'live' | 'demo';
  message: string | null;
};

export type BoxScoreResponse = {
  boxScore: LeagueBoxScore | null;
  message: string | null;
};

export type StandingsResponse = {
  standings: AllStandings | null;
  message: string | null;
};
