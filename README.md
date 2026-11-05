# Scoreline

NBA와 NFL의 실시간 스코어, 경기 상세 정보, 팀 뉴스, 순위를 한 화면에서 확인하는 스포츠 대시보드입니다.

## Features

- NBA/NFL 리그 및 팀별 경기 일정 필터
- Yesterday, Today, Upcoming 일정 보기
- 팀 즐겨찾기와 즐겨찾기 팀의 최근 경기 요약
- 경기 상세 정보: 팀 스탯, Play-by-Play, 리그 순위, Box Score
- 팀 선택 기반 영어 뉴스 피드
- NBA/NFL 팀 로고와 팀 검색
- API 데이터를 불러오지 못하면 재시도 화면 표시

## Tech Stack

- React 18
- TypeScript
- Vite
- Node.js HTTP server for local API development
- Vercel Serverless Functions (`/api`)

## Data Sources

- [ESPN](https://www.espn.com/) — NBA/NFL scoreboards, box scores, standings
- [BALLDONTLIE](https://www.balldontlie.io/) — supplementary NBA/NFL game data
- [Google News RSS](https://news.google.com/) — English team news

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and add a BALLDONTLIE API key.

```bash
cp .env.example .env.local
```

```env
BALLDONTLIE_API_KEY=your_balldontlie_api_key_here
```

The dashboard can still load ESPN-based data when this key is unavailable, but BALLDONTLIE supplementary data will be skipped.

### 3. Run locally

Start the local API server in one terminal:

```bash
npm run dev:api
```

Start the Vite development server in another terminal:

```bash
npm run dev
```

Open the URL printed by Vite, typically `http://localhost:5173`.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run dev:api` | Start the local API server on port `8787`. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |

## API Routes

| Route | Description |
| --- | --- |
| `/api/scoreboard` | NBA/NFL scoreboards and game schedules. |
| `/api/boxscore` | NBA/NFL box score for the selected game. |
| `/api/standings` | NBA/NFL standings. |
| `/api/team-news` | English news articles for the selected team. |

## Deployment

The project is ready for Vercel deployment. Add `BALLDONTLIE_API_KEY` to the Vercel project environment variables, then deploy the repository. The files in `api/` are served as Vercel Serverless Functions.

## Notes

- Live game availability depends on the upstream providers and their season schedules.
- If no live data can be fetched, Scoreline shows a loading state with a **Try again** button instead of displaying demo games.
