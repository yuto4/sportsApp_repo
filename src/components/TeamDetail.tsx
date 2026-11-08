import { useEffect } from 'react';
import type { Match, StandingRow, Team } from '../types';
import { teamMatches } from '../lib/standings';
import { FavoriteButton } from './FavoriteButton';
import { FormChips } from './FormChips';
import { MatchCard } from './MatchCard';
import { TeamBadge } from './TeamBadge';

interface Props {
  team: Team;
  row?: StandingRow;
  matches: Match[];
  teams: Map<number, Team>;
  isFavorite: (id: number) => boolean;
  toggle: (id: number) => void;
  openTeam: (id: number) => void;
  onClose: () => void;
}

export function TeamDetail({ team, row, matches, teams, isFavorite, toggle, openTeam, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const list = teamMatches(matches, team.id);
  const played = list.filter((m) => m.status === 'finished').reverse();
  const upcoming = list.filter((m) => m.status !== 'finished');

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={team.name} onClick={(e) => e.stopPropagation()}>
        <header className="sheet-head" style={{ ['--team' as string]: team.color }}>
          <TeamBadge team={team} size={44} />
          <div className="fav-title">
            <h2>{team.name}</h2>
            {row && (
              <span className="muted">
                {row.rank}位 / 勝点{row.points} / {row.won}勝{row.drawn}分{row.lost}敗
              </span>
            )}
          </div>
          <FavoriteButton active={isFavorite(team.id)} label={team.name} onClick={() => toggle(team.id)} />
          <button type="button" className="close" onClick={onClose} aria-label="閉じる">×</button>
        </header>
        <div className="sheet-body stack">
          {row && <div>直近5試合: <FormChips form={row.form} /></div>}
          <section>
            <h3>今後の試合 ({upcoming.length})</h3>
            <div className="stack-sm">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} teams={teams} isFavorite={isFavorite} showDate onTeamClick={openTeam} />
              ))}
            </div>
          </section>
          <section>
            <h3>試合結果 ({played.length})</h3>
            <div className="stack-sm">
              {played.map((m) => (
                <MatchCard key={m.id} match={m} teams={teams} isFavorite={isFavorite} perspective={team.id} showDate onTeamClick={openTeam} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
