import type { FormResult, Match, StandingRow, Team } from '../types';

const counted = (m: Match) =>
  m.status === 'finished' && m.homeScore !== null && m.awayScore !== null;

/**
 * 終了した試合から順位表を計算する。
 * 並び順: 勝点 → 得失点差 → 総得点 → チーム名 (Jリーグ規定の上位3項目)
 */
export function computeStandings(teams: Team[], matches: Match[]): StandingRow[] {
  const rows = new Map<number, StandingRow>();
  for (const t of teams) {
    rows.set(t.id, {
      rank: 0, teamId: t.id, played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0, form: [],
    });
  }

  const finished = matches.filter(counted).sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  for (const m of finished) {
    const home = rows.get(m.homeId);
    const away = rows.get(m.awayId);
    if (!home || !away) continue;
    const hs = m.homeScore!;
    const as = m.awayScore!;
    apply(home, hs, as);
    apply(away, as, hs);
  }

  const nameOf = new Map(teams.map((t) => [t.id, t.name]));
  const sorted = [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      (nameOf.get(a.teamId) ?? '').localeCompare(nameOf.get(b.teamId) ?? '', 'ja'),
  );
  sorted.forEach((r, i) => {
    r.rank = i + 1;
    r.form = r.form.slice(-5);
  });
  return sorted;
}

function apply(row: StandingRow, gf: number, ga: number) {
  const result: FormResult = gf > ga ? 'W' : gf === ga ? 'D' : 'L';
  row.played++;
  row.goalsFor += gf;
  row.goalsAgainst += ga;
  row.goalDiff = row.goalsFor - row.goalsAgainst;
  if (result === 'W') { row.won++; row.points += 3; }
  else if (result === 'D') { row.drawn++; row.points += 1; }
  else row.lost++;
  row.form.push(result);
}

/** チームから見た試合結果 */
export function resultFor(match: Match, teamId: number): FormResult | null {
  if (!counted(match)) return null;
  const mine = match.homeId === teamId ? match.homeScore! : match.awayScore!;
  const theirs = match.homeId === teamId ? match.awayScore! : match.homeScore!;
  return mine > theirs ? 'W' : mine === theirs ? 'D' : 'L';
}

export function teamMatches(matches: Match[], teamId: number): Match[] {
  return matches
    .filter((m) => m.homeId === teamId || m.awayId === teamId)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

export function nextMatch(matches: Match[], teamId: number): Match | undefined {
  return teamMatches(matches, teamId).find((m) => m.status === 'scheduled' || m.status === 'live');
}

export function lastMatch(matches: Match[], teamId: number): Match | undefined {
  return teamMatches(matches, teamId).filter((m) => m.status === 'finished').at(-1);
}

/** 試合が無い場合は最も近い節を返す */
export function currentRound(matches: Match[], now = new Date()): number {
  if (matches.length === 0) return 1;
  const upcoming = matches
    .filter((m) => m.status !== 'finished' && new Date(m.kickoff) >= startOfDay(now))
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0];
  if (upcoming) return upcoming.round;
  return Math.max(...matches.map((m) => m.round));
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
