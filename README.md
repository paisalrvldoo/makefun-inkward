# INKWARD

Paint ink walls, encircle wandering yokai, and protect the shrine bell through eight scrolls.
An original canvas game by paisalrvldoo for make.fun best-game-01.

Run `node serve.ts --port 8123` and open http://localhost:8123. No build, dependencies or external assets.

Controls: WASD moves, Space dashes, left mouse paints, right mouse splashes, Q freezes spirits,
E wards the bell, P pauses, M mutes. Close a stroke around spirits to seal them. Release to refill ink.
Clear a scroll and choose an art with 1/2/3 or a click. Clear all eight to win; bell HP zero loses.
R or the results button restarts. Best score saves locally.

Validation:

```sh
node scripts/check-syntax.mjs
node scripts/check-core.mjs
# Requires a running server and google-chrome. Tests real mouse and keyboard input.
node scripts/check-browser.mjs
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`shots.json` defines the four submission views. `?shot=start|play|draft|end|win&seed=1` replays the
real rules with recorded-style input paths, without fabricated scores or terminal states.
The browser check saves unmodified JPEG renders to `/tmp/ink-{start,play,draft,end,win}.jpg`.
The gameplay view is the cover; title, upgrade choice and victory with restart show the loop.

Core checkpoint: movement/dash, painting/erosion, self-intersection and closed-loop seals,
ink refunds, bell HP, score/combo/grades, six yokai behaviours, eight scrolls/four seasons,
three oni encounters, twelve draftable arts, two rituals, pause, synthesized audio and persistence.
Next pass: playtest difficulty, deepen oni patterns and seasonal scenery, and tune feedback and shot composition.
