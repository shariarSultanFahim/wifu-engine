# my-anime-engine

A lightweight, extensible engine for creating 2D anime-style animations and simple games. Designed to be framework-agnostic and easy to integrate into web or desktop projects.

## Features

- Core animation loop with configurable timestep
- Sprite-sheet and frame-based animation support
- Simple scene and entity system
- Basic asset loader (images, audio)
- Plug-in friendly (renderers, input, physics)

## Quickstart

Prerequisites

- Node.js (14+ recommended) — or adapt commands for your environment

Install

```bash
git clone <repo-url> .
npm install
```

Run (example scripts — adapt to your project)

```bash
npm run dev     # start a development build / example app
npm run build   # produce a production bundle
npm test        # run tests
```

## Basic usage (pseudo-example)

```js
import { Engine, Scene, Sprite } from "my-anime-engine";

const engine = new Engine({ width: 800, height: 600 });
const scene = new Scene();

const hero = new Sprite("assets/hero-spritesheet.png", {
  frameWidth: 64,
  frameHeight: 64,
  animations: {
    idle: { frames: [0, 1, 2], rate: 8 },
    run: { frames: [3, 4, 5, 6], rate: 12 },
  },
});

hero.play("idle");
scene.add(hero);
engine.start(scene);
```

## Project structure (suggested)

- /src — engine source
- /examples — runnable demos
- /docs — usage and API docs
- /tests — unit and integration tests
- README.md — this file

## Development

- Follow consistent formatting and linting (Prettier, ESLint recommended)
- Write unit tests for new features
- Keep public API stable; use feature branches and PRs

## Contributing

- Open an issue for feature requests or bugs
- Fork the repo, branch from main, and submit a pull request
- Include tests and update docs for new functionality

## License

MIT — see LICENSE file for details

## TODO / Roadmap (examples)

- WebGL renderer
- Timeline editor / visual tool
- Plugin marketplace / examples

Contributions and feedback welcome.
