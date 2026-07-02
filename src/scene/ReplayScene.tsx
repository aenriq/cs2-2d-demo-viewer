import type { ReplayLayer, ReplayLayerContext } from "../replay/layer-types.ts";
import "./pixi-setup.ts";

export function ReplayScene({
  layers,
  context,
}: {
  layers: ReplayLayer[];
  context: ReplayLayerContext;
}) {
  return (
    <pixiContainer sortableChildren>
      {layers.map((layer) => {
        if (layer.isAvailable && !layer.isAvailable(context.demo)) return null;
        return (
          <pixiContainer key={layer.id} zIndex={layer.order}>
            {layer.render(context)}
          </pixiContainer>
        );
      })}
    </pixiContainer>
  );
}
