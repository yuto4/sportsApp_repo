import type { Team } from '../types';

export function TeamBadge({ team, size = 28 }: { team: Team; size?: number }) {
  if (team.logo) {
    return <img className="badge" src={team.logo} alt="" width={size} height={size} />;
  }
  return (
    <span
      className="badge"
      style={{ width: size, height: size, background: team.color, fontSize: size * 0.42 }}
      aria-hidden
    >
      {team.shortName.slice(0, 1)}
    </span>
  );
}
