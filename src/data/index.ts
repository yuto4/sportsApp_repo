import type { SeasonData } from '../types';
import { generateSampleSeason } from './sample';

/**
 * `npm run fetch-data` (または GitHub Actions) が生成した data/season.json を読み込む。
 * 無ければサンプルデータで表示する。
 * APIキーはブラウザに渡さず、データ取得はビルド時にだけ行う。
 */
export async function loadSeason(): Promise<SeasonData> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/season.json`, { cache: 'no-cache' });
    if (res.ok && res.headers.get('content-type')?.includes('json')) {
      return (await res.json()) as SeasonData;
    }
  } catch {
    /* ネットワークエラー時はサンプルにフォールバック */
  }
  return generateSampleSeason();
}
