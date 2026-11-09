import type { Match, SeasonData, Team } from '../types';
import { J2_CLUBS } from './clubs';

/**
 * Wikipedia 日本語版「20XX/YYシーズンのJ2リーグ」の記事 (ウィキテキスト) から
 * チームと全試合を読み取る。
 *
 * 読み取る箇所: 「戦績表」(Module:Sports results) の
 *   |name_ALB={{Fb team Albirex}}   … 略号 → クラブ
 *   <!-- 第17節 -->                  … 以降の試合の節
 *   |match_ALB_TGV=2-1              … 終了 (ホーム-アウェイのスコア)
 *   |match_ALB_TGV={{small|11/14}}  … 予定 (日付のみ。時刻は載っていない)
 */

export const WIKI_HOST = 'https://ja.wikipedia.org';

/** 指定日時点のシーズン開始年 (J2 は2026年から8月開幕の秋春制) */
export function seasonStartYear(now = new Date()): number {
  const jst = new Date(now.getTime() + 9 * 3600_000);
  const y = jst.getUTCFullYear();
  return jst.getUTCMonth() + 1 >= 7 ? y : y - 1;
}

export function articleTitle(startYear: number): string {
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}シーズンのJ2リーグ`;
}

export const articleUrl = (title: string) => `${WIKI_HOST}/wiki/${encodeURIComponent(title)}`;
export const rawUrl = (title: string) => `${WIKI_HOST}/w/index.php?title=${encodeURIComponent(title)}&action=raw`;

/** {{Fb team ○○}} のテンプレート名 → clubs.ts のキー */
const FB_TEAM: Record<string, string> = {
  Consadole: 'sapporo',
  Vanraure: 'hachinohe',
  Vegalta: 'sendai',
  Blaublitz: 'akita',
  Montedio: 'yamagata',
  'Iwaki FC': 'iwaki',
  'Tochigi City': 'tochigicity',
  'RB Ardija': 'omiya',
  Ardija: 'omiya',
  'Yokohama FC': 'yokohamafc',
  Bellmare: 'shonan',
  Ventforet: 'kofu',
  Albirex: 'niigata',
  Kataller: 'toyama',
  Jubilo: 'iwata',
  MYFC: 'fujieda',
  Vortis: 'tokushima',
  'FC Imabari': 'imabari',
  Sagan: 'tosu',
  Trinita: 'oita',
  Tegevajaro: 'miyazaki',
};

const PALETTE = ['#0b5d3b', '#1d4ed8', '#b91c1c', '#7c3aed', '#c2410c', '#0f766e', '#be185d', '#4d7c0f'];

/** 「戦績表」セクションのウィキテキストだけを取り出す */
function resultsSection(wikitext: string): string {
  const start = wikitext.indexOf('=== 戦績表 ===');
  if (start < 0) throw new Error('記事に「戦績表」が見つかりません');
  const rest = wikitext.slice(start + 1);
  const next = rest.search(/\n==[^=]/);
  return next < 0 ? rest : rest.slice(0, next);
}

/** M/D をシーズンの年付き日付 (日本時間0時) にする。7月以降は開始年、それ以前は翌年 */
function toKickoff(month: number, day: number, startYear: number): string {
  const year = month >= 7 ? startYear : startYear + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+09:00`;
}

export function parseSeason(wikitext: string, startYear: number, now = new Date()): SeasonData {
  const section = resultsSection(wikitext);

  // チーム (略号 → Team)
  const teamByCode = new Map<string, Team>();
  let extra = 0;
  for (const [, code, tpl] of section.matchAll(/\|name_([A-Z0-9]+)\s*=\s*\{\{Fb team ([^}|]+)/g)) {
    const key = FB_TEAM[tpl.trim()];
    const index = J2_CLUBS.findIndex((c) => c.key === key);
    if (index >= 0) {
      const { key: _key, ...club } = J2_CLUBS[index];
      // id はサンプルデータと同じ (clubs.ts の並び順 + 1) にして、お気に入りを引き継げるようにする
      teamByCode.set(code, { id: index + 1, ...club });
    } else {
      const color = PALETTE[extra % PALETTE.length];
      teamByCode.set(code, {
        id: 100 + extra++, name: tpl.trim(), shortName: tpl.trim(), color, textColor: '#FFFFFF', accentColor: color,
      });
    }
  }
  if (teamByCode.size < 2) throw new Error('戦績表からチームを読み取れません');

  // 試合
  const matches: Match[] = [];
  let round = 0;
  for (const line of section.split('\n')) {
    const r = line.match(/<!--\s*第(\d+)節/);
    if (r) {
      round = Number(r[1]);
      continue;
    }
    const m = line.match(/^\|match_([A-Z0-9]+)_([A-Z0-9]+)\s*=\s*(.*)$/);
    if (!m || round === 0) continue;
    const home = teamByCode.get(m[1]);
    const away = teamByCode.get(m[2]);
    if (!home || !away) continue;
    const value = m[3].trim();

    const base = { id: home.id * 1000 + away.id, round, homeId: home.id, awayId: away.id, timeKnown: false };
    const score = value.match(/(\d+)\s*[-–−]\s*(\d+)/);
    const date = value.match(/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (score && !date) {
      matches.push({ ...base, homeScore: Number(score[1]), awayScore: Number(score[2]), status: 'finished' });
    } else if (date) {
      let kickoff = toKickoff(Number(date[1]), Number(date[2]), startYear);
      const timeKnown = date[3] !== undefined;
      if (timeKnown) kickoff = kickoff.replace('00:00:00', `${date[3].padStart(2, '0')}:${date[4]}:00`);
      matches.push({ ...base, kickoff, timeKnown, homeScore: null, awayScore: null, status: 'scheduled' });
    } else {
      const postponed = /延期|中止/.test(value);
      matches.push({ ...base, homeScore: null, awayScore: null, status: postponed ? 'postponed' : 'scheduled' });
    }
  }
  if (matches.length === 0) throw new Error('戦績表から試合を読み取れません');

  const title = articleTitle(startYear);
  return {
    season: `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`,
    teams: [...teamByCode.values()],
    matches,
    source: 'wikipedia',
    sourceTitle: title,
    sourceUrl: articleUrl(title),
    fetchedAt: now.toISOString(),
  };
}

/**
 * 終了済みで日付の分からない試合に、前回取得したデータの日付を引き継ぐ。
 * (記事では試合が終わると日付がスコアに置き換わるため)
 */
export function carryOverDates(data: SeasonData, previous: SeasonData | null): SeasonData {
  if (!previous || previous.season !== data.season) return data;
  const prev = new Map(previous.matches.map((m) => [m.id, m]));
  return {
    ...data,
    matches: data.matches.map((m) => {
      const p = prev.get(m.id);
      return !m.kickoff && p?.kickoff ? { ...m, kickoff: p.kickoff, timeKnown: p.timeKnown } : m;
    }),
  };
}
