import { useMemo } from "react";
import { Texture } from "pixi.js";
import type { ReplayLayerContext } from "../replay/layer-types.ts";
import "./pixi-setup.ts";

export function MapLayer({ radarImg, size }: ReplayLayerContext) {
  const texture = useMemo(() => {
    const tex = Texture.from(radarImg as HTMLImageElement);
    tex.source.scaleMode = "nearest";
    return tex;
  }, [radarImg]);

  return (
    <>
      <pixiSprite
        texture={texture}
        width={size}
        height={size}
        eventMode="none"
      />
      <pixiGraphics
        eventMode="none"
        draw={(g) => {
          g.clear();
          g.rect(0, 0, size, size).fill({ color: "rgba(8, 14, 18, 0.52)" });
        }}
      />
    </>
  );
}
