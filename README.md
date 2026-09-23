# Brickwork

A done log you can look at. Every win is a toy brick that snaps onto its goal's tower; the towers only grow, and "Play the film" replays the whole build as a 12 fps stop-motion film where each brick plays a note.

- Pick up to six goals on first run.
- Press a goal's brick to log a win; hold it for a bigger brick (1x2, 2x2, 2x4). Keys 1 to 6 do the same.
- The day strip steps back through past days; arrow keys move it, Esc returns to today.
- Click a brick to add a note or take it off. Cmd+Z undoes the last drop.
- The set follows your Mac's appearance: daylight, or one warm lamp at night.

Data stays in this browser's localStorage for `localhost:5188`. No account, no server.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5188. `?day` or `?night` forces the lighting.

## Test

```sh
npm test          # tower stacking rules
npm run build     # type check and production build
```
