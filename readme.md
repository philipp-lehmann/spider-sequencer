# Spider Sequencer

Browser-based circular step sequencer. Each track is a spider chart: the angle is time, the distance from the center is pitch or volume. Plain JS (ES modules), Web Audio, SVG, Tailwind CSS. Vite for dev and build; no runtime dependencies.

Live version of initial idea: Claude artifact "Spider Sequencer".
https://claude.ai/artifact/AVptBwnK3h2BWW4gbVC5ye?sk=JFB35VVtYdgkEsVGm3SLWQ

## Current features

- One circle, all tracks overlaid. The selected track is editable, others show faintly.
- Click to add, drag to move, double-click / right-click / drop on center to delete, Alt-drag to rotate.
- Snap: 1/16, 1/8, 1/4 or Free. Shift ignores the grid for one note.
- Global toggle: radius = pitch (snapped to scale) or volume. Each note stores both.
- Settings dialog (saved per browser, not in the project):
  - Circle: one turn = one loop of the track (short loops spin faster), or always 4 bars (one shared playhead, short loops repeat around the circle).
  - Preview sound on / off while adding or dragging notes.
- Key: root note and scale (minor, major, dorian, phrygian, pentatonic, chromatic).
- Tracks: name, colour, sound, loop length (1 to 8 bars), octave, volume, mute, solo, duplicate, delete.
- Sounds: Sub Bass, Acid, Pluck, Pad, Lead, FM Bell, Tom, Kick, Snare, Hi-Hat, Clap. Shared delay send.
- Patterns A to H per track, each with its own loop length. "All tracks" row syncs every track to one letter.
- Song: global chain of pattern letters with repeats. Song mode switches all tracks per block.
- Starter sets: Minimal Techno, Ambient Drift, Arp Machine.
- Undo, export / import as JSON, state saved in the browser.
- Help dialog, keyboard shortcuts, Feather icons, light and dark theme.

## Data model (export format, version 3)

- top level: bpm, mode (`pitch` / `volume`), snap, root, scale, sel, pat, playMode

- `tracks[]`: id, name, preset, color, vol, base (MIDI octave), mute, solo, pat (current pattern)
- `patterns[]`: id (A to H), bars (length in the song), clips { trackId: { bars, notes[] } }
- note: t (0..1 position in the clip), p (0..1 pitch, quantised to scale), v (0..1 velocity)
- `song[]`: { pat, reps }
- Older v1 / v2 files still load.

## Development

```sh
npm install
npm start        # dev server on localhost, opens the browser
npm run build    # self-contained dist/index.html (JS and CSS inlined)
npm run preview  # serve the build
```

The build is a single HTML file, so it can still be shared or pasted as one artifact.

## Feature flags

New features sit behind a flag in `js/features.js`, one line each (`circleBars: true`). Set it to `false` to switch the feature off: code checks `feature('name')`, and markup tagged `data-feature="name"` is removed.

To test without editing the file, use the URL: `?off=circleBars` or `?on=someFeature` (comma-separated for several).

## Structure

- `index.html`: markup
- `css/style.css`: Tailwind entry, design tokens (light / dark) and component styles
- `js/main.js`: boot
- `js/features.js`: feature flags
- `js/prefs.js`, `js/settings.js`: app settings (localStorage) and the settings dialog
- `js/constants.js`, `js/util.js`, `js/icons.js`: shared constants, helpers, Feather icons
- `js/state.js`: app state and the helpers that read it; `js/storage.js`: JSON format and localStorage; `js/history.js`: undo
- `js/audio.js`, `js/presets.js`: Web Audio graph and synth voices
- `js/transport.js`: play / pause, tempo, look-ahead scheduler, song timeline
- `js/view.js`, `js/geometry.js`, `js/grid.js`, `js/stage.js`, `js/readout.js`: the circle (shared view state, polar maths, background, per-frame drawing, status line)
- `js/editor.js`, `js/tools.js`: pointer editing and the buttons under the circle
- `js/tracks.js`, `js/header.js`, `js/song.js`, `js/dialogs.js`, `js/toast.js`, `js/keyboard.js`: the rest of the UI
- `js/sets.js`: starter sets
- `docs/ideas.md`: ideas backlog

Project material and transfers live in Dropbox, this folder is code only.

## Ideas

See `docs/ideas.md`.
