import type { Team } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { TeamBadge } from './TeamBadge';

interface Props {
  teams: Team[];
  isFavorite: (id: number) => boolean;
  toggle: (id: number) => void;
  openTeam: (id: number) => void;
}

export function Teams({ teams, isFavorite, toggle, openTeam }: Props) {
  const sorted = [...teams].sort((a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id)));
  return (
    <div className="stack">
      <p className="muted">☆ をタップしてお気に入りに登録できます(複数可)。</p>
      <ul className="team-list">
        {sorted.map((t) => (
          <li key={t.id} className={isFavorite(t.id) ? 'fav' : ''} onClick={() => openTeam(t.id)}>
            <TeamBadge team={t} size={32} />
            <span className="team-list-name">{t.name}</span>
            <FavoriteButton active={isFavorite(t.id)} label={t.name} onClick={() => toggle(t.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
