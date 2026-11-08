import { describe, expect, it } from 'vitest';
import type { Match, Team } from '../types';
import { computeStandings, currentRound, lastMatch, nextMatch, resultFor } from './standings';
import { generateSampleSeason, roundRobin } from '../data/sample';
import { mapStatus } from '../data/apiFootball';
import { J2_CLUBS, findClub } from '../data/clubs';

const teams: Team[] = [
  { id: 1, name: 'A', shortName: 'A', color: '#000', textColor: '#fff', accentColor: '#000' },
  { id: 2, name: 'B', shortName: 'B', color: '#000', textColor: '#fff', accentColor: '#000' },
  { id: 3, name: 'C', shortName: 'C', color: '#000', textColor: '#fff', accentColor: '#000' },
];
const m = (id: number, homeId: number, awayId: number, hs: number | null, as: number | null, day: number): Match => ({
  id, round: id, kickoff: `2026-08-${String(day).padStart(2, '0')}T15:00:00+09:00`, homeId, awayId,
  homeScore: hs, awayScore: as, status: hs === null ? 'scheduled' : 'finished',
});

describe('computeStandings', () => {
  const matches = [m(1, 1, 2, 2, 0, 1), m(2, 2, 3, 1, 1, 8), m(3, 3, 1, 3, 1, 15), m(4, 1, 3, null, null, 22)];
  const table = computeStandings(teams, matches);

  it('勝点・得失点差で並ぶ', () => {
    // A: 3pt (3-3, 0) / C: 4pt (4-2, +2) / B: 1pt
    expect(table.map((r) => r.teamId)).toEqual([3, 1, 2]);
    expect(table[0]).toMatchObject({ rank: 1, points: 4, won: 1, drawn: 1, lost: 0, goalDiff: 2 });
    expect(table[1]).toMatchObject({ points: 3, played: 2 });
  });

  it('未消化の試合は数えない、フォームは古い順', () => {
    expect(table.find((r) => r.teamId === 1)!.form).toEqual(['W', 'L']);
  });

  it('次の試合・前の試合・勝敗', () => {
    expect(nextMatch(matches, 1)?.id).toBe(4);
    expect(lastMatch(matches, 1)?.id).toBe(3);
    expect(resultFor(matches[2], 3)).toBe('W');
    expect(resultFor(matches[3], 1)).toBeNull();
  });

  it('現在の節', () => {
    expect(currentRound(matches, new Date('2026-08-20T00:00:00+09:00'))).toBe(4);
  });
});

describe('sample data', () => {
  it('20チームで38節・380試合、各カードがホーム/アウェイ1回ずつ', () => {
    const rounds = roundRobin(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(rounds).toHaveLength(38);
    const all = rounds.flat();
    expect(all).toHaveLength(380);
    expect(new Set(all.map(([h, a]) => `${h}-${a}`)).size).toBe(380);
    for (const r of rounds) expect(new Set(r.flat()).size).toBe(20);
  });

  it('基準日より前の試合だけ終了している', () => {
    const now = new Date('2026-11-08T12:00:00+09:00');
    const s = generateSampleSeason(now);
    for (const x of s.matches) {
      expect(x.status === 'finished').toBe(new Date(x.kickoff).getTime() + 2 * 3600e3 < now.getTime());
    }
  });
});

it('API-Footballのステータス変換', () => {
  expect(mapStatus('FT')).toBe('finished');
  expect(mapStatus('2H')).toBe('live');
  expect(mapStatus('PST')).toBe('postponed');
  expect(mapStatus('NS')).toBe('scheduled');
});

describe('クラブマスタ', () => {
  it('20クラブ・カラーはすべて6桁のHEX・キーは重複なし', () => {
    expect(J2_CLUBS).toHaveLength(20);
    const hex = /^#[0-9A-F]{6}$/i;
    for (const c of J2_CLUBS) {
      expect([c.color, c.textColor, c.accentColor].every((x) => hex.test(x))).toBe(true);
      expect(c.logo).toMatch(/^https:\/\//);
    }
    expect(new Set(J2_CLUBS.map((c) => c.key)).size).toBe(20);
  });

  it('API の英語名から日本語クラブ名を引ける', () => {
    expect(findClub('Júbilo Iwata')?.shortName).toBe('磐田');
    expect(findClub('Tochigi City FC')?.shortName).toBe('栃木C');
    expect(findClub('Yokohama FC')?.shortName).toBe('横浜FC');
    expect(findClub('Yokohama F. Marinos')).toBeUndefined();
    expect(findClub('Hokkaido Consadole Sapporo')?.name).toBe('北海道コンサドーレ札幌');
  });
});

describe('API-Football 変換', () => {
  it('プレーオフを除外し、既知クラブは日本語名・クラブカラーになる', async () => {
    const { toSeasonData, regularRound } = await import('../data/apiFootball');
    expect(regularRound('Regular Season - 12')).toBe(12);
    expect(regularRound('Play-offs - 1st')).toBeNull();
    const fx = (id: number, round: string) => ({
      fixture: { id, date: '2026-08-08T05:00:00+00:00', status: { short: 'FT' }, venue: { name: 'X' } },
      league: { round }, teams: { home: { id: 286 }, away: { id: 9999 } }, goals: { home: 2, away: 1 },
    });
    const d = toSeasonData(
      [
        { team: { id: 286, name: 'Vegalta Sendai', code: 'HOU', logo: 'https://example.com/a.png' } },
        { team: { id: 9999, name: 'Unknown FC', code: null, logo: '' } },
      ],
      [fx(1, 'Regular Season - 1'), fx(2, 'Play-offs - 1st')],
      2026,
    );
    expect(d.season).toBe('2026/27');
    expect(d.matches.map((m) => m.id)).toEqual([1]);
    expect(d.teams[0]).toMatchObject({ id: 286, shortName: '仙台', color: '#FFD700', logo: 'https://example.com/a.png' });
    expect(d.teams[1]).toMatchObject({ shortName: 'Unknown FC' });
  });
});
