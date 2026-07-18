import type { KboBoxScore, Match } from './types';

export type ScoreboardResponse = {
  matches: Match[];
  lastUpdated: string | null;
  source: 'live' | 'demo';
  message: string | null;
};

export type KboBoxScoreResponse = {
  boxScore: KboBoxScore | null;
  message: string | null;
};
