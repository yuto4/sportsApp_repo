import { useState } from 'react';
import type { Team } from '../types';

/** クラブロゴ。読み込めない場合はクラブカラーの頭文字バッジにフォールバック */
export function TeamBadge({ team, size = 28 }: { team: Team; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (team.logo && !failed) {
    return (
      <img
        className="badge badge-logo"
        src={team.logo}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className="badge"
      style={{
        width: size,
        height: size,
        background: team.color,
        color: team.textColor,
        boxShadow: `inset 0 0 0 ${Math.max(2, size / 14)}px ${team.accentColor}`,
        fontSize: size * 0.42,
      }}
      aria-hidden
    >
      {team.shortName.slice(0, 1)}
    </span>
  );
}
