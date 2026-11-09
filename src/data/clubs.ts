import type { Team } from '../types';

export interface Club extends Omit<Team, 'id'> {
  /** 英語名とマッチさせるキー (小文字英数字のみ) */
  key: string;
}

const badge = (file: string) => `https://r2.thesportsdb.com/images/media/team/badge/${file}.png/small`;

/**
 * 2026/27シーズン J2 所属20クラブ。
 * - クラブカラー: 各クラブの Wikipedia 日本語版 infobox (Jリーグ公式プロフィール準拠) の配色
 *   color = 基調色 / textColor = 基調色の上に載せる文字色 / accentColor = 差し色
 * - ロゴ: TheSportsDB (https://www.thesportsdb.com/) の画像を参照。読み込めない場合はカラーの頭文字バッジを表示
 * ロゴ・エンブレムの権利は各クラブに帰属します。
 */
export const J2_CLUBS: Club[] = [
  { key: 'sapporo', name: '北海道コンサドーレ札幌', shortName: '札幌', color: '#B61A14', textColor: '#E2E3E3', accentColor: '#231815', logo: badge('it2q671578253723') },
  { key: 'hachinohe', name: 'ヴァンラーレ八戸', shortName: '八戸', color: '#14A83B', textColor: '#FFFFFF', accentColor: '#F39800', logo: badge('2tl5fv1617289724') },
  { key: 'sendai', name: 'ベガルタ仙台', shortName: '仙台', color: '#FFD700', textColor: '#0000CD', accentColor: '#DC0038', logo: badge('2xxh2c1578239899') },
  { key: 'akita', name: 'ブラウブリッツ秋田', shortName: '秋田', color: '#005BAB', textColor: '#FFFFFF', accentColor: '#A9904C', logo: badge('mi64031706246538') },
  { key: 'yamagata', name: 'モンテディオ山形', shortName: '山形', color: '#014099', textColor: '#FFF338', accentColor: '#FFF338', logo: badge('e9nykx1639487487') },
  { key: 'iwaki', name: 'いわきFC', shortName: 'いわき', color: '#C01730', textColor: '#FFFFFF', accentColor: '#1E2652', logo: badge('w3igvh1638823138') },
  { key: 'tochigicity', name: '栃木シティFC', shortName: '栃木C', color: '#002955', textColor: '#FFFFFF', accentColor: '#FFFFFF', logo: badge('29x1qq1734321870') },
  { key: 'omiya', name: 'RB大宮アルディージャ', shortName: '大宮', color: '#001D45', textColor: '#ED6D00', accentColor: '#ED6D00', logo: badge('5bcan31734626857') },
  { key: 'yokohamafc', name: '横浜FC', shortName: '横浜FC', color: '#00A1E9', textColor: '#FFFFFF', accentColor: '#013588', logo: badge('k5f7kz1578240065') },
  { key: 'shonan', name: '湘南ベルマーレ', shortName: '湘南', color: '#6EB92B', textColor: '#FFFFFF', accentColor: '#005CA2', logo: badge('mnfxtl1578239658') },
  { key: 'kofu', name: 'ヴァンフォーレ甲府', shortName: '甲府', color: '#1937B7', textColor: '#FFFFFF', accentColor: '#B61B19', logo: badge('z37pbr1590071044') },
  { key: 'niigata', name: 'アルビレックス新潟', shortName: '新潟', color: '#EA5404', textColor: '#FFFFFF', accentColor: '#014099', logo: badge('l16fvz1590070788') },
  { key: 'toyama', name: 'カターレ富山', shortName: '富山', color: '#111987', textColor: '#FFFFFF', accentColor: '#840126', logo: badge('wri77d1617289688') },
  { key: 'iwata', name: 'ジュビロ磐田', shortName: '磐田', color: '#6C8CBD', textColor: '#FFFFFF', accentColor: '#6C8CBD', logo: badge('bmdnci1590070867') },
  { key: 'fujieda', name: '藤枝MYFC', shortName: '藤枝', color: '#86347C', textColor: '#FFFFFF', accentColor: '#8BC01F', logo: badge('4vjy3y1617289642') },
  { key: 'tokushima', name: '徳島ヴォルティス', shortName: '徳島', color: '#01426A', textColor: '#FFFFFF', accentColor: '#007749', logo: badge('s4i3311706245645') },
  { key: 'imabari', name: 'FC今治', shortName: '今治', color: '#171C61', textColor: '#FFFFFF', accentColor: '#FFF100', logo: badge('s3f0u11617289673') },
  { key: 'tosu', name: 'サガン鳥栖', shortName: '鳥栖', color: '#00A1D3', textColor: '#FFFFFF', accentColor: '#EA549A', logo: badge('jsepp91578250937') },
  { key: 'oita', name: '大分トリニータ', shortName: '大分', color: '#140B8C', textColor: '#FFB606', accentColor: '#FFB606', logo: badge('kwyqsd1578239318') },
  { key: 'miyazaki', name: 'テゲバジャーロ宮崎', shortName: '宮崎', color: '#FFFFFF', textColor: '#E12A75', accentColor: '#E12A75', logo: badge('bz848c1617289716') },
];

/** サンプルデータ用のチーム一覧 (id は 1〜20 の連番) */
export const SAMPLE_TEAMS: Team[] = J2_CLUBS.map(({ key: _key, ...club }, i) => ({ id: i + 1, ...club }));

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** "Júbilo Iwata" や "Tochigi City FC" のような英語名からクラブを探す */
export function findClub(englishName: string): Club | undefined {
  const n = normalize(englishName);
  return J2_CLUBS.find((c) => n.includes(c.key));
}
