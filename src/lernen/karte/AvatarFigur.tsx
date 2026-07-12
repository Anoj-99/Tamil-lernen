// Der Avatar auf der Karte: fester Begleiter (Version 1, Personalisierung
// folgt später). Wippt im Stand, beim Laufen übernimmt useAvatarLauf die
// Bewegung entlang des Wegs.
import { memo } from "react";
import { AVATAR } from "./kartenKonfig";
import { WegPunkt } from "./wegGenerator";

interface Props {
  position: WegPunkt;
  laeuft: boolean;
  emoji: string;
}

function AvatarFigur({ position, laeuft, emoji }: Props) {
  return (
    <g
      transform={`translate(${position.x} ${position.y - AVATAR.radius - 13})`}
      aria-label="Dein Begleiter"
    >
      <ellipse cx="0" cy={AVATAR.radius + 15} rx="14" ry="5" fill="#3f4a38" opacity={0.2} />
      {/* Wipp-Animation auf einer inneren Gruppe, damit die CSS-
          Transformation die Positions-Transformation nicht überschreibt */}
      <g className={laeuft ? undefined : "karte-avatar-bob"}>
        <circle cx="0" cy="0" r={AVATAR.radius} fill="#fffdf5" stroke="#d9942b" strokeWidth="3" />
        <text x="0" y="9" textAnchor="middle" fontSize="26">
          {emoji}
        </text>
      </g>
    </g>
  );
}

export default memo(AvatarFigur);
