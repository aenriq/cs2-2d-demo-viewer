import type { ReplayLayer } from "../../replay/layer-types.ts";

export const mapLayer: ReplayLayer = {
  id: "map",
  order: 0,
  draw({ ctx, radarImg, size }) {
    ctx.drawImage(radarImg, 0, 0, size, size);
  },
};
