/**
 * @typedef {'NBA'|'NFL'} League
 * @typedef {'LIVE'|'FINAL'|'UPCOMING'} MatchStatus
 *
 * @typedef {{
 *   id: number;
 *   league: League;
 *   status: MatchStatus;
 *   homeTeam: string;
 *   awayTeam: string;
 *   homeScore: number;
 *   awayScore: number;
 *   period: string;
 *   startTime: string;
 *   venue: string;
 *   headline: string;
 *   summary: string;
 *   keyStats: Array<{label: string; value: string;}>;
 *   lastUpdated: string;
 * }} Match
 */

export {};
