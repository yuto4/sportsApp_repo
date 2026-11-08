import type { Match, MatchStatus, SeasonData, Team } from '../types';

/** API-Football における J2 リーグの league id */
export const J2_LEAGUE_ID = 99;
const BASE = 'https://v3.football.api-sports.io';

interface ApiTeam { team: { id: number; name: string; code: string | null; logo: string } }
interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string }; venue: { name: string | null } };
  league: { round: string };
  teams: { home: { id: number }; away: { id: number } };
  goals: { home: number | null; away: number | null };
}

async function get<T>(path: string, key: string): Promise<T[]> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'x-apisports-key': key } });
  if (!res.ok) throw new Error(`API-Football: HTTP ${res.status}`);
  const body = await res.json();
  const errors = body.errors && Object.values(body.errors);
  if (errors && errors.length) throw new Error(`API-Football: ${errors.join(', ')}`);
  return body.response as T[];
}

export function mapStatus(short: string): MatchStatus {
  if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(short)) return 'finished';
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP'].includes(short)) return 'live';
  if (['PST', 'CANC', 'ABD'].includes(short)) return 'postponed';
  return 'scheduled';
}

const PALETTE = ['#0b5d3b', '#1d4ed8', '#b91c1c', '#7c3aed', '#c2410c', '#0f766e', '#be185d', '#4d7c0f'];

export async function fetchApiFootballSeason(key: string, season: number): Promise<SeasonData> {
  const [apiTeams, apiFixtures] = await Promise.all([
    get<ApiTeam>(`/teams?league=${J2_LEAGUE_ID}&season=${season}`, key),
    get<ApiFixture>(`/fixtures?league=${J2_LEAGUE_ID}&season=${season}`, key),
  ]);

  const teams: Team[] = apiTeams.map(({ team }, i) => ({
    id: team.id,
    name: team.name,
    shortName: team.code ?? team.name.slice(0, 4),
    color: PALETTE[i % PALETTE.length],
    logo: team.logo,
  }));

  const matches: Match[] = apiFixtures.map((f) => ({
    id: f.fixture.id,
    round: Number(f.league.round.match(/(\d+)\s*$/)?.[1] ?? 0),
    kickoff: f.fixture.date,
    homeId: f.teams.home.id,
    awayId: f.teams.away.id,
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    status: mapStatus(f.fixture.status.short),
    venue: f.fixture.venue.name ?? undefined,
  }));

  return {
    season: `${season}-${String((season + 1) % 100).padStart(2, '0')}`,
    teams,
    matches,
    source: 'api-football',
    fetchedAt: new Date().toISOString(),
  };
}
