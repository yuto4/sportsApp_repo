import type { StandingRow, Team } from '../types';
import { FormChips } from './FormChips';
import { TeamBadge } from './TeamBadge';

interface Props {
  standings: StandingRow[];
  teams: Map<number, Team>;
  isFavorite: (id: number) => boolean;
  openTeam: (id: number) => void;
}

/** J2: 1-2位 自動昇格 / 3-6位 昇格プレーオフ / 下位3チーム J3降格圏 */
function zone(rank: number, total: number) {
  if (rank <= 2) return 'zone-promo';
  if (rank <= 6) return 'zone-playoff';
  if (rank > total - 3) return 'zone-releg';
  return '';
}

export function Standings({ standings, teams, isFavorite, openTeam }: Props) {
  return (
    <div className="stack">
      <div className="table-wrap">
        <table className="standings">
          <thead>
            <tr>
              <th>#</th>
              <th className="left">チーム</th>
              <th>試</th>
              <th>勝点</th>
              <th>勝</th>
              <th>分</th>
              <th>負</th>
              <th>得</th>
              <th>失</th>
              <th>差</th>
              <th className="hide-sm">直近5試合</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((r) => {
              const t = teams.get(r.teamId);
              if (!t) return null;
              return (
                <tr key={r.teamId} className={`${zone(r.rank, standings.length)} ${isFavorite(r.teamId) ? 'row-fav' : ''}`} onClick={() => openTeam(r.teamId)}>
                  <td className="rank">{r.rank}</td>
                  <td className="left team-cell">
                    <TeamBadge team={t} size={22} />
                    <span>{t.shortName}</span>
                    {isFavorite(r.teamId) && <span className="star">★</span>}
                  </td>
                  <td>{r.played}</td>
                  <td className="pts">{r.points}</td>
                  <td>{r.won}</td>
                  <td>{r.drawn}</td>
                  <td>{r.lost}</td>
                  <td>{r.goalsFor}</td>
                  <td>{r.goalsAgainst}</td>
                  <td>{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
                  <td className="hide-sm"><FormChips form={r.form} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="legend">
        <li><i className="zone-promo" />J1自動昇格</li>
        <li><i className="zone-playoff" />J1昇格プレーオフ</li>
        <li><i className="zone-releg" />J3降格圏</li>
        <li><i className="row-fav" />お気に入り</li>
      </ul>
    </div>
  );
}
