import { useMemo, useState } from 'react';
import type { SeasonData, Team } from '../types';
import { dateKey, fmtDate } from '../lib/format';
import { byRound, currentRound } from '../lib/standings';
import { MatchCard } from './MatchCard';

interface Props {
  data: SeasonData;
  teams: Map<number, Team>;
  favorites: number[];
  isFavorite: (id: number) => boolean;
  openTeam: (id: number) => void;
}

export function Fixtures({ data, teams, favorites, isFavorite, openTeam }: Props) {
  const rounds = useMemo(() => [...new Set(data.matches.map((m) => m.round))].sort((a, b) => a - b), [data]);
  const [round, setRound] = useState(() => currentRound(data.matches));
  const [favOnly, setFavOnly] = useState(false);

  const list = data.matches
    .filter((m) => m.round === round)
    .filter((m) => !favOnly || isFavorite(m.homeId) || isFavorite(m.awayId))
    .sort(byRound);

  const byDate = new Map<string, typeof list>();
  for (const m of list) {
    const k = m.kickoff ? dateKey(m.kickoff) : '';
    byDate.set(k, [...(byDate.get(k) ?? []), m]);
  }

  const idx = rounds.indexOf(round);

  return (
    <div className="stack">
      <div className="round-nav">
        <button type="button" disabled={idx <= 0} onClick={() => setRound(rounds[idx - 1])} aria-label="前の節">‹</button>
        <select value={round} onChange={(e) => setRound(Number(e.target.value))} aria-label="節を選択">
          {rounds.map((r) => (
            <option key={r} value={r}>第{r}節</option>
          ))}
        </select>
        <button type="button" disabled={idx >= rounds.length - 1} onClick={() => setRound(rounds[idx + 1])} aria-label="次の節">›</button>
      </div>

      <label className={`toggle ${favorites.length === 0 ? 'disabled' : ''}`}>
        <input type="checkbox" checked={favOnly} disabled={favorites.length === 0} onChange={(e) => setFavOnly(e.target.checked)} />
        お気に入りチームのみ表示
      </label>

      {list.length === 0 && <p className="muted center">この節に表示する試合はありません。</p>}

      {[...byDate.entries()].map(([day, ms]) => (
        <section key={day}>
          {day && <h3 className="date-head">{fmtDate(ms[0].kickoff!)}</h3>}
          <div className="stack-sm">
            {ms.map((m) => (
              <MatchCard key={m.id} match={m} teams={teams} isFavorite={isFavorite} onTeamClick={openTeam} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
