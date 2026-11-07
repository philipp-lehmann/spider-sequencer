# Spider Sequencer

Browser-based circular step sequencer. Each track is a spider chart: the angle is time, the distance from the center is pitch or volume. Single file (`index.html`), plain JS, Web Audio, SVG. No build step, no dependencies.

Live version: Claude artifact "Spider Sequencer" (shared via link).
Visual reference: `kiki-reference.png` in the project's Dropbox folder (`01 Material`). Boxed Swiss look, 2px outlines, flat primaries, mono type.

## Current features

- One circle, all tracks overlaid. The selected track is editable, others show faintly.
- Click to add, drag to move, double-click / right-click / drop on center to delete, Alt-drag to rotate.
- Snap: 1/16, 1/8, 1/4 or Free. Shift ignores the grid for one note.
- Global toggle: radius = pitch (snapped to scale) or volume. Each note stores both.
- Key: root note and scale (minor, major, dorian, phrygian, pentatonic, chromatic).
- Tracks: name, colour, sound, loop length (1 to 8 bars), octave, volume, mute, solo, duplicate, delete.
- Sounds: Sub Bass, Acid, Pluck, Pad, Lead, FM Bell, Tom, Kick, Snare, Hi-Hat, Clap. Shared delay send.
- Patterns A to H per track, each with its own loop length. "All tracks" row syncs every track to one letter.
- Song: global chain of pattern letters with repeats. Song mode switches all tracks per block.
- Starter sets: Minimal Techno, Ambient Drift, Arp Machine.
- Undo, export / import as JSON, state saved in the browser.
- Help dialog, keyboard shortcuts, Feather icons, light and dark theme.

## Data model (export format, version 3)

- `tracks[]`: id, name, preset, color, vol, base (MIDI octave), mute, solo, pat (current pattern)
- `patterns[]`: id (A to H), bars (length in the song), clips { trackId: { bars, notes[] } }
- note: t (0..1 position in the clip), p (0..1 pitch, quantised to scale), v (0..1 velocity)
- `song[]`: { pat, reps }
- Older v1 / v2 files still load.

## Structure

- `index.html`: the whole app, opens directly in a browser
- `docs/ideas.md`: ideas backlog

Project material and transfers live in Dropbox, this folder is code only.

## Ideas

See `docs/ideas.md`.
