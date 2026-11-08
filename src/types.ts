export interface Team {
  id: number;
  name: string;
  shortName: string;
  /** クラブカラー: 基調色 */
  color: string;
  /** 基調色の上に載せる文字色 */
  textColor: string;
  /** 差し色 */
  accentColor: string;
  logo?: string;
}

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed';

export interface Match {
  id: number;
  round: number;
  /** ISO 8601 */
  kickoff: string;
  homeId: number;
  awayId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  venue?: string;
}

export type FormResult = 'W' | 'D' | 'L';

export interface StandingRow {
  rank: number;
  teamId: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  /** 直近5試合 (古い順) */
  form: FormResult[];
}

export interface SeasonData {
  season: string;
  teams: Team[];
  matches: Match[];
  source: 'sample' | 'api-football';
  fetchedAt: string;
}
