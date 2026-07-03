import { useEffect, useMemo, useState } from 'react';
import { getLeagueTeams, getTeamByAbbr, getTeamByKey, resolveLeagueFromAbbr, type TeamCatalogEntry } from './teamCatalog';
import { getTeamBrand, TeamEmblem } from './teamBranding';
import type { League, Match, ScheduleBucket } from './types';

type LeagueFilter = 'ALL' | League;
type DetailTab = 'stats' | 'play' | 'standings';
type TeamViewTab = 'recent' | 'upcoming' | 'news';

type ApiState = {
  matches: Match[];
  lastUpdated: string | null;
  source: 'live' | 'demo';
  message: string | null;
};

type TeamNewsArticle = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
};

const leagueFilters: LeagueFilter[] = ['ALL', 'NBA', 'NFL', 'KBO'];
const dateFilters: ScheduleBucket[] = ['YESTERDAY', 'TODAY', 'UPCOMING'];
const dateFilterLabel: Record<ScheduleBucket, string> = {
  YESTERDAY: 'Yesterday',
  TODAY: 'Today',
  UPCOMING: 'Upcoming',
};
const favoriteStorageKey = 'sport-dashboard-favorites';
function App() {
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<ScheduleBucket>('TODAY');
  const [detailTab, setDetailTab] = useState<DetailTab>('stats');
  const [teamViewTab, setTeamViewTab] = useState<TeamViewTab>('recent');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [apiState, setApiState] = useState<ApiState>({
    matches: [],
    lastUpdated: null,
    source: 'demo',
    message: '실시간 데이터를 불러오는 중입니다.',
  });
  const [selectedMatchId, setSelectedMatchId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [scheduleTeamKey, setScheduleTeamKey] = useState<string | null>(null);
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

  useEffect(() => {
    void fetchScoreboard();
    const timer = window.setInterval(() => {
      void fetchScoreboard(true);
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

  const kboReferenceDate = useMemo(() => {
    const todayKboMatch = apiState.matches.find(
      (match) => match.league === 'KBO' && match.startDate && resolveMatchBucket(match) === 'TODAY',
    );

    return todayKboMatch?.startDate ?? new Date().toISOString();
  }, [apiState.matches]);

  const filteredMatches = useMemo(() => {
    const scopedTeam = scheduleTeamKey ? getTeamByKey(scheduleTeamKey) : null;

    return apiState.matches
      .filter((match) => {
        const leagueOk = leagueFilter === 'ALL' || match.league === leagueFilter;
        const dateOk =
          (match.league === 'KBO' ? resolveKboBucket(match, kboReferenceDate) : resolveMatchBucket(match)) === dateFilter;
        const teamOk = scopedTeam
          ? match.homeAbbr === scopedTeam.abbr || match.awayAbbr === scopedTeam.abbr
          : true;
        return leagueOk && dateOk && teamOk;
      })
      .sort((left, right) => {
        const leftFavorite = isFavoriteMatch(left, favoriteTeams);
        const rightFavorite = isFavoriteMatch(right, favoriteTeams);

        if (leftFavorite !== rightFavorite) {
          return leftFavorite ? -1 : 1;
        }

        return left.id - right.id;
      });
  }, [apiState.matches, dateFilter, favoriteTeams, kboReferenceDate, leagueFilter, scheduleTeamKey]);

  const leagueMatches = useMemo(() => {
    return apiState.matches.filter((match) => leagueFilter === 'ALL' || match.league === leagueFilter);
  }, [apiState.matches, leagueFilter]);

  const teamProfiles = useMemo(() => {
    return getLeagueTeams(leagueFilter).sort((left, right) => {
      const leftFavorite = favoriteTeams.includes(left.abbr);
      const rightFavorite = favoriteTeams.includes(right.abbr);
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

  const selectedMatch = filteredMatches.find((match) => match.id === selectedMatchId) ?? filteredMatches[0] ?? null;
  const favoriteProfiles = favoriteTeams
    .map((abbr) => getTeamByAbbr(abbr, resolveLeagueFromAbbr(abbr)) ?? getTeamByAbbr(abbr))
    .filter((team): team is TeamCatalogEntry => Boolean(team));
  const favoriteBrands = favoriteProfiles.map((team) => ({
    ...getTeamBrand(team.name, team.abbr, team.league),
    key: team.key,
    league: team.league,
  }));
  const selectedTeam = (getTeamByKey(selectedTeamKey) ?? teamProfiles[0] ?? null) as TeamCatalogEntry | null;
  const scopedScheduleTeam = (scheduleTeamKey ? getTeamByKey(scheduleTeamKey) : null) as TeamCatalogEntry | null;

  const teamGames = useMemo(() => {
    if (!selectedTeam) {
      return { recent: [] as Match[], upcoming: [] as Match[] };
    }

    const related = leagueMatches.filter(
      (match) => match.homeAbbr === selectedTeam.abbr || match.awayAbbr === selectedTeam.abbr,
    );

    const referenceDate = selectedTeam.league === 'KBO' ? kboReferenceDate : new Date().toISOString();

    const recent = related
      .filter((match) => {
        const diff = getDayDiff(match.startDate, referenceDate);
        return diff >= -5 && diff <= 0;
      })
      .sort(sortByDateDesc)
      .slice(0, 5);

    const upcoming = related
      .filter((match) => {
        const diff = getDayDiff(match.startDate, referenceDate);
        return diff >= 1 && diff <= 5;
      })
      .sort(sortByDateAsc)
      .slice(0, 5);

    return { recent, upcoming };
  }, [kboReferenceDate, leagueMatches, selectedTeam]);

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
        const response = await fetch(
          `/api/team-news?team=${encodeURIComponent(selectedTeam.name)}&league=${encodeURIComponent(
            selectedTeam.league,
          )}&query=${encodeURIComponent(selectedTeam.newsQuery)}`,
        );
        const payload = (await response.json()) as {
          articles?: TeamNewsArticle[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(payload.message ?? '팀 뉴스를 불러오지 못했습니다.');
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
            message: error instanceof Error ? error.message : '팀 뉴스 요청 중 오류가 발생했습니다.',
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

  const summary = useMemo(() => {
    const liveCount = filteredMatches.filter((match) => match.status === 'LIVE').length;
    const finalCount = filteredMatches.filter((match) => match.status === 'FINAL').length;
    const upcomingCount = filteredMatches.filter((match) => match.status === 'UPCOMING').length;

    return [
      { label: 'Live Games', value: String(liveCount) },
      { label: 'Final Games', value: String(finalCount) },
      { label: 'Upcoming', value: String(upcomingCount) },
      { label: 'Favorites', value: String(favoriteTeams.length) },
    ];
  }, [favoriteTeams.length, filteredMatches]);

  async function fetchScoreboard(isBackground = false) {
    if (!isBackground) {
      setLoading(true);
    }

    try {
      const response = await fetch('/api/scoreboard');
      const payload = (await response.json()) as ApiState;

      if (!response.ok) {
        throw new Error(payload.message ?? '점수 데이터를 불러오지 못했습니다.');
      }

      setApiState({
        matches: payload.matches,
        lastUpdated: payload.lastUpdated,
        source: payload.source,
        message: payload.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setApiState((current) => ({
        ...current,
        matches: current.matches,
        message,
      }));
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }

  function toggleFavorite(teamAbbr?: string) {
    if (!teamAbbr) {
      return;
    }

    setFavoriteTeams((current) =>
      current.includes(teamAbbr) ? current.filter((abbr) => abbr !== teamAbbr) : [...current, teamAbbr],
    );
  }

  return (
    <div className="desktop-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">LIVE SPORTS CENTER</p>
          <h1>NBA · NFL · KBO Scores Dashboard</h1>
          <p className="hero-description">
            NBA, NFL, KBO 경기와 함께 팀별 탭에서 최근 7경기, 예정된 7경기, 관련 뉴스 기사까지 확인할 수 있게
            확장했습니다.
          </p>
        </div>

        <div className="hero-actions">
          <div className="top-pills">
            {leagueFilters.map((filter) => (
              <button
                key={filter}
                className={`top-pill ${leagueFilter === filter ? 'active' : ''}`}
                onClick={() => setLeagueFilter(filter)}
              >
                {filter === 'ALL' ? 'All Leagues' : filter}
              </button>
            ))}
          </div>

          <div className="status-card">
            <span className={`status-chip ${apiState.source}`}>{apiState.source === 'live' ? 'Live data' : 'Demo mode'}</span>
            <p>{apiState.lastUpdated ? `Updated ${apiState.lastUpdated}` : apiState.message}</p>
            <button className="refresh-button" onClick={() => void fetchScoreboard()} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh Scores'}
            </button>
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

      <section className="summary-grid">
        {summary.map((item) => (
          <article key={item.label} className="summary-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      {teamProfiles.length > 0 ? (
        <section className="team-strip">
          <div className="panel-header">
            <div>
              <p className="section-label">Teams</p>
              <h2>Browse by Team</h2>
            </div>
            {selectedTeam ? <span className="match-count">{selectedTeam.name}</span> : null}
          </div>

          <div className="team-tools">
            <label className="team-search">
              <span>Search team</span>
              <input
                type="text"
                value={teamSearchQuery}
                onChange={(event) => setTeamSearchQuery(event.target.value)}
                placeholder="팀명 / 약자 / 리그 검색"
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
                className={`team-tab ${scheduleTeamKey === team.key ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTeamKey(team.key);
                  setScheduleTeamKey(team.key);
                  setTeamViewTab('recent');
                }}
              >
                <TeamEmblem team={team.name} abbr={team.abbr} league={team.league} size="sm" />
                <span>{team.abbr}</span>
              </button>
            ))}
          </div>
          {visibleTeamProfiles.length === 0 ? <div className="empty-card team-empty">검색된 팀이 없습니다.</div> : null}
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

            {filteredMatches.length === 0 ? <div className="empty-card">선택한 조건에 맞는 경기가 없습니다.</div> : null}
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
                <button className={detailTab === 'play' ? 'active' : ''} onClick={() => setDetailTab('play')}>
                  Play-By-Play
                </button>
                <button className={detailTab === 'standings' ? 'active' : ''} onClick={() => setDetailTab('standings')}>
                  Standings
                </button>
              </div>

              {detailTab === 'stats' ? (
                <div className="detail-grid">
                  <section className="detail-card">
                    <h4>Quick Notes</h4>
                    <div className="notes-grid">
                      <div>
                        <span>League</span>
                        <strong>{selectedMatch.league}</strong>
                      </div>
                      <div>
                        <span>Last Update</span>
                        <strong>{selectedMatch.lastUpdated}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="detail-card">
                    <h4>Team Stats</h4>
                    <div className="bar-list">
                      {selectedMatch.keyStats.map((stat) => (
                        <StatBar key={stat.label} stat={stat} />
                      ))}
                    </div>
                  </section>
                </div>
              ) : null}

              {detailTab === 'play' ? (
                <section className="detail-card">
                  <h4>Play-By-Play</h4>
                  <div className="timeline">
                    {(selectedMatch.playByPlay ?? ['아직 제공된 이벤트가 없습니다.']).map((item) => (
                      <div key={item} className="timeline-row">
                        <span className="timeline-dot" />
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {detailTab === 'standings' ? (
                <section className="detail-card">
                  <h4>Record Snapshot</h4>
                  <div className="notes-grid">
                    <div>
                      <span>{selectedMatch.awayTeam}</span>
                      <strong>{selectedMatch.awayRecord ?? '데이터 준비 중'}</strong>
                    </div>
                    <div>
                      <span>{selectedMatch.homeTeam}</span>
                      <strong>{selectedMatch.homeRecord ?? '데이터 준비 중'}</strong>
                    </div>
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <div className="empty-card">경기를 선택해주세요.</div>
          )}
        </section>
      </section>

      <section className="team-center">
        <div className="panel-header">
          <div>
            <p className="section-label">Team Center</p>
            <h2>{selectedTeam ? selectedTeam.name : 'Select Team'}</h2>
          </div>
          {selectedTeam ? (
            <span className="match-count">
              {selectedTeam.league} · {teamGames.recent.length} recent / {teamGames.upcoming.length} upcoming
            </span>
          ) : null}
        </div>

        <div className="team-tabs">
          {visibleTeamProfiles.map((team) => (
            <button
              key={team.key}
              className={`team-tab ${selectedTeamKey === team.key ? 'active' : ''}`}
              onClick={() => {
                setSelectedTeamKey(team.key);
                setScheduleTeamKey(team.key);
                setTeamViewTab('recent');
              }}
            >
              <TeamEmblem team={team.name} abbr={team.abbr} league={team.league} size="sm" />
              <span>{team.abbr}</span>
            </button>
          ))}
        </div>

        {selectedTeam ? (
          <>
            <div className="team-view-tabs">
              <button className={teamViewTab === 'recent' ? 'active' : ''} onClick={() => setTeamViewTab('recent')}>
                Prev 5 Days
              </button>
              <button className={teamViewTab === 'upcoming' ? 'active' : ''} onClick={() => setTeamViewTab('upcoming')}>
                Next 5 Days
              </button>
              <button className={teamViewTab === 'news' ? 'active' : ''} onClick={() => setTeamViewTab('news')}>
                Team News
              </button>
            </div>

            {teamViewTab === 'recent' ? (
              <section className="team-view-grid">
                {teamGames.recent.length > 0 ? (
                  teamGames.recent.map((match) => <TeamGameCard key={match.id} match={match} selectedTeamAbbr={selectedTeam.abbr} />)
                ) : (
                  <div className="empty-card">최근 경기 데이터가 없습니다.</div>
                )}
              </section>
            ) : null}

            {teamViewTab === 'upcoming' ? (
              <section className="team-view-grid">
                {teamGames.upcoming.length > 0 ? (
                  teamGames.upcoming.map((match) => <TeamGameCard key={match.id} match={match} selectedTeamAbbr={selectedTeam.abbr} />)
                ) : (
                  <div className="empty-card">예정된 경기 데이터가 없습니다.</div>
                )}
              </section>
            ) : null}

            {teamViewTab === 'news' ? (
              <section className="news-list">
                {teamNewsState.loading ? <div className="empty-card">뉴스를 불러오는 중입니다.</div> : null}
                {!teamNewsState.loading && teamNewsState.articles.length === 0 ? (
                  <div className="empty-card">{teamNewsState.message ?? '표시할 뉴스가 없습니다.'}</div>
                ) : null}
                {teamNewsState.articles.map((article) => (
                  <a key={`${article.link}-${article.pubDate}`} className="news-card" href={article.link} target="_blank" rel="noreferrer">
                    <span className="news-source">{article.source || selectedTeam.name}</span>
                    <h3>{article.title}</h3>
                    <p>{article.pubDate}</p>
                  </a>
                ))}
              </section>
            ) : null}
          </>
        ) : (
          <div className="empty-card">표시할 팀이 없습니다.</div>
        )}
      </section>
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
  onToggleFavorite: (teamAbbr?: string) => void;
}) {
  const team = side === 'away' ? match.awayTeam : match.homeTeam;
  const abbr = side === 'away' ? match.awayAbbr : match.homeAbbr;
  const favorite = abbr ? favoriteTeams.includes(abbr) : false;

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
          onToggleFavorite(abbr);
        }}
        aria-label={`${team} 즐겨찾기`}
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
  onToggleFavorite: (teamAbbr?: string) => void;
}) {
  const team = side === 'away' ? match.awayTeam : match.homeTeam;
  const abbr = side === 'away' ? match.awayAbbr : match.homeAbbr;
  const record = side === 'away' ? match.awayRecord : match.homeRecord;
  const score = side === 'away' ? match.awayScore : match.homeScore;
  const favorite = abbr ? favoriteTeams.includes(abbr) : false;

  return (
    <div className="hero-team">
      <button className={`favorite-toggle hero-favorite ${favorite ? 'active' : ''}`} onClick={() => onToggleFavorite(abbr)}>
        ★
      </button>
      <TeamEmblem team={team} abbr={abbr} league={match.league} size="lg" />
      <strong>{score}</strong>
      <h3>{team}</h3>
      <span>{record ?? '—'}</span>
    </div>
  );
}

function TeamGameCard({ match, selectedTeamAbbr }: { match: Match; selectedTeamAbbr: string }) {
  const selectedIsHome = match.homeAbbr === selectedTeamAbbr;
  const opponent = selectedIsHome ? match.awayTeam : match.homeTeam;
  const opponentAbbr = selectedIsHome ? match.awayAbbr : match.homeAbbr;
  const teamScore = selectedIsHome ? match.homeScore : match.awayScore;
  const opponentScore = selectedIsHome ? match.awayScore : match.homeScore;

  return (
    <article className="team-game-card">
      <div className="team-game-head">
        <span className={`badge ${match.status.toLowerCase()}`}>{renderCenterStatus(match)}</span>
        <span className="league-badge">{match.league}</span>
      </div>
      <div className="team-game-body">
        <div className="team-game-score">
          <strong>{teamScore}</strong>
          <span>vs</span>
          <strong>{opponentScore}</strong>
        </div>
        <div className="team-game-opponent">
          <TeamEmblem team={opponent} abbr={opponentAbbr} league={match.league} size="sm" />
          <div>
            <h4>{opponent}</h4>
            <p>{match.venue}</p>
          </div>
        </div>
      </div>
      <p className="team-game-time">{match.startTime}</p>
    </article>
  );
}

function StatBar({
  stat,
}: {
  stat: Match['keyStats'][number];
}) {
  const away = typeof stat.awayValue === 'number' ? stat.awayValue : 0;
  const home = typeof stat.homeValue === 'number' ? stat.homeValue : 0;
  const total = away + home || 1;

  return (
    <div className="stat-card-row">
      <div className="stat-card-values">
        <strong>{typeof stat.awayValue === 'number' ? stat.awayValue : stat.value}</strong>
        <span>{stat.label}</span>
        <strong>{typeof stat.homeValue === 'number' ? stat.homeValue : ''}</strong>
      </div>
      {typeof stat.awayValue === 'number' && typeof stat.homeValue === 'number' ? (
        <div className="split-bar">
          <span className="away-bar" style={{ width: `${(away / total) * 100}%` }} />
          <span className="home-bar" style={{ width: `${(home / total) * 100}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function inferDateBucket(match: Match): ScheduleBucket {
  if (match.status === 'UPCOMING') {
    return 'UPCOMING';
  }
  return 'TODAY';
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

function resolveKboBucket(match: Match, referenceDate: string): ScheduleBucket {
  const diff = getDayDiff(match.startDate, referenceDate);
  if (diff <= -1) return 'YESTERDAY';
  if (diff >= 1) return 'UPCOMING';
  return 'TODAY';
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
  return favorites.includes(match.homeAbbr ?? '') || favorites.includes(match.awayAbbr ?? '');
}

function sortByDateDesc(left: Match, right: Match) {
  return (Date.parse(right.startDate ?? '') || 0) - (Date.parse(left.startDate ?? '') || 0);
}

function sortByDateAsc(left: Match, right: Match) {
  return (Date.parse(left.startDate ?? '') || 0) - (Date.parse(right.startDate ?? '') || 0);
}

export default App;
