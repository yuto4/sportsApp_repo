/**
 * Wikipedia「20XX/YYシーズンのJ2リーグ」から試合データを取得して public/data/season.json に保存する。
 *   npm run fetch-data
 *
 * - 1回の実行で Wikipedia へのリクエストは記事本文の1回だけ
 * - PREVIOUS_DATA_URL (公開中のサイトのデータ) があれば、終了済み試合の日付を引き継ぐ
 * - 取得や読み取りに失敗した場合は前回のデータを引き継ぎ、警告だけ出して正常終了する
 *   (ワークフローを失敗させて通知メールが毎回届くのを防ぐため)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { articleTitle, carryOverDates, parseSeason, rawUrl, seasonStartYear } from '../src/data/wikipedia';
import type { SeasonData } from '../src/types';

const USER_AGENT = 'J2NaviApp/0.1 (https://github.com/yuto4/sportsApp_repo)';
const startYear = Number(process.env.SEASON_START_YEAR || seasonStartYear());
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
    return data.source === 'wikipedia' && data.matches?.length ? data : null;
  } catch {
    return null;
  }
}

const previous = await loadPrevious();
const title = articleTitle(startYear);

try {
  const res = await fetch(rawUrl(title), { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Wikipedia: HTTP ${res.status}`);
  const data = carryOverDates(parseSeason(await res.text(), startYear), previous);
  await save(data);
  const finished = data.matches.filter((m) => m.status === 'finished').length;
  const dated = data.matches.filter((m) => m.kickoff).length;
  console.log(
    `保存しました: ${title} / ${data.teams.length}チーム / ${data.matches.length}試合 (終了 ${finished}, 日付あり ${dated})`,
  );
} catch (e) {
  const reason = e instanceof Error ? e.message : String(e);
  if (previous) {
    await save(previous);
    warn(`取得に失敗したため、前回のデータ (${previous.fetchedAt}) を引き継ぎます: ${reason}`);
  } else {
    warn(`取得に失敗したため、サンプルデータで公開します: ${reason}`);
  }
}
