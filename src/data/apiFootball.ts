import type { Match, MatchStatus, SeasonData, Team } from '../types';
import { findClub } from './clubs';

/** API-Football における J2 リーグの league id */
export const J2_LEAGUE_ID = 99;
const BASE = 'https://v3.football.api-sports.io';

export interface ApiTeam { team: { id: number; name: string; code: string | null; logo: string } }
export interface ApiFixture {
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

/** "Regular Season - 12" → 12。プレーオフ等のリーグ戦以外は null */
export function regularRound(round: string): number | null {
  const m = round.match(/^Regular Season\s*-\s*(\d+)$/);
  return m ? Number(m[1]) : null;
}

/** API のレスポンスをアプリのデータ形式に変換する */
export function toSeasonData(apiTeams: ApiTeam[], apiFixtures: ApiFixture[], season: number, now = new Date()): SeasonData {
  // 既知のクラブは日本語名・クラブカラーで表示し、ロゴは API のものを使う
  const teams: Team[] = apiTeams.map(({ team }, i) => {
    const club = findClub(team.name);
    if (club) {
      const { key: _key, ...rest } = club;
      return { ...rest, id: team.id, logo: team.logo || club.logo };
    }
    return {
      id: team.id,
      name: team.name,
      shortName: team.name,
      color: PALETTE[i % PALETTE.length],
      textColor: '#FFFFFF',
      accentColor: PALETTE[i % PALETTE.length],
      logo: team.logo,
    };
  });

  // 順位表はリーグ戦のみで計算するため、昇格プレーオフ等は除外
  const matches: Match[] = apiFixtures.flatMap((f) => {
    const round = regularRound(f.league.round);
    if (round === null) return [];
    return [{
      id: f.fixture.id,
      round,
      kickoff: f.fixture.date,
      homeId: f.teams.home.id,
      awayId: f.teams.away.id,
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      status: mapStatus(f.fixture.status.short),
      venue: f.fixture.venue.name ?? undefined,
    }];
  });

  return {
    // 2026年から秋春制 (2026/27)。それ以前は1年単位のシーズン
    season: season >= 2026 ? `${season}/${String((season + 1) % 100).padStart(2, '0')}` : String(season),
    teams,
    matches,
    source: 'api-football',
    fetchedAt: now.toISOString(),
  };
}

export async function fetchApiFootballSeason(key: string, season: number): Promise<SeasonData> {
  const [apiTeams, apiFixtures] = await Promise.all([
    get<ApiTeam>(`/teams?league=${J2_LEAGUE_ID}&season=${season}`, key),
    get<ApiFixture>(`/fixtures?league=${J2_LEAGUE_ID}&season=${season}`, key),
  ]);
  return toSeasonData(apiTeams, apiFixtures, season);
}
