import { getTeamByAbbr } from './teamCatalog';
import type { League } from './types';

type TeamBrand = {
  abbr: string;
  colors: [string, string];
  mark: string;
  logoUrl?: string;
};

export function getTeamBrand(team: string, abbr?: string, league?: League): TeamBrand {
  const catalogTeam = getTeamByAbbr(abbr, league);

  if (catalogTeam) {
    return {
      abbr: catalogTeam.abbr,
      colors: catalogTeam.colors,
      mark: catalogTeam.mark,
      logoUrl: catalogTeam.logoUrl,
    };
  }

  const fallback = team
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    abbr: abbr ?? fallback,
    colors: ['#1b2c49', '#4f79ff'],
    mark: fallback,
  };
}

function buildLogoSvg(brand: TeamBrand) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="g" cx="30%" cy="30%" r="85%">
          <stop offset="0%" stop-color="${brand.colors[1]}"/>
          <stop offset="100%" stop-color="${brand.colors[0]}"/>
        </radialGradient>
      </defs>
      <rect x="4" y="4" width="112" height="112" rx="28" fill="url(#g)" />
      <rect x="8" y="8" width="104" height="104" rx="24" fill="none" stroke="rgba(255,255,255,0.18)" />
      <text x="60" y="58" text-anchor="middle" font-size="34" font-weight="900" fill="white" font-family="Inter, Arial, sans-serif">${brand.mark}</text>
      <text x="60" y="90" text-anchor="middle" font-size="14" letter-spacing="4" font-weight="700" fill="rgba(255,255,255,0.92)" font-family="Inter, Arial, sans-serif">${brand.abbr}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function TeamEmblem({
  team,
  abbr,
  league,
  size = 'md',
}: {
  team: string;
  abbr?: string;
  league: League;
  size?: 'sm' | 'md' | 'lg';
}) {
  const brand = getTeamBrand(team, abbr, league);
  const fallbackLogo = buildLogoSvg(brand);
  const logoSrc = brand.logoUrl ?? fallbackLogo;

  return (
    <div
      className={`team-emblem ${size}`}
      style={{
        boxShadow: `0 12px 28px ${brand.colors[0]}44`,
      }}
      aria-label={`${league} ${team} emblem`}
    >
      <img
        className="team-emblem-image"
        src={logoSrc}
        alt={`${team} logo`}
        onError={(event) => {
          const image = event.currentTarget;
          if (image.src !== fallbackLogo) {
            image.src = fallbackLogo;
          }
        }}
      />
    </div>
  );
}
