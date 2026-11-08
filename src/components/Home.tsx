import type { Match, SeasonData, StandingRow, Team } from '../types';
import { fmtDate, fmtTime, relativeDay } from '../lib/format';
import { lastMatch, nextMatch, teamMatches } from '../lib/standings';
import { FavoriteButton } from './FavoriteButton';
import { FormChips } from './FormChips';
import { MatchCard } from './MatchCard';
import { TeamBadge } from './TeamBadge';

interface Props {
  data: SeasonData;
  teams: Map<number, Team>;
  standings: StandingRow[];
  favorites: number[];
  isFavorite: (id: number) => boolean;
  toggle: (id: number) => void;
  openTeam: (id: number) => void;
  goTeams: () => void;
}

export function Home({ data, teams, standings, favorites, isFavorite, toggle, openTeam, goTeams }: Props) {
  if (favorites.length === 0) {
    return (
      <div className="empty">
        <p className="empty-icon">☆</p>
        <h2>お気に入りチームを登録しよう</h2>
        <p className="muted">登録したチームの次の試合・直近の結果・順位をここにまとめて表示します。</p>
        <button type="button" className="primary" onClick={goTeams}>チームを選ぶ</button>
      </div>
    );
  }

  return (
    <div className="stack">
      {favorites.map((id) => {
        const team = teams.get(id);
        const row = standings.find((s) => s.teamId === id);
        if (!team || !row) return null;
        return (
          <FavoriteCard
            key={id}
            team={team}
            row={row}
            total={standings.length}
            matches={data.matches}
            teams={teams}
            isFavorite={isFavorite}
            toggle={() => toggle(id)}
            openTeam={openTeam}
          />
        );
      })}
    </div>
  );
}

function FavoriteCard({
  team, row, total, matches, teams, isFavorite, toggle, openTeam,
}: {
  team: Team; row: StandingRow; total: number; matches: Match[]; teams: Map<number, Team>;
  isFavorite: (id: number) => boolean; toggle: () => void; openTeam: (id: number) => void;
}) {
  const next = nextMatch(matches, team.id);
  const last = lastMatch(matches, team.id);
  const upcoming = teamMatches(matches, team.id).filter((m) => m.status === 'scheduled' && m !== next).slice(0, 3);

  return (
    <article className="fav-card" style={{ ['--team' as string]: team.color }}>
      <header className="fav-head" onClick={() => openTeam(team.id)}>
        <TeamBadge team={team} size={40} />
        <div className="fav-title">
          <h2>{team.name}</h2>
          <FormChips form={row.form} />
        </div>
        <FavoriteButton active label={team.name} onClick={toggle} />
      </header>

      <div className="stats">
        <Stat label="順位" value={`${row.rank}`} unit={`/${total}`} />
        <Stat label="勝点" value={`${row.points}`} />
        <Stat label="勝-分-負" value={`${row.won}-${row.drawn}-${row.lost}`} />
        <Stat label="得失点" value={`${row.goalDiff > 0 ? '+' : ''}${row.goalDiff}`} />
      </div>

      {next && (
        <section className="next">
          <h3>
            次の試合 <span className="pill">{relativeDay(next.kickoff) || fmtDate(next.kickoff)}</span>
          </h3>
          <NextMatch match={next} team={team} teams={teams} />
        </section>
      )}

      {last && (
        <section>
          <h3>前回の試合</h3>
          <MatchCard match={last} teams={teams} isFavorite={isFavorite} perspective={team.id} showDate onTeamClick={openTeam} />
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h3>今後の予定</h3>
          <ul className="upcoming">
            {upcoming.map((m) => {
              const home = m.homeId === team.id;
              const opp = teams.get(home ? m.awayId : m.homeId);
              return (
                <li key={m.id}>
                  <span className="muted">{fmtDate(m.kickoff)} {fmtTime(m.kickoff)}</span>
                  <span className={`ha ${home ? 'h' : 'a'}`}>{home ? 'H' : 'A'}</span>
                  <span>vs {opp?.shortName}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}

function NextMatch({ match, team, teams }: { match: Match; team: Team; teams: Map<number, Team> }) {
  const home = match.homeId === team.id;
  const opp = teams.get(home ? match.awayId : match.homeId);
  return (
    <div className="next-body">
      <div className="next-when">
        <strong>{fmtDate(match.kickoff)}</strong>
        <span>{fmtTime(match.kickoff)} キックオフ</span>
        <span className="muted">第{match.round}節{match.venue ? ` / ${match.venue}` : ''}</span>
      </div>
      <div className="next-opp">
        <span className={`ha ${home ? 'h' : 'a'}`}>{home ? 'HOME' : 'AWAY'}</span>
        {opp && <TeamBadge team={opp} size={32} />}
        <span>vs {opp?.name}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </span>
    </div>
  );
}
