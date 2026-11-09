import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SeasonData } from './types';
import { loadSeason } from './data';
import { fmtDate, fmtTime } from './lib/format';
import { computeStandings } from './lib/standings';
import { useFavorites } from './lib/useFavorites';
import { Fixtures } from './components/Fixtures';
import { Home } from './components/Home';
import { Standings } from './components/Standings';
import { TeamDetail } from './components/TeamDetail';
import { Teams } from './components/Teams';

type Tab = 'home' | 'fixtures' | 'standings' | 'teams';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'お気に入り', icon: '★' },
  { id: 'fixtures', label: '日程・結果', icon: '📅' },
  { id: 'standings', label: '順位表', icon: '🏆' },
  { id: 'teams', label: 'チーム', icon: '⚽' },
];

const initialTab = (): Tab => {
  const h = location.hash.slice(1) as Tab;
  return TABS.some((t) => t.id === h) ? h : 'home';
};

export default function App() {
  const [data, setData] = useState<SeasonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [openTeamId, setOpenTeamId] = useState<number | null>(null);
  const { favorites, toggle, isFavorite } = useFavorites();

  const load = useCallback(() => {
    setError(null);
    loadSeason().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => load(), [load]);
  useEffect(() => {
    if (location.hash.slice(1) !== tab) history.pushState(null, '', `#${tab}`);
    window.scrollTo(0, 0);
  }, [tab]);
  useEffect(() => {
    const onHash = () => setTab(initialTab());
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onHash);
    };
  }, []);

  const teams = useMemo(() => new Map(data?.teams.map((t) => [t.id, t]) ?? []), [data]);
  const standings = useMemo(() => (data ? computeStandings(data.teams, data.matches) : []), [data]);
  const closeTeam = useCallback(() => setOpenTeamId(null), []);

  const openTeam = openTeamId !== null ? teams.get(openTeamId) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <h1>J2 ナビ</h1>
        {data && (
          <span className="season">
            {data.season}
            <span className="sample-tag">
              {data.source === 'sample' ? 'サンプル' : `${fmtDate(data.fetchedAt)} ${fmtTime(data.fetchedAt)} 更新`}
            </span>
          </span>
        )}
        <button type="button" className="refresh" onClick={load} aria-label="更新">⟳</button>
      </header>

      <main className="content">
        {error && (
          <div className="error">
            データの取得に失敗しました: {error}
            <button type="button" onClick={load}>再試行</button>
          </div>
        )}
        {!data && !error && <p className="muted center">読み込み中…</p>}
        {data && tab === 'home' && (
          <Home data={data} teams={teams} standings={standings} favorites={favorites} isFavorite={isFavorite}
            toggle={toggle} openTeam={setOpenTeamId} goTeams={() => setTab('teams')} />
        )}
        {data && tab === 'fixtures' && (
          <Fixtures data={data} teams={teams} favorites={favorites} isFavorite={isFavorite} openTeam={setOpenTeamId} />
        )}
        {data && tab === 'standings' && (
          <Standings standings={standings} teams={teams} isFavorite={isFavorite} openTeam={setOpenTeamId} />
        )}
        {data && tab === 'teams' && (
          <Teams teams={data.teams} isFavorite={isFavorite} toggle={toggle} openTeam={setOpenTeamId} />
        )}
        {data && (
          <footer className="credit">
            {data.source === 'wikipedia' && data.sourceUrl ? (
              <>
                データ出典: <a href={data.sourceUrl} target="_blank" rel="noreferrer">Wikipedia「{data.sourceTitle}」</a>
                (<a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ja" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>)。
                試合結果は有志の編集で反映されるため、更新に時間差があります。
              </>
            ) : (
              <>表示中のデータは自動生成したサンプルです(実際の試合結果ではありません)。</>
            )}
            <br />
            エンブレム画像: TheSportsDB。エンブレム・クラブカラーの権利は各クラブに帰属します。
          </footer>
        )}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {openTeam && data && (
        <TeamDetail team={openTeam} row={standings.find((s) => s.teamId === openTeam.id)} matches={data.matches}
          teams={teams} isFavorite={isFavorite} toggle={toggle} openTeam={setOpenTeamId} onClose={closeTeam} />
      )}
    </div>
  );
}
