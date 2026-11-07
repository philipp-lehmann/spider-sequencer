export const TAU = Math.PI * 2;
/* inner (hub) and outer radius of the editing ring, in SVG units */
export const R0 = 74, R1 = 440;

export const PALETTE = ['#F6D44A', '#E84B3C', '#469A44', '#3366F0', '#F08A24', '#8A5CF5', '#F07AB5', '#2BB3B1'];
export const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const SCALES = {
  minor: { l: 'Minor', iv: [0, 2, 3, 5, 7, 8, 10] },
  major: { l: 'Major', iv: [0, 2, 4, 5, 7, 9, 11] },
  dorian: { l: 'Dorian', iv: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { l: 'Phrygian', iv: [0, 1, 3, 5, 7, 8, 10] },
  pentMinor: { l: 'Pent. minor', iv: [0, 3, 5, 7, 10] },
  pentMajor: { l: 'Pent. major', iv: [0, 2, 4, 7, 9] },
  chromatic: { l: 'Chromatic', iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
};
export const SNAPS = [[16, '1/16'], [8, '1/8'], [4, '1/4'], [0, 'Free']];
export const MODES = [['pitch', 'Pitch'], ['volume', 'Volume']];

export const PAT_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
/* pattern length in the song */
export const PAT_BARS = [1, 2, 3, 4, 6, 8, 12, 16];
/* loop length of a single clip */
export const CLIP_BARS = [1, 2, 3, 4, 8];
