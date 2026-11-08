import type { CSSProperties } from 'react';
import type { Team } from '../types';

/** クラブカラーを CSS 変数として渡す */
export const teamVars = (t: Team) =>
  ({ '--team': t.color, '--team-text': t.textColor, '--team-accent': t.accentColor }) as CSSProperties;
