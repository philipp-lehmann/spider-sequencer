# Ideas backlog

Collected 2026-10-28 after the first playable version.

## Shape manipulation

- [ ] Add in-between notes (subdivide every edge of the polygon)
- [ ] Scale a shape (closer to / further from the center)
- [ ] Twist a shape (rotate pitch or volume relative to time, spiral effect)
- [ ] Other shape transforms: mirror, invert, smooth, stretch in time
- [ ] Align all notes of a track to the same pitch / volume

## Playing

- [ ] Chords mode (one node triggers a chord instead of a single note)
- [x] Option to disable the preview sound when adding or dragging notes

## Generating

- [ ] Make Random more predictable (seed, density, range, keep rhythm and vary pitch or the other way round, "mutate a little")
- [ ] Easy way to add simple shapes (triangle, square, star, polygon with n corners, circle on the grid)

- [ ] Creature mode: instead of fixed points, drop critters onto the web. Each creature moves in its own way and so creates its own beat.
  - Spider: four to the floor, steps along the main spokes
  - Centipede: rotates around the web, many short hits along its body
  - Ant: buzzing, small fast jitter around a spot
  - Open: how creatures map to pitch / volume, whether they can collide or interact, mixing creatures with fixed notes

## Sound

- [ ] Effects (per track and / or master, e.g. reverb, delay settings, filter, distortion, bitcrush)
- [ ] Hook in custom sounds / synths (own presets, samples, external synth definitions)

## Display

- [ ] Visualizer mode (full-screen, no controls, shapes react to the music)

## Multi-device

- [ ] Sync across devices to play together (shared tempo, transport and pattern state)
- [ ] Visual-only output on a second device (e.g. a projector or screen showing the web, no controls)
- Note: needs a realtime channel. The artifact version has no WebRTC, so this likely means a small WebSocket server for the standalone version.

## Suggested earlier (not decided)

- [ ] MIDI out to drive hardware synths
- [ ] Per-note length (hold notes)
- [ ] Export the song as WAV
