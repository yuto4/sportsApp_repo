/**
 * API-Football から J2 の試合データを取得して public/data/season.json に保存する。
 *   API_FOOTBALL_KEY=xxxx SEASON=2026 npm run fetch-data
 *
 * - キーが無い場合は何もせず終了する (アプリはサンプルデータで表示される)
 * - 取得に失敗した場合は PREVIOUS_DATA_URL (公開中のサイトのデータ) を引き継ぎ、
 *   警告だけ出して正常終了する。一時的な API の不調でワークフロー全体を失敗させない
 *   (失敗通知メールが毎回届くのを防ぐ) ため。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fetchApiFootballSeason } from '../src/data/apiFootball';
import type { SeasonData } from '../src/types';

const key = process.env.API_FOOTBALL_KEY;
const season = Number(process.env.SEASON || 2026);
const previousUrl = process.env.PREVIOUS_DATA_URL;
const out = new URL('../public/data/season.json', import.meta.url);

/** GitHub Actions の画面に警告として表示する */
const warn = (msg: string) =>
  console.log(process.env.GITHUB_ACTIONS ? `::warning title=データ取得::${msg}` : `警告: ${msg}`);

async function save(data: SeasonData) {
  await mkdir(new URL('.', out), { recursive: true });
  await writeFile(out, JSON.stringify(data));
}

async function loadPrevious(): Promise<SeasonData | null> {
  if (!previousUrl) return null;
  try {
    const res = await fetch(previousUrl);
    if (!res.ok) return null;
    const data = (await res.json()) as SeasonData;
    return data.matches?.length ? data : null;
  } catch {
    return null;
  }
}

if (!key) {
  console.log('API_FOOTBALL_KEY が未設定のため、サンプルデータを使います。');
  process.exit(0);
}

try {
  const data = await fetchApiFootballSeason(key, season);
  if (data.teams.length === 0 || data.matches.length === 0) {
    throw new Error(`${season} シーズンのデータが空です`);
  }
  await save(data);
  const finished = data.matches.filter((m) => m.status === 'finished').length;
  console.log(`保存しました: ${data.season} / ${data.teams.length}チーム / ${data.matches.length}試合 (終了 ${finished})`);
} catch (e) {
  const reason = e instanceof Error ? e.message : String(e);
  const previous = await loadPrevious();
  if (previous) {
    await save(previous);
    warn(`取得に失敗したため、前回のデータ (${previous.fetchedAt}) を引き継ぎます: ${reason}`);
  } else {
    warn(`取得に失敗したため、サンプルデータで公開します: ${reason}`);
  }
}
