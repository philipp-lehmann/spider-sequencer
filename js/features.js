/* Feature flags. One line per feature: flip it to switch the feature off everywhere.

   How a feature plugs in:
   - code checks `feature('name')`
   - markup that only belongs to the feature gets `data-feature="name"` and is removed when it is off
     (pruneFeatures runs on the page at boot, call it on anything rendered from a template too)

   Testing without editing this file: add ?on=a,b or ?off=a,b to the URL. */
export const FEATURES = {
  /* Circle = Loop / 4 bars toggle in the header */
  circleBars: true,
};

const params = new URLSearchParams(location.search);
const list = key => (params.get(key) || '').split(',').map(s => s.trim()).filter(Boolean);
const forced = { ...Object.fromEntries(list('on').map(k => [k, true])), ...Object.fromEntries(list('off').map(k => [k, false])) };

export const feature = name => forced[name] ?? FEATURES[name] ?? false;

/* remove markup of switched-off features */
export function pruneFeatures(root = document) {
  root.querySelectorAll('[data-feature]').forEach(el => { if (!feature(el.dataset.feature)) el.remove(); });
}
