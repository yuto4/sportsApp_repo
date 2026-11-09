import { describe, expect, it } from 'vitest';
import { computeStandings, currentRound, nextMatch } from '../lib/standings';
import { articleTitle, carryOverDates, parseSeason, seasonStartYear } from './wikipedia';

const WIKITEXT = `
== 結果 ==
=== 順位表 ===
|name_ALB={{Fb team Albirex}}
=== 戦績表 ===
{{#invoke:Sports results|main
<!--チーム（修正不要）-->
|name_ALB={{Fb team Albirex}}
|name_VEG={{Fb team Vegalta}}
|name_XYZ={{Fb team Unknown Club}}
|team_order=ALB, VEG, XYZ

<!-- 第1節 -->
|match_ALB_VEG=2-1
|match_VEG_XYZ=0-0

<!-- 第2節 -->
|match_VEG_ALB={{small|5/23}}
|match_XYZ_ALB={{small|11/14 19:00}}
|match_ALB_XYZ=延期
}}

== 表彰 ==
|match_ALB_VEG=9-9
`;

describe('Wikipedia 戦績表の読み取り', () => {
  const now = new Date('2026-11-09T12:00:00+09:00');
  const data = parseSeason(WIKITEXT, 2026, now);

  it('チームはクラブマスタと同じ id・日本語名・クラブカラー', () => {
    const niigata = data.teams.find((t) => t.shortName === '新潟')!;
    expect(niigata).toMatchObject({ id: 12, name: 'アルビレックス新潟', color: '#EA5404' });
    expect(data.teams.find((t) => t.shortName === '仙台')!.id).toBe(3);
    expect(data.teams.find((t) => t.name === 'Unknown Club')!.id).toBeGreaterThanOrEqual(100);
    expect(data).toMatchObject({ season: '2026/27', source: 'wikipedia', sourceTitle: '2026/27シーズンのJ2リーグ' });
  });

  it('スコア・日付・延期を読み分け、戦績表の外は無視する', () => {
    expect(data.matches).toHaveLength(5);
    const [m1, m2, m3, m4, m5] = data.matches;
    expect(m1).toMatchObject({ round: 1, homeId: 12, awayId: 3, homeScore: 2, awayScore: 1, status: 'finished' });
    expect(m1.kickoff).toBeUndefined();
    expect(m2).toMatchObject({ homeScore: 0, awayScore: 0, status: 'finished' });
    // 5月は翌年、時刻なしは timeKnown=false
    expect(m3).toMatchObject({ round: 2, kickoff: '2027-05-23T00:00:00+09:00', timeKnown: false, status: 'scheduled' });
    expect(m4).toMatchObject({ kickoff: '2026-11-14T19:00:00+09:00', timeKnown: true });
    expect(m5.status).toBe('postponed');
  });

  it('順位計算・次の試合・今節', () => {
    const table = computeStandings(data.teams, data.matches);
    expect(table[0]).toMatchObject({ teamId: 12, points: 3 });
    expect(nextMatch(data.matches, 12)?.kickoff).toBe('2026-11-14T19:00:00+09:00');
    expect(currentRound(data.matches, now)).toBe(2);
  });

  it('前回データから終了済み試合の日付を引き継ぐ', () => {
    const prev = { ...data, matches: data.matches.map((m) => (m.round === 1 ? { ...m, kickoff: '2026-08-08T00:00:00+09:00' } : m)) };
    const merged = carryOverDates(data, prev);
    expect(merged.matches[0].kickoff).toBe('2026-08-08T00:00:00+09:00');
    expect(carryOverDates(data, { ...prev, season: '2025/26' }).matches[0].kickoff).toBeUndefined();
  });

  it('戦績表が無ければエラー', () => {
    expect(() => parseSeason('== 概要 ==', 2026)).toThrow();
  });
});

describe('シーズンの判定', () => {
  it('7月以降は開始年、6月までは前年開始のシーズン', () => {
    expect(seasonStartYear(new Date('2026-11-09T00:00:00+09:00'))).toBe(2026);
    expect(seasonStartYear(new Date('2027-05-30T00:00:00+09:00'))).toBe(2026);
    expect(seasonStartYear(new Date('2027-07-01T00:00:00+09:00'))).toBe(2027);
    expect(articleTitle(2026)).toBe('2026/27シーズンのJ2リーグ');
  });
});
