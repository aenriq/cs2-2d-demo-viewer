import type { ImgHTMLAttributes } from "react";
import type { KillEvent } from "../utils/killfeed.ts";
import {
  DEFAULT_KILLFEED_ICON_BASE,
  getKillModifiers,
  getModifierIconUrl,
  getWeaponIconUrl,
  KILLFEED_MODIFIER_LABELS,
  type KillfeedModifierId,
} from "./icon-registry.ts";

export interface KillfeedIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  baseUrl?: string;
  size?: number;
}

export function KillfeedWeaponIcon({
  weapon,
  baseUrl = DEFAULT_KILLFEED_ICON_BASE,
  size = 20,
  ...rest
}: KillfeedIconProps & { weapon?: string }) {
  return (
    <img
      src={getWeaponIconUrl(weapon, baseUrl)}
      alt=""
      width={size}
      height={size}
      draggable={false}
      {...rest}
    />
  );
}

export function KillfeedModifierIcon({
  modifier,
  baseUrl = DEFAULT_KILLFEED_ICON_BASE,
  size = 16,
  ...rest
}: KillfeedIconProps & { modifier: KillfeedModifierId }) {
  return (
    <img
      src={getModifierIconUrl(modifier, baseUrl)}
      alt={KILLFEED_MODIFIER_LABELS[modifier]}
      title={KILLFEED_MODIFIER_LABELS[modifier]}
      width={size}
      height={size}
      draggable={false}
      {...rest}
    />
  );
}

export interface KillfeedIconRowProps {
  event: KillEvent;
  baseUrl?: string;
  weaponSize?: number;
  modifierSize?: number;
  className?: string;
}

/** Default visual killfeed row: `[mods…] weapon` — style via className. */
export function KillfeedIconRow({
  event,
  baseUrl = DEFAULT_KILLFEED_ICON_BASE,
  weaponSize = 20,
  modifierSize = 16,
  className,
}: KillfeedIconRowProps) {
  const modifiers = getKillModifiers(event);

  return (
    <span className={className}>
      {modifiers.map((mod) => (
        <KillfeedModifierIcon
          key={mod}
          modifier={mod}
          baseUrl={baseUrl}
          size={modifierSize}
        />
      ))}
      <KillfeedWeaponIcon weapon={event.weapon} baseUrl={baseUrl} size={weaponSize} />
    </span>
  );
}
