import type { ReplayLayer } from "../../replay/layer-types.ts";

export const mapLayer: ReplayLayer = {
  id: "map",
  order: 0,
  draw({ ctx, radarImg, size }) {
    ctx.drawImage(radarImg, 0, 0, size, size);
    ctx.fillStyle = "rgba(8, 14, 18, 0.52)";
    ctx.fillRect(0, 0, size, size);
  },
};
