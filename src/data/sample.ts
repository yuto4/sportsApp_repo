import type { Match, SeasonData, Team } from '../types';
import { SAMPLE_TEAMS } from './clubs';

/** 決定的な疑似乱数 (mulberry32) */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** サークル方式でホーム&アウェイの総当たり日程を作る */
export function roundRobin(ids: number[]): [number, number][][] {
  const list = [...ids];
  if (list.length % 2) list.push(-1);
  const n = list.length;
  const rounds: [number, number][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [number, number][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a === -1 || b === -1) continue;
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    list.splice(1, 0, list.pop()!);
  }
  const second = rounds.map((p) => p.map(([h, a]) => [a, h] as [number, number]));
  return [...rounds, ...second];
}

const KICKOFF_TIMES = ['13:00', '14:00', '15:00', '16:00', '18:00', '19:00'];

function goals(r: () => number, strength: number) {
  // ざっくりポアソン風 (平均1.0〜1.8点)
  const lambda = 1.0 + strength * 0.8;
  let k = 0;
  let p = Math.exp(-lambda);
  let s = p;
  const u = r();
  while (u > s && k < 7) {
    k++;
    p *= lambda / k;
    s += p;
  }
  return k;
}

/**
 * サンプルのシーズンデータを生成する。
 * 2026-27シーズン(秋春制)を想定し、2026年8月から毎週土曜・日曜に開催。
 * `now` より前の試合は終了扱い。
 */
export function generateSampleSeason(now = new Date(), teams: Team[] = SAMPLE_TEAMS): SeasonData {
  const r = rng(2026);
  const strength = new Map(teams.map((t) => [t.id, r()]));
  const rounds = roundRobin(teams.map((t) => t.id));
  const start = new Date('2026-08-08T00:00:00+09:00'); // 土曜日
  const matches: Match[] = [];
  let id = 1;

  rounds.forEach((pairs, i) => {
    // 12月下旬〜2月中旬はウインターブレーク(7週)
    const week = i < 19 ? i : i + 7;
    pairs.forEach(([homeId, awayId], j) => {
      const day = new Date(start);
      day.setDate(start.getDate() + week * 7 + (j % 3 === 2 ? 1 : 0));
      const time = KICKOFF_TIMES[Math.floor(r() * KICKOFF_TIMES.length)];
      const ymd = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(day);
      const kickoff = `${ymd}T${time}:00+09:00`;
      const finished = new Date(kickoff).getTime() + 2 * 60 * 60 * 1000 < now.getTime();
      const hs = goals(r, strength.get(homeId)! + 0.1);
      const as = goals(r, strength.get(awayId)!);
      matches.push({
        id: id++,
        round: i + 1,
        kickoff,
        homeId,
        awayId,
        homeScore: finished ? hs : null,
        awayScore: finished ? as : null,
        status: finished ? 'finished' : 'scheduled',
      });
    });
  });

  return {
    season: '2026-27',
    teams,
    matches,
    source: 'sample',
    fetchedAt: now.toISOString(),
  };
}
