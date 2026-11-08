import type { Match, Team } from '../types';
import { fmtDate, fmtTime } from '../lib/format';
import { resultFor } from '../lib/standings';
import { TeamBadge } from './TeamBadge';

interface Props {
  match: Match;
  teams: Map<number, Team>;
  isFavorite: (id: number) => boolean;
  /** このチーム視点で勝敗を色付け */
  perspective?: number;
  showDate?: boolean;
  onTeamClick?: (id: number) => void;
}

export function MatchCard({ match, teams, isFavorite, perspective, showDate, onTeamClick }: Props) {
  const home = teams.get(match.homeId);
  const away = teams.get(match.awayId);
  if (!home || !away) return null;
  const fav = isFavorite(match.homeId) || isFavorite(match.awayId);
  const result = perspective ? resultFor(match, perspective) : null;
  const done = match.status === 'finished';

  const side = (t: Team, align: 'home' | 'away') => (
    <button type="button" className={`side ${align} ${isFavorite(t.id) ? 'fav' : ''}`} onClick={() => onTeamClick?.(t.id)}>
      {align === 'away' && <TeamBadge team={t} />}
      <span className="team-name">{t.shortName}</span>
      {align === 'home' && <TeamBadge team={t} />}
    </button>
  );

  return (
    <div className={`match ${fav ? 'match-fav' : ''} ${result ? `res-${result}` : ''}`}>
      <div className="match-meta">
        {showDate && <span>{fmtDate(match.kickoff)}</span>}
        <span>第{match.round}節</span>
        {match.venue && <span className="venue">{match.venue}</span>}
      </div>
      <div className="match-row">
        {side(home, 'home')}
        <div className="score">
          {done ? (
            <span className="score-num">{match.homeScore} - {match.awayScore}</span>
          ) : match.status === 'live' ? (
            <span className="score-num live">{match.homeScore ?? 0} - {match.awayScore ?? 0}</span>
          ) : match.status === 'postponed' ? (
            <span className="muted">延期</span>
          ) : (
            <span className="kickoff">{fmtTime(match.kickoff)}</span>
          )}
          {match.status === 'live' && <span className="live-tag">LIVE</span>}
        </div>
        {side(away, 'away')}
      </div>
    </div>
  );
}
