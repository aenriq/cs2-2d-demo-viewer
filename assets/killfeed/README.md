# Killfeed icons

SVG icons extracted from CS2 game files via [Juknum/counter-strike-icons](https://github.com/Juknum/counter-strike-icons).

## Layout

```
killfeed/
  equipment/     # weapon + grenade icons (ak47.svg, awp.svg, …)
  modifiers/     # headshot, noscope, blind, smoke, …
  manifest.json  # generated file list (optional)
```

## Refresh

```bash
bun run scripts/fetch-killfeed-icons.ts
```

## Modifier files

| File | In-game meaning |
|------|-----------------|
| `headshot.svg` | Headshot kill |
| `noscope.svg` | No-scope kill |
| `blind.svg` | Attacker was flashed |
| `smoke.svg` | Kill through smoke |
| `penetrate.svg` | Wallbang (penetration) |
| `inair.svg` | Attacker airborne |
| `revenge.svg` | Trade / revenge kill |
| `flash_assist.svg` | Flash assist (stored in equipment/) |
| `domination.svg` | Domination |
| `suicide.svg` | Suicide / self damage |

## License

Icons are Valve assets. Juknum repo extracts them for reference. Use accordingly for non-commercial / educational tooling.
