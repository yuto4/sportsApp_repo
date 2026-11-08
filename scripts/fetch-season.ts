/**
 * API-Football から J2 の試合データを取得して public/data/season.json に保存する。
 *   API_FOOTBALL_KEY=xxxx SEASON=2026 npm run fetch-data
 * キーが無い場合は何もせず終了する (アプリはサンプルデータで表示される)。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fetchApiFootballSeason } from '../src/data/apiFootball';

const key = process.env.API_FOOTBALL_KEY;
const season = Number(process.env.SEASON || 2026);
const out = new URL('../public/data/season.json', import.meta.url);

if (!key) {
  console.log('API_FOOTBALL_KEY が未設定のため、サンプルデータを使います。');
  process.exit(0);
}

const data = await fetchApiFootballSeason(key, season);
const finished = data.matches.filter((m) => m.status === 'finished').length;
if (data.teams.length === 0 || data.matches.length === 0) {
  throw new Error(`${season} シーズンのデータが空です`);
}
await mkdir(new URL('.', out), { recursive: true });
await writeFile(out, JSON.stringify(data));
console.log(`保存しました: ${data.season} / ${data.teams.length}チーム / ${data.matches.length}試合 (終了 ${finished})`);
