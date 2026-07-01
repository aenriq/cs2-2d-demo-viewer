# Examples

Runnable apps that show how to integrate **cs2-demo-viewer** in a React project.

Each folder is a small Vite app with its own README.

| Example | What it teaches |
|---------|-----------------|
| [basic-replay](./basic-replay/) | Smallest useful setup — parsed JSON, radar canvas, play / scrub |
| [full-replay](./full-replay/) | Everything — all hooks, layers, killfeed, economy, events, round nav |

## Running an example

From the repo root:

```bash
npm run build          # build the library once (needed when using file: link)
cd examples/basic-replay
npm install
npm run dev
```

Open the URL Vite prints (`5174` for basic-replay, `5175` for full-replay).
