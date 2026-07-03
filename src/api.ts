import type { Match } from './types';

export type ScoreboardResponse = {
  matches: Match[];
  lastUpdated: string | null;
  source: 'live' | 'demo';
  message: string | null;
};
