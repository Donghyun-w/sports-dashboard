import type { Match } from './types';

export function simulateLiveUpdate(matches: Match[]): Match[] {
  return matches.map((match) => {
    if (match.status !== 'LIVE') {
      return match;
    }

    const homeBump = Math.random() > 0.72 ? 1 + Math.floor(Math.random() * 3) : 0;
    const awayBump = Math.random() > 0.76 ? 1 + Math.floor(Math.random() * 3) : 0;

    return {
      ...match,
      homeScore: match.homeScore + homeBump,
      awayScore: match.awayScore + awayBump,
      lastUpdated: '방금 전',
    };
  });
}
