import type { SeasonData } from '../types';
import { fetchApiFootballSeason } from './apiFootball';
import { generateSampleSeason } from './sample';

const CACHE_KEY = 'j2app:season-cache';
const CACHE_TTL_MS = 10 * 60 * 1000; // APIの無料枠節約のため10分キャッシュ

export async function loadSeason(force = false): Promise<SeasonData> {
  const source = import.meta.env.VITE_DATA_SOURCE ?? 'sample';
  const key = import.meta.env.VITE_API_FOOTBALL_KEY;

  if (source !== 'api-football' || !key) return generateSampleSeason();

  if (!force) {
    const cached = readCache();
    if (cached) return cached;
  }
  const season = Number(import.meta.env.VITE_SEASON ?? 2026);
  const data = await fetchApiFootballSeason(key, season);
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ストレージ不可でも続行 */
  }
  return data;
}

function readCache(): SeasonData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SeasonData;
    if (Date.now() - new Date(data.fetchedAt).getTime() > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}
