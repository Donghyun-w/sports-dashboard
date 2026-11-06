import { useEffect, useMemo, useState } from 'react';
import type { BoxScoreResponse, StandingsResponse } from './api';
import scorelineLogo from './assets/scoreline-logo.svg';
import { getLeagueTeams, getTeamByAbbr, getTeamByKey, resolveLeagueFromAbbr, type TeamCatalogEntry } from './teamCatalog';
import { getTeamBrand, TeamEmblem } from './teamBranding';
import type { AllStandings, BoxScoreCategory, BoxScoreTable, League, Match, LeagueBoxScore, ScheduleBucket } from './types';

type LeagueFilter = 'ALL' | League;
type DetailTab = 'stats' | 'standings' | 'records';

type ApiState = {
  matches: Match[];
  lastUpdated: string | null;
  source: 'live' | 'loading';
  message: string | null;
};

type TeamNewsArticle = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category?: string;
  displayDate?: string;
};

const leagueFilters: LeagueFilter[] = ['ALL', 'NBA', 'NFL'];
const dateFilters: ScheduleBucket[] = ['YESTERDAY', 'TODAY', 'UPCOMING'];
const dateFilterLabel: Record<ScheduleBucket, string> = {
  YESTERDAY: 'Yesterday',
  TODAY: 'Today',
  UPCOMING: 'Upcoming',
};
const favoriteStorageKey = 'sport-dashboard-favorites';

function getApiBase() {
  if (typeof window === 'undefined') return '';
  if (window.location.port === '5173') {
    const hostname = window.location.hostname || '127.0.0.1';
    return `http://${hostname}:8787`;
  }
  return '';
}

async function fetchApi(path: string): Promise<Response> {
  const directUrl = `${getApiBase()}${path}`;
  try {
    const res = await fetch(directUrl);
    if (res.ok) return res;
  } catch {
    // direct connection fallback
  }
  return fetch(path);
}

function App() {
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<ScheduleBucket>('TODAY');
  const [detailTab, setDetailTab] = useState<DetailTab>('stats');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [apiState, setApiState] = useState<ApiState>({
    matches: [],
    lastUpdated: null,
    source: 'loading',
    message: null,
  });
  const [selectedMatchId, setSelectedMatchId] = useState<number>(0);
  const [scheduleTeamKey, setScheduleTeamKey] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const saved = window.localStorage.getItem(favoriteStorageKey);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [selectedTeamKey, setSelectedTeamKey] = useState<string>('');
  const [teamNewsState, setTeamNewsState] = useState<{
    loading: boolean;
    message: string | null;
    articles: TeamNewsArticle[];
  }>({
    loading: false,
    message: null,
    articles: [],
  });
  const [boxScoreState, setBoxScoreState] = useState<{
    loading: boolean;
    message: string | null;
    boxScore: LeagueBoxScore | null;
    matchKey: string | null;
  }>({
    loading: false,
    message: null,
    boxScore: null,
    matchKey: null,
  });
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('');
  const [boxScoreTeamSide, setBoxScoreTeamSide] = useState<'away' | 'home'>('away');
  const [standingsState, setStandingsState] = useState<{
    loading: boolean;
    standings: AllStandings | null;
    message: string | null;
  }>({
    loading: false,
    standings: null,
    message: null,
  });

  useEffect(() => {
    void fetchScoreboard();
    void fetchStandings();
    const timer = window.setInterval(() => {
      void fetchScoreboard();
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(favoriteStorageKey, JSON.stringify(favoriteTeams));
  }, [favoriteTeams]);

  useEffect(() => {
    if (!scheduleTeamKey) {
      return;
    }

    const scopedTeam = getTeamByKey(scheduleTeamKey);
    if (scopedTeam && leagueFilter !== 'ALL' && scopedTeam.league !== leagueFilter) {
      setScheduleTeamKey(null);
    }
  }, [leagueFilter, scheduleTeamKey]);

  const filteredMatches = useMemo(() => {
    const scopedTeam = scheduleTeamKey ? getTeamByKey(scheduleTeamKey) : null;

    const scopedMatches = apiState.matches
      .filter((match) => {
        const leagueOk = leagueFilter === 'ALL' || match.league === leagueFilter;
        const favoriteOk = favoritesOnly ? isFavoriteMatch(match, favoriteTeams) : true;
        const teamOk = scopedTeam
          ? match.league === scopedTeam.league && (match.homeAbbr === scopedTeam.abbr || match.awayAbbr === scopedTeam.abbr)
          : true;
        return leagueOk && favoriteOk && teamOk;
      });

    const dateMatches = scopedMatches.filter((match) => matchesScheduleBucket(match, dateFilter));
    const visibleMatches = dateFilter === 'YESTERDAY' && dateMatches.length === 0
      ? mostRecentCompletedDayMatches(scopedMatches)
      : dateMatches;

    return visibleMatches
      .sort((left, right) => {
        const leftFavorite = isFavoriteMatch(left, favoriteTeams);
        const rightFavorite = isFavoriteMatch(right, favoriteTeams);

        if (leftFavorite !== rightFavorite) {
          return leftFavorite ? -1 : 1;
        }

        return left.id - right.id;
      });
  }, [apiState.matches, dateFilter, favoriteTeams, favoritesOnly, leagueFilter, scheduleTeamKey]);

  const leagueUpcomingMatches = useMemo(() => {
    if (leagueFilter === 'ALL') return [];

    return apiState.matches
      .filter((match) => match.league === leagueFilter && matchesScheduleBucket(match, 'UPCOMING'))
      .sort(sortByDateAsc);
  }, [apiState.matches, leagueFilter]);

  const teamProfiles = useMemo(() => {
    return getLeagueTeams(leagueFilter).sort((left, right) => {
      const leftFavorite = isFavoriteTeam(favoriteTeams, left.league, left.abbr);
      const rightFavorite = isFavoriteTeam(favoriteTeams, right.league, right.abbr);
      if (leftFavorite !== rightFavorite) {
        return leftFavorite ? -1 : 1;
      }
      if (left.league !== right.league && leagueFilter === 'ALL') {
        return left.league.localeCompare(right.league);
      }
      return left.name.localeCompare(right.name);
    });
  }, [favoriteTeams, leagueFilter]);

  const visibleTeamProfiles = useMemo(() => {
    const query = teamSearchQuery.trim().toLowerCase();

    if (!query) {
      return teamProfiles;
    }

    return teamProfiles.filter((team) => {
      return (
        team.name.toLowerCase().includes(query) ||
        team.abbr.toLowerCase().includes(query) ||
        team.league.toLowerCase().includes(query)
      );
    });
  }, [teamProfiles, teamSearchQuery]);

  useEffect(() => {
    if (!filteredMatches.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId(filteredMatches[0]?.id ?? 0);
    }
  }, [filteredMatches, selectedMatchId]);

  useEffect(() => {
    if (!teamProfiles.some((team) => team.key === selectedTeamKey)) {
      setSelectedTeamKey(teamProfiles[0]?.key ?? '');
    }
  }, [selectedTeamKey, teamProfiles]);

  useEffect(() => {
    if (visibleTeamProfiles.length > 0 && !visibleTeamProfiles.some((team) => team.key === selectedTeamKey)) {
      setSelectedTeamKey(visibleTeamProfiles[0]?.key ?? '');
    }
  }, [selectedTeamKey, visibleTeamProfiles]);

  useEffect(() => {
    if (favoriteTeams.length === 0 && favoritesOnly) {
      setFavoritesOnly(false);
    }
  }, [favoriteTeams.length, favoritesOnly]);

  useEffect(() => {
    setSelectedCategoryKey('');
    setBoxScoreTeamSide('away');
  }, [selectedMatchId]);

  const selectedMatch = filteredMatches.find((match) => match.id === selectedMatchId) ?? filteredMatches[0] ?? null;
  const favoriteProfiles = favoriteTeams
    .map((favorite) => resolveFavoriteTeam(favorite))
    .filter((team): team is TeamCatalogEntry => Boolean(team));
  const favoriteBrands = favoriteProfiles.map((team) => ({
    ...getTeamBrand(team.name, team.abbr, team.league),
    key: team.key,
    league: team.league,
  }));
  const selectedTeam = (getTeamByKey(selectedTeamKey) ?? teamProfiles[0] ?? null) as TeamCatalogEntry | null;
  const scopedScheduleTeam = (scheduleTeamKey ? getTeamByKey(scheduleTeamKey) : null) as TeamCatalogEntry | null;
  const favoriteRecentMatches = useMemo(() => {
    return favoriteProfiles.map((team) => {
      const match = apiState.matches
        .filter(
          (item) =>
            item.league === team.league &&
            (item.homeAbbr === team.abbr || item.awayAbbr === team.abbr) &&
            item.status !== 'UPCOMING',
        )
        .sort(sortFavoriteRecentMatches)[0];

      return { team, match: match ?? null };
    });
  }, [apiState.matches, favoriteProfiles]);
  const activeCategory = useMemo(() => {
    const categories = boxScoreState.boxScore?.categories;
    if (!categories || categories.length === 0) return null;
    return categories.find((c) => c.key === selectedCategoryKey) ?? categories[0];
  }, [boxScoreState.boxScore?.categories, selectedCategoryKey]);

  const activeBoxTable = useMemo(() => {
    if (!activeCategory) return null;
    return boxScoreTeamSide === 'away' ? activeCategory.awayTable : activeCategory.homeTable;
  }, [activeCategory, boxScoreTeamSide]);

  const activeBoxTitle = useMemo(() => {
    if (!selectedMatch || !activeCategory) return '';
    const teamName = boxScoreTeamSide === 'away' ? selectedMatch.awayTeam : selectedMatch.homeTeam;
    return `${teamName} · ${activeCategory.name}`;
  }, [activeCategory, boxScoreTeamSide, selectedMatch]);

  useEffect(() => {
    if (!selectedTeam) {
      return;
    }

    let cancelled = false;

    async function fetchTeamNews() {
      setTeamNewsState({
        loading: true,
        message: null,
        articles: [],
      });

      try {
        if (!selectedTeam) return;
        const response = await fetchApi(
          `/api/team-news?team=${encodeURIComponent(selectedTeam.name)}&league=${encodeURIComponent(
            selectedTeam.league,
          )}&query=${encodeURIComponent(selectedTeam.newsQuery)}`,
        );
        const text = await response.text();
        let payload: { articles?: TeamNewsArticle[]; message?: string } | null = null;
        try {
          payload = JSON.parse(text);
        } catch {
          payload = null;
        }

        if (!response.ok || !payload) {
          throw new Error(payload?.message ?? 'Unable to load team news.');
        }

        if (!cancelled) {
          setTeamNewsState({
            loading: false,
            message: payload.message ?? null,
            articles: payload.articles ?? [],
          });
        }
      } catch (error) {
        if (!cancelled) {
          setTeamNewsState({
            loading: false,
            message: error instanceof Error ? error.message : 'An error occurred while loading team news.',
            articles: [],
          });
        }
      }
    }

    void fetchTeamNews();

    return () => {
      cancelled = true;
    };
  }, [selectedTeam]);

  useEffect(() => {
    if (!selectedMatch) {
      setBoxScoreState({
        loading: false,
        message: null,
        boxScore: null,
        matchKey: null,
      });
      return;
    }

    let cancelled = false;

    async function fetchBoxScore() {
      if (!selectedMatch) return;
      const matchKey = `${selectedMatch.league}-${selectedMatch.id}-${selectedMatch.externalGameId ?? ''}`;
      setBoxScoreState({
        loading: true,
        message: null,
        boxScore: null,
        matchKey,
      });

      try {
        const query = new URLSearchParams({
          league: selectedMatch.league,
          gameId: selectedMatch.externalGameId ?? String(selectedMatch.id),
          homeTeam: selectedMatch.homeTeam,
          awayTeam: selectedMatch.awayTeam,
          homeAbbr: selectedMatch.homeAbbr ?? '',
          awayAbbr: selectedMatch.awayAbbr ?? '',
          seasonId: selectedMatch.seasonId ?? selectedMatch.startDate?.slice(0, 4) ?? '',
          seriesId: selectedMatch.seriesId ?? '0',
          gameDate: selectedMatch.startDate ? selectedMatch.startDate.slice(0, 10).replace(/-/g, '') : '',
        });
        const response = await fetchApi(`/api/boxscore?${query.toString()}`);
        const text = await response.text();
        let payload: BoxScoreResponse | null = null;
        try {
          payload = JSON.parse(text);
        } catch {
          payload = null;
        }

        if (!response.ok || !payload) {
          throw new Error(payload?.message ?? `Unable to load ${selectedMatch.league} box score.`);
        }

        if (!cancelled) {
          setBoxScoreState({
            loading: false,
            message: payload.message,
            boxScore: payload.boxScore,
            matchKey,
          });
          if (payload.boxScore?.categories?.[0]) {
            setSelectedCategoryKey(payload.boxScore.categories[0].key);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setBoxScoreState({
            loading: false,
            message: error instanceof Error ? error.message : `An error occurred while loading the ${selectedMatch.league} box score.`,
            boxScore: null,
            matchKey,
          });
        }
      }
    }

    void fetchBoxScore();

    return () => {
      cancelled = true;
    };
  }, [
    selectedMatch?.id,
    selectedMatch?.league,
    selectedMatch?.externalGameId,
    selectedMatch?.homeTeam,
    selectedMatch?.awayTeam,
    selectedMatch?.seasonId,
    selectedMatch?.seriesId,
    selectedMatch?.startDate,
  ]);

  async function fetchScoreboard() {
    try {
      const response = await fetchApi('/api/scoreboard');
      const text = await response.text();
      let payload: { matches?: Match[]; lastUpdated?: string | null; source?: 'live' | 'demo'; message?: string | null } | null = null;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }

      if (!response.ok || !payload) {
        throw new Error(payload?.message ?? 'Unable to load score data.');
      }

      setApiState((current) => {
        const cachedMatches = current.source === 'live' ? current.matches : [];
        const matches = mergeScoreboardMatches(payload.matches ?? [], cachedMatches);

        return {
          matches,
          lastUpdated: payload.lastUpdated ?? null,
          source: matches.length > 0 ? 'live' : 'loading',
          message: payload.message ?? null,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setApiState((current) => ({
        ...current,
        source: current.matches.length > 0 ? 'live' : 'loading',
        message,
      }));
    }
  }

  async function fetchStandings() {
    setStandingsState((curr) => ({ ...curr, loading: true }));
    try {
      const response = await fetchApi(`/api/standings?league=ALL&_t=${Date.now()}`);
      const payload: StandingsResponse = await response.json();
      setStandingsState({
        loading: false,
        standings: payload.standings,
        message: payload.message,
      });
    } catch {
      setStandingsState({
        loading: false,
        standings: null,
        message: 'Unable to load standings.',
      });
    }
  }

  function toggleFavorite(teamAbbr?: string, league?: League) {
    if (!teamAbbr) {
      return;
    }

    const key = buildFavoriteKey(league, teamAbbr);
    setFavoriteTeams((current) => {
      const active = current.includes(key) || current.includes(teamAbbr);
      if (active) {
        return current.filter((favorite) => favorite !== key && favorite !== teamAbbr);
      }
      return [...current, key];
    });
  }

  if (apiState.source !== 'live') {
    return (
      <main className="loading-shell" aria-live="polite" aria-busy="true">
        <section className="loading-card">
          <span className="loading-spinner" aria-hidden="true" />
          <p className="eyebrow">LIVE SPORTS CENTER</p>
          <div className="brand-lockup loading-brand">
            <img className="brand-logo" src={scorelineLogo} alt="Scoreline" />
            <h1>Scoreline</h1>
          </div>
          <p>Loading live sports data.</p>
          {apiState.message ? (
            <>
              <span className="loading-message">{apiState.message}</span>
              <button className="loading-retry" onClick={() => void fetchScoreboard()}>
                Try again
              </button>
            </>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <div className="desktop-shell">
      <header className="hero">
        <div className="hero-copy">
          <div className="brand-lockup">
            <img className="brand-logo" src={scorelineLogo} alt="Scoreline" />
            <h1>Scoreline</h1>
          </div>
        </div>

        <div className="hero-actions">
          <div className="top-pills">
            {leagueFilters.map((filter) => (
              <button
                key={filter}
                className={`top-pill ${leagueFilter === filter ? 'active' : ''}`}
                onClick={() => {
                  setLeagueFilter(filter);
                  setScheduleTeamKey(null);
                }}
              >
                {filter === 'ALL' ? 'All Leagues' : filter}
              </button>
            ))}
          </div>

        </div>
      </header>

      {favoriteBrands.length > 0 ? (
        <section className="favorite-strip">
          <span className="section-label">Favorites</span>
          <div className="favorite-list">
            {favoriteBrands.map((brand) => (
              <button
                key={brand.key}
                className="favorite-chip"
                onClick={() => {
                  setLeagueFilter(brand.league);
                  setSelectedTeamKey(brand.key);
                  setScheduleTeamKey(brand.key);
                }}
              >
                <TeamEmblem team={brand.abbr} abbr={brand.abbr} league={brand.league} size="sm" />
                <span>{brand.abbr}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {favoriteRecentMatches.length > 0 ? (
        <section className="favorite-focus">
          <div className="panel-header">
            <div>
              <p className="section-label">Favorite Watch</p>
              <h2>Favorite Team Updates</h2>
            </div>
            <span className="match-count">Latest game per team</span>
          </div>
          <div className="favorite-match-grid favorite-team-grid">
            {favoriteRecentMatches.map(({ team, match }) => (
              <FavoriteRecentCard
                key={team.key}
                team={team}
                match={match}
                onSelectMatch={(selected) => {
                  setLeagueFilter(selected.league);
                  setDateFilter(resolveMatchBucket(selected));
                  setScheduleTeamKey(null);
                  setSelectedMatchId(selected.id);
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {teamProfiles.length > 0 ? (
        <section className="team-strip">
          <div className="panel-header">
            <div>
              <p className="section-label">Teams</p>
              <h2>Browse by Team</h2>
            </div>
            {selectedTeam ? (
              <div className="team-strip-actions">
                <span className="match-count">{selectedTeam.name}</span>
                <button
                  className={`team-favorite-button ${isFavoriteTeam(favoriteTeams, selectedTeam.league, selectedTeam.abbr) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(selectedTeam.abbr, selectedTeam.league)}
                  aria-pressed={isFavoriteTeam(favoriteTeams, selectedTeam.league, selectedTeam.abbr)}
                >
                  {isFavoriteTeam(favoriteTeams, selectedTeam.league, selectedTeam.abbr) ? '★ Favorited' : '☆ Add Favorite'}
                </button>
              </div>
            ) : null}
          </div>

          <div className="team-tools">
            <label className="team-search">
              <span>Search team</span>
              <input
                type="text"
                value={teamSearchQuery}
                onChange={(event) => setTeamSearchQuery(event.target.value)}
                placeholder="Search team, abbreviation, or league"
              />
            </label>
            <span className="team-search-meta">
              {visibleTeamProfiles.length} / {teamProfiles.length} teams
            </span>
          </div>

          <div className="team-tabs compact">
            {visibleTeamProfiles.map((team) => (
              <button
                key={team.key}
                className={`team-tab ${selectedTeamKey === team.key ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTeamKey(team.key);
                  setScheduleTeamKey(team.key);
                }}
              >
                <TeamEmblem team={team.name} abbr={team.abbr} league={team.league} size="sm" />
                <span>{team.abbr}</span>
              </button>
            ))}
          </div>
          {visibleTeamProfiles.length === 0 ? <div className="empty-card team-empty">No teams found.</div> : null}
        </section>
      ) : null}

      <section className="board-layout">
        <aside className="schedule-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Schedule</p>
              <h2>{scopedScheduleTeam ? `${scopedScheduleTeam.name} · ${dateFilterLabel[dateFilter]}` : dateFilterLabel[dateFilter]}</h2>
              {scopedScheduleTeam ? (
                <div className="schedule-scope">
                  <TeamEmblem team={scopedScheduleTeam.name} abbr={scopedScheduleTeam.abbr} league={scopedScheduleTeam.league} size="sm" />
                  <span>{scopedScheduleTeam.name} only</span>
                </div>
              ) : null}
            </div>
            <span className="match-count">{filteredMatches.length} games</span>
          </div>

          {scopedScheduleTeam ? (
            <div className="schedule-tabs">
              <button className="schedule-tab active" onClick={() => setScheduleTeamKey(null)}>
                All Teams
              </button>
            </div>
          ) : null}

          <div className="schedule-tabs">
            {dateFilters.map((filter) => (
              <button
                key={filter}
                className={`schedule-tab ${dateFilter === filter ? 'active' : ''}`}
                onClick={() => setDateFilter(filter)}
              >
                {dateFilterLabel[filter]}
              </button>
            ))}
            {favoriteTeams.length > 0 ? (
              <button
                className={`schedule-tab ${favoritesOnly ? 'active' : ''}`}
                onClick={() => setFavoritesOnly((current) => !current)}
              >
                Favorites Only
              </button>
            ) : null}
          </div>

          <div className="match-list">
            {filteredMatches.map((match) => (
              <article
                key={match.id}
                className={`match-row ${selectedMatch?.id === match.id ? 'selected' : ''}`}
                onClick={() => setSelectedMatchId(match.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setSelectedMatchId(match.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="row-top">
                  <span className={`badge ${match.status.toLowerCase()}`}>{renderCenterStatus(match)}</span>
                  <div className="row-top-right">
                    {isFavoriteMatch(match, favoriteTeams) ? <span className="favorite-mark">★</span> : null}
                    <span className="league-badge">{match.league}</span>
                  </div>
                </div>

                <div className="row-main">
                  <MatchTeam side="away" match={match} favoriteTeams={favoriteTeams} onToggleFavorite={toggleFavorite} />
                  <div className="center-score">
                    <strong>{match.awayScore}</strong>
                    <span>:</span>
                    <strong>{match.homeScore}</strong>
                  </div>
                  <MatchTeam side="home" match={match} favoriteTeams={favoriteTeams} onToggleFavorite={toggleFavorite} />
                </div>

                <div className="row-foot">
                  <span>{match.venue}</span>
                  <span>{match.startTime}</span>
                </div>
              </article>
            ))}

            {filteredMatches.length === 0 ? (
              <div className="empty-card schedule-empty">
                <p>No games match the selected filters.</p>
                {leagueFilter !== 'ALL' && dateFilter !== 'UPCOMING' && leagueUpcomingMatches.length > 0 ? (
                  <button
                    className="empty-action"
                    onClick={() => {
                      setDateFilter('UPCOMING');
                      setFavoritesOnly(false);
                      setScheduleTeamKey(null);
                    }}
                  >
                    View {leagueFilter} upcoming games · {leagueUpcomingMatches.length} games
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>

        <section className="detail-panel">
          {selectedMatch ? (
            <>
              <div className="detail-top">
                <div>
                  <p className="section-label">Match Detail</p>
                  <h2>
                    {selectedMatch.awayTeam} vs {selectedMatch.homeTeam}
                  </h2>
                  <p className="detail-meta">
                    {selectedMatch.venue} · {selectedMatch.startTime}
                  </p>
                </div>
                <span className={`status-chip ${selectedMatch.status.toLowerCase()}`}>{selectedMatch.status}</span>
              </div>

              <div className="score-hero">
                <HeroTeam side="away" match={selectedMatch} favoriteTeams={favoriteTeams} onToggleFavorite={toggleFavorite} />
                <div className="hero-center">
                  <p className="mini-league">{selectedMatch.league}</p>
                  <span className={`badge ${selectedMatch.status.toLowerCase()}`}>{renderCenterStatus(selectedMatch)}</span>
                  <h3>{selectedMatch.headline}</h3>
                  <p>{selectedMatch.summary}</p>
                </div>
                <HeroTeam side="home" match={selectedMatch} favoriteTeams={favoriteTeams} onToggleFavorite={toggleFavorite} />
              </div>

              <div className="detail-tabs">
                <button className={detailTab === 'stats' ? 'active' : ''} onClick={() => setDetailTab('stats')}>
                  Stats
                </button>
                <button className={detailTab === 'standings' ? 'active' : ''} onClick={() => setDetailTab('standings')}>
                  Standings
                </button>
                <button className={detailTab === 'records' ? 'active' : ''} onClick={() => setDetailTab('records')}>
                  Box Score
                </button>
              </div>

              {detailTab === 'stats' ? (
                <section className="detail-card team-stats-card">
                  <div className="team-stats-header">
                    <div className="team-stats-team away">
                      <span>Away · {selectedMatch.awayAbbr ?? selectedMatch.awayTeam}</span>
                      <strong>{selectedMatch.awayScore}</strong>
                    </div>
                    <div className="team-stats-title">
                      <h4>Team Stats</h4>
                      <span>{selectedMatch.league} · {selectedMatch.lastUpdated}</span>
                    </div>
                    <div className="team-stats-team home">
                      <span>Home · {selectedMatch.homeAbbr ?? selectedMatch.homeTeam}</span>
                      <strong>{selectedMatch.homeScore}</strong>
                    </div>
                  </div>
                  <div className="bar-list">
                    <PeriodScoreView match={selectedMatch} />
                    {selectedMatch.keyStats.filter((stat) => !isPeriodStat(stat.label)).map((stat) => (
                      <StatBar key={stat.label} stat={stat} match={selectedMatch} />
                    ))}
                  </div>
                </section>
              ) : null}

              {detailTab === 'standings' ? (
                <StandingsView
                  standingsState={standingsState}
                  selectedMatch={selectedMatch}
                  favoriteTeams={favoriteTeams}
                  onRefresh={() => void fetchStandings()}
                />
              ) : null}

              {detailTab === 'records' ? (
                <div className="boxscore-stack">
                  {boxScoreState.loading ? (
                    <div className="empty-card">Loading {selectedMatch.league} box score...</div>
                  ) : null}
                  {!boxScoreState.loading && !boxScoreState.boxScore ? (
                    <div className="empty-card">{boxScoreState.message ?? 'No box score is available.'}</div>
                  ) : null}
                  {boxScoreState.boxScore ? (
                    <>
                      {boxScoreState.boxScore.notes && boxScoreState.boxScore.notes.length > 0 ? (
                        <section className="detail-card">
                          <h4>Game Notes & Info</h4>
                          <div className="kbo-note-list">
                            {boxScoreState.boxScore.notes.map((note) => (
                              <div key={`${note.label}-${note.value}`} className="kbo-note-item">
                                <span>{note.label}</span>
                                <strong>{note.value}</strong>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}

                      <section className="detail-card boxscore-controls-card">
                        <div className="kbo-toolbar">
                          {boxScoreState.boxScore.categories.length > 1 ? (
                            <div className="kbo-toolbar-section">
                              <span className="kbo-toolbar-label">Stat Category</span>
                              <div className="kbo-toolbar-group">
                                {boxScoreState.boxScore.categories.map((cat) => (
                                  <button
                                    key={cat.key}
                                    className={`kbo-pill ${(activeCategory?.key ?? '') === cat.key ? 'active' : ''}`}
                                    onClick={() => setSelectedCategoryKey(cat.key)}
                                  >
                                    {cat.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          <div className="kbo-toolbar-section team-select">
                            <span className="kbo-toolbar-label">Team</span>
                            <div className="kbo-toolbar-group">
                              <button
                                className={`kbo-pill team-pill ${boxScoreTeamSide === 'away' ? 'active' : ''}`}
                                onClick={() => setBoxScoreTeamSide('away')}
                              >
                                Away · {selectedMatch.awayAbbr ?? selectedMatch.awayTeam}
                              </button>
                              <button
                                className={`kbo-pill team-pill ${boxScoreTeamSide === 'home' ? 'active' : ''}`}
                                onClick={() => setBoxScoreTeamSide('home')}
                              >
                                Home · {selectedMatch.homeAbbr ?? selectedMatch.homeTeam}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>

                      {activeBoxTable ? <BoxScoreRecordTable title={activeBoxTitle} table={activeBoxTable} /> : null}
                    </>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-card">Select a game to view details.</div>
          )}
        </section>
      </section>

      {selectedTeam ? (
        <section className="team-news-center">
          <div className="panel-header">
            <div>
              <p className="section-label">Team News</p>
              <h2>{selectedTeam.name} News</h2>
            </div>
            <span className="league-badge">{selectedTeam.league}</span>
          </div>
          <div className="news-list">
            {teamNewsState.loading ? <div className="empty-card">Loading news...</div> : null}
            {!teamNewsState.loading && teamNewsState.articles.length === 0 ? (
              <div className="empty-card">{teamNewsState.message ?? 'No news is available.'}</div>
            ) : null}
            {teamNewsState.articles.map((article) => (
              <a key={`${article.link}-${article.pubDate}`} className="news-card" href={article.link} target="_blank" rel="noreferrer">
                <div className="news-card-meta">
                  <span className="news-category">{article.category ?? 'News'}</span>
                  <span className="news-source">{article.source || selectedTeam.name}</span>
                </div>
                <h3>{article.title}</h3>
                <p>{article.displayDate || formatNewsDate(article.pubDate)}</p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

    </div>
  );
}

function MatchTeam({
  side,
  match,
  favoriteTeams,
  onToggleFavorite,
}: {
  side: 'away' | 'home';
  match: Match;
  favoriteTeams: string[];
  onToggleFavorite: (teamAbbr?: string, league?: League) => void;
}) {
  const team = side === 'away' ? match.awayTeam : match.homeTeam;
  const abbr = side === 'away' ? match.awayAbbr : match.homeAbbr;
  const favorite = isFavoriteTeam(favoriteTeams, match.league, abbr);

  return (
    <div className="match-team">
      <TeamEmblem team={team} abbr={abbr} league={match.league} size="sm" />
      <div>
        <strong>{team}</strong>
        <span>{abbr ?? team.slice(0, 3).toUpperCase()}</span>
      </div>
      <button
        className={`favorite-toggle ${favorite ? 'active' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(abbr, match.league);
        }}
        aria-label={`Favorite ${team}`}
      >
        ★
      </button>
    </div>
  );
}

function HeroTeam({
  side,
  match,
  favoriteTeams,
  onToggleFavorite,
}: {
  side: 'away' | 'home';
  match: Match;
  favoriteTeams: string[];
  onToggleFavorite: (teamAbbr?: string, league?: League) => void;
}) {
  const team = side === 'away' ? match.awayTeam : match.homeTeam;
  const abbr = side === 'away' ? match.awayAbbr : match.homeAbbr;
  const record = side === 'away' ? match.awayRecord : match.homeRecord;
  const score = side === 'away' ? match.awayScore : match.homeScore;
  const favorite = isFavoriteTeam(favoriteTeams, match.league, abbr);

  return (
    <div className="hero-team">
      <button className={`favorite-toggle hero-favorite ${favorite ? 'active' : ''}`} onClick={() => onToggleFavorite(abbr, match.league)}>
        ★
      </button>
      <TeamEmblem team={team} abbr={abbr} league={match.league} size="lg" />
      <strong>{score}</strong>
      <h3>{team}</h3>
      <span>{record ?? '—'}</span>
    </div>
  );
}

function FavoriteRecentCard({
  team,
  match,
  onSelectMatch,
}: {
  team: TeamCatalogEntry;
  match: Match | null;
  onSelectMatch: (match: Match) => void;
}) {
  if (!match) {
    return (
      <article className="favorite-match-card unavailable">
        <div className="favorite-team-heading">
          <div className="favorite-team-name">
            <TeamEmblem team={team.name} abbr={team.abbr} league={team.league} size="sm" />
            <div>
              <span className="league-badge">{team.league}</span>
              <strong>{team.name}</strong>
            </div>
          </div>
        </div>
      <p>No recent game data is available.</p>
      </article>
    );
  }

  const teamIsHome = match.homeAbbr === team.abbr;
  const opponent = teamIsHome ? match.awayTeam : match.homeTeam;
  const opponentAbbr = teamIsHome ? match.awayAbbr : match.homeAbbr;
  const teamScore = teamIsHome ? match.homeScore : match.awayScore;
  const opponentScore = teamIsHome ? match.awayScore : match.homeScore;

  return (
    <button className="favorite-match-card" onClick={() => onSelectMatch(match)}>
      <div className="favorite-team-heading">
        <div className="favorite-team-name">
          <TeamEmblem team={team.name} abbr={team.abbr} league={team.league} size="sm" />
          <div>
            <span className="league-badge">{team.league}</span>
            <strong>{team.name}</strong>
          </div>
        </div>
        <span className={`badge ${match.status.toLowerCase()}`}>{renderCenterStatus(match)}</span>
      </div>
      <div className="favorite-recent-score">
        <strong>{teamScore}</strong>
        <span>:</span>
        <strong>{opponentScore}</strong>
      </div>
      <div className="favorite-opponent">
        <span>{teamIsHome ? 'Home' : 'Away'} · vs {opponent}</span>
        <TeamEmblem team={opponent} abbr={opponentAbbr} league={match.league} size="sm" />
      </div>
      <small>{match.startTime}</small>
    </button>
  );
}

function BoxScoreRecordTable({ title, table }: { title: string; table: BoxScoreTable }) {
  const headers = table.headers;
  const compact = headers.includes('ERA') || headers.includes('평균자책점') || headers.length > 8;

  return (
    <section className="detail-card boxscore-record-card">
      <h4>{title}</h4>
      <p className="table-scroll-hint">Scroll horizontally to view all statistics.</p>
      <div className="kbo-record-table-wrap boxscore-table-wrap">
        <table className={`kbo-record-table boxscore-table ${compact ? 'compact' : ''}`}>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={`${title}-header-${index}`}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`${title}-row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${title}-cell-${rowIndex}-${cellIndex}`}>{cell || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
          {table.footer && table.footer.length > 0 ? (
            <tfoot>
              <tr>
                {table.footer.map((cell, index) => (
                  <td key={`${title}-foot-${index}`}>{cell || '—'}</td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  );
}

function omitBoxTableColumns(table: BoxScoreTable, omittedHeaders: string[]): BoxScoreTable {
  const hidden = new Set(omittedHeaders);
  const visibleIndexes = table.headers.reduce<number[]>((indexes, header, index) => {
    if (!hidden.has(header.trim())) {
      indexes.push(index);
    }
    return indexes;
  }, []);

  if (visibleIndexes.length === table.headers.length) {
    return table;
  }

  const pickCells = (cells: string[]) => visibleIndexes.map((index) => cells[index] ?? '');

  return {
    ...table,
    headers: pickCells(table.headers),
    rows: table.rows.map(pickCells),
    footer: table.footer ? pickCells(table.footer) : undefined,
  };
}

function StatBar({
  stat,
  match,
}: {
  stat: Match['keyStats'][number];
  match: Match;
}) {
  const hasSplitValues = typeof stat.awayValue === 'number' && typeof stat.homeValue === 'number';
  const away = hasSplitValues ? stat.awayValue ?? 0 : 0;
  const home = hasSplitValues ? stat.homeValue ?? 0 : 0;
  const total = away + home || 1;
  const awayDisplay = hasSplitValues ? String(stat.awayValue) : stat.value;
  const homeDisplay = hasSplitValues ? String(stat.homeValue) : '';

  return (
    <div className="stat-card-row">
      <div className="stat-card-values">
        <div className="stat-side away-side">
          <span>Away · {match.awayAbbr ?? match.awayTeam}</span>
          <strong>{awayDisplay}</strong>
        </div>
        <span className="stat-label">{stat.label}</span>
        <div className="stat-side home-side">
          <span>Home · {match.homeAbbr ?? match.homeTeam}</span>
          <strong>{homeDisplay}</strong>
        </div>
      </div>
      {hasSplitValues ? (
        <div className="split-bar">
          <span className="away-bar" style={{ width: `${(away / total) * 100}%` }} />
          <span className="home-bar" style={{ width: `${(home / total) * 100}%` }} />
        </div>
      ) : null}
    </div>
  );
}

type PeriodScore = {
  label: string;
  away: number;
  home: number;
};

function isPeriodStat(label: string) {
  return /^(?:Q\d+|\d+Q|OT\d*|\d+OT)$/i.test(label.trim());
}

function getPeriodScores(match: Match): PeriodScore[] {
  return match.keyStats
    .filter((stat) => isPeriodStat(stat.label))
    .map((stat) => {
      const [awayText = '0', homeText = '0'] = stat.value.split('-').map((value) => value.trim());
      return {
        label: formatPeriodLabel(stat.label),
        away: typeof stat.awayValue === 'number' ? stat.awayValue : Number(awayText) || 0,
        home: typeof stat.homeValue === 'number' ? stat.homeValue : Number(homeText) || 0,
      };
    });
}

function formatPeriodLabel(label: string) {
  const compact = label.replaceAll(' ', '').toUpperCase();
  const quarterLast = compact.match(/^(\d+)Q$/);
  if (quarterLast) return `Q${quarterLast[1]}`;
  return compact;
}

function PeriodScoreView({ match }: { match: Match }) {
  const periods = getPeriodScores(match);
  if (periods.length === 0) return null;

  const maxScore = Math.max(...periods.flatMap((period) => [period.away, period.home]), 1);
  const awayTotal = periods.reduce((total, period) => total + period.away, 0);
  const homeTotal = periods.reduce((total, period) => total + period.home, 0);

  return (
    <section className="period-score-section" aria-label="Period scoring">
      <div className="period-score-heading">
        <h5>Period Scoring</h5>
        <span>Away vs Home</span>
      </div>
      <div className="period-score-table-wrap">
        <table className="period-score-table">
          <thead>
            <tr>
              <th>Team</th>
              {periods.map((period) => <th key={period.label}>{period.label}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Away · {match.awayAbbr ?? match.awayTeam}</th>
              {periods.map((period) => <td key={`away-${period.label}`}>{period.away}</td>)}
              <td><strong>{awayTotal}</strong></td>
            </tr>
            <tr>
              <th>Home · {match.homeAbbr ?? match.homeTeam}</th>
              {periods.map((period) => <td key={`home-${period.label}`}>{period.home}</td>)}
              <td><strong>{homeTotal}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="period-horizontal-chart" aria-label="Period score comparison chart">
        {periods.map((period) => (
          <div className="period-horizontal-row" key={`chart-${period.label}`}>
            <strong className="period-horizontal-label">{period.label}</strong>
            <span className="period-horizontal-score away">{period.away}</span>
            <div className="period-horizontal-track">
              <div className="period-horizontal-half away">
                <i style={{ width: `${(period.away / maxScore) * 100}%` }} />
              </div>
              <div className="period-horizontal-half home">
                <i style={{ width: `${(period.home / maxScore) * 100}%` }} />
              </div>
            </div>
            <span className="period-horizontal-score home">{period.home}</span>
          </div>
        ))}
      </div>
      <div className="period-chart-legend"><span className="away" />Away <span className="home" />Home</div>
    </section>
  );
}

function mergeScoreboardMatches(freshMatches: Match[], cachedMatches: Match[]): Match[] {
  const matchesByKey = new Map<string, Match>();

  [...freshMatches, ...cachedMatches].forEach((match) => {
    const key = `${match.league}:${match.startDate?.slice(0, 10) ?? ''}:${match.homeAbbr ?? match.homeTeam}:${match.awayAbbr ?? match.awayTeam}`;
    if (!matchesByKey.has(key)) {
      matchesByKey.set(key, match);
    }
  });

  return Array.from(matchesByKey.values());
}

function inferDateBucket(match: Match): ScheduleBucket {
  if (match.status === 'UPCOMING') {
    return 'UPCOMING';
  }
  return 'TODAY';
}

function matchesScheduleBucket(match: Match, bucket: ScheduleBucket) {
  if (!match.startDate) {
    return resolveMatchBucket(match) === bucket;
  }

  const diff = getDayDiff(match.startDate, new Date().toISOString());

  if (bucket === 'TODAY') return diff === 0;
  if (bucket === 'YESTERDAY') return diff === -1;
  return diff >= 1;
}

function mostRecentCompletedDayMatches(matches: Match[]) {
  const completedMatches = matches
    .filter((match) => match.status === 'FINAL' && getDayDiff(match.startDate, new Date().toISOString()) < 0)
    .sort((left, right) => String(right.startDate).localeCompare(String(left.startDate)));
  const latestMatch = completedMatches[0];

  if (!latestMatch?.startDate) {
    return [];
  }

  const latestDay = toSeoulDayKey(latestMatch.startDate);
  return completedMatches.filter((match) => match.startDate && toSeoulDayKey(match.startDate) === latestDay);
}

function resolveMatchBucket(match: Match): ScheduleBucket {
  if (match.dateBucket) {
    return match.dateBucket;
  }

  if (match.startDate) {
    const target = toSeoulDayKey(match.startDate);
    const today = toSeoulDayKey(new Date().toISOString());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = toSeoulDayKey(yesterdayDate.toISOString());

    if (target === today) return 'TODAY';
    if (target === yesterday) return 'YESTERDAY';
    return target > today ? 'UPCOMING' : 'YESTERDAY';
  }

  return inferDateBucket(match);
}

function getDayDiff(matchDate?: string, referenceDate?: string) {
  if (!matchDate || !referenceDate) {
    return 0;
  }

  const target = new Date(toSeoulDayKey(matchDate));
  const anchor = new Date(toSeoulDayKey(referenceDate));
  const millisPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - anchor.getTime()) / millisPerDay);
}

function toSeoulDayKey(dateString: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString));
}

function renderCenterStatus(match: Match) {
  if (match.status === 'FINAL') {
    return 'Final';
  }
  if (match.status === 'UPCOMING') {
    return match.startTime;
  }
  return match.period;
}

function isFavoriteMatch(match: Match, favorites: string[]) {
  return (
    isFavoriteTeam(favorites, match.league, match.homeAbbr) ||
    isFavoriteTeam(favorites, match.league, match.awayAbbr)
  );
}

function isFavoriteTeam(favorites: string[], league?: League, abbr?: string) {
  if (!abbr) {
    return false;
  }

  return favorites.includes(buildFavoriteKey(league, abbr)) || favorites.includes(abbr);
}

function buildFavoriteKey(league?: League, abbr?: string) {
  return league && abbr ? `${league}:${abbr}` : abbr ?? '';
}

function resolveFavoriteTeam(favorite: string) {
  if (favorite.includes(':')) {
    return getTeamByKey(favorite);
  }

  return getTeamByAbbr(favorite, resolveLeagueFromAbbr(favorite)) ?? getTeamByAbbr(favorite);
}

function sortFavoriteRecentMatches(left: Match, right: Match) {
  if (left.status === 'LIVE' && right.status !== 'LIVE') return -1;
  if (right.status === 'LIVE' && left.status !== 'LIVE') return 1;
  return sortByDateDesc(left, right);
}

function formatNewsDate(pubDate: string) {
  const parsed = Date.parse(pubDate);
  if (!Number.isFinite(parsed)) {
    return pubDate;
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(parsed));
}

function sortByDateDesc(left: Match, right: Match) {
  return (Date.parse(right.startDate ?? '') || 0) - (Date.parse(left.startDate ?? '') || 0);
}

function sortByDateAsc(left: Match, right: Match) {
  return (Date.parse(left.startDate ?? '') || 0) - (Date.parse(right.startDate ?? '') || 0);
}

function StandingsView({
  standingsState,
  selectedMatch,
  favoriteTeams,
  onRefresh,
}: {
  standingsState: {
    loading: boolean;
    standings: AllStandings | null;
    message: string | null;
  };
  selectedMatch: Match;
  favoriteTeams: string[];
  onRefresh: () => void;
}) {
  const selectedLeague = selectedMatch.league;
  const currentData = standingsState.standings?.[selectedLeague];

  return (
    <div className="standings-stack">
      <section className="detail-card standings-matchup-card">
        <div className="standings-snapshot-header">
          <h4>Matchup Snapshot · {selectedMatch.league}</h4>
          <button className="standings-refresh-mini" onClick={onRefresh} disabled={standingsState.loading}>
            {standingsState.loading ? 'Refreshing...' : 'Refresh Standings'}
          </button>
        </div>
        <div className="notes-grid">
          <div>
            <span>
              {selectedMatch.awayTeam} {selectedMatch.awayAbbr ? `(${selectedMatch.awayAbbr})` : ''}
            </span>
            <strong>{selectedMatch.awayRecord ?? 'Record unavailable'}</strong>
          </div>
          <div>
            <span>
              {selectedMatch.homeTeam} {selectedMatch.homeAbbr ? `(${selectedMatch.homeAbbr})` : ''}
            </span>
            <strong>{selectedMatch.homeRecord ?? 'Record unavailable'}</strong>
          </div>
        </div>
      </section>

      {standingsState.loading && !currentData ? (
        <div className="empty-card">Loading {selectedLeague} standings...</div>
      ) : null}

      {!standingsState.loading && !currentData ? (
        <div className="empty-card">{standingsState.message ?? 'Standings are unavailable.'}</div>
      ) : null}

      {currentData?.groups?.map((group) => (
        <section key={group.groupName} className="detail-card">
          <div className="standings-group-title">
            <h4>{group.groupName}</h4>
            <span className="standings-title-badge">{selectedLeague}</span>
          </div>
          <div className="kbo-record-table-wrap standings-table-wrap">
            <table className="kbo-record-table standings-table compact">
              <thead>
                <tr>
                  {group.headers.map((header, idx) => (
                    <th key={`${group.groupName}-h-${idx}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => {
                  const isMatchAway = selectedMatch.awayAbbr === row.abbr || selectedMatch.awayTeam.includes(row.team);
                  const isMatchHome = selectedMatch.homeAbbr === row.abbr || selectedMatch.homeTeam.includes(row.team);
                  const isSelectedGame = isMatchAway || isMatchHome;
                  const isFav = isFavoriteTeam(favoriteTeams, selectedLeague, row.abbr);

                  return (
                    <tr
                      key={`${group.groupName}-${row.team}`}
                      className={`${isSelectedGame ? 'standing-row-active' : ''} ${isFav ? 'standing-row-favorite' : ''}`}
                    >
                      <td className="standing-rank-cell">
                        <strong>{row.rank}</strong>
                      </td>
                      <td className="standing-team-cell">
                        <div className="standing-team-item">
                          <TeamEmblem team={row.team} abbr={row.abbr} league={selectedLeague} size="sm" />
                          <div className="standing-team-name-wrap">
                            <span className="standing-team-name">{row.team}</span>
                            {isSelectedGame ? <span className="standing-tag-current">Selected Game</span> : null}
                            {isFav ? <span className="standing-tag-fav">★</span> : null}
                          </div>
                        </div>
                      </td>
                      {row.games !== undefined ? <td>{row.games}</td> : null}
                      <td>
                        <strong>{row.wins}</strong>
                      </td>
                      <td>{row.losses}</td>
                      {row.ties !== undefined ? <td>{row.ties}</td> : null}
                      <td>
                        <strong>{row.winPct}</strong>
                      </td>
                      <td>{row.gb}</td>
                      {row.diff !== undefined ? <td>{row.diff}</td> : null}
                      {row.l10 !== undefined ? <td>{row.l10}</td> : null}
                      <td>
                        <span
                          className={`standing-streak-chip ${
                            row.streak.startsWith('W') || row.streak.includes('승') ? 'win' : 'lose'
                          }`}
                        >
                          {row.streak}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

export default App;
