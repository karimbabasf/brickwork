# Brickwork

A done log you can look at. Every win is a toy brick that snaps onto its goal's tower; the towers only grow, and "Play the film" replays the whole build as a 12 fps stop-motion film where each brick plays a note.

Live: https://brickwork-iota.vercel.app

- Pick up to six goals on first run.
- Press a goal's brick to log a win; hold it for a bigger brick (1x2, 2x2, 2x4). Keys 1 to 6 do the same.
- The day strip steps back through past days; arrow keys move it, Esc returns to today.
- Click a brick to add a note or take it off. Cmd+Z undoes the last drop.
- The set follows your device's appearance: daylight, or one warm lamp at night.

## Sync

One private log per deployment, stored in a private Vercel Blob. There are no accounts: a device joins by opening the sync link (`/#sync=<token>`) once; the token then lives in that browser and leaves the address bar. On a synced device the cloud button copies the link for the next device. Without the link the app still works, saved only in that browser.

The token is the `BRICKWORK_TOKEN` environment variable on Vercel (production). To revoke every device, set a new value and redeploy; then open the new link on each device.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:5188. Its `/api` is proxied to the live deployment (override with `BRICKWORK_API`), so a local copy opened with the sync link syncs with the same log. `?day` or `?night` forces the lighting.

## Test

```sh
npm test          # stacking, seats, merge and input checks
npm run build     # type check and production build
```

## Deploy

Pushes to `main` deploy to production through Vercel's GitHub integration.
