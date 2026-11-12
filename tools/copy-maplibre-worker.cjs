// Copies MapLibre's map-drawing worker next to the site so the map can load
// it from our own domain (the bundler doesn't copy it). Runs before
// `npm run build` / `npm run dev`. Output is git-ignored. Lives in tools/,
// not scripts/, because .vercelignore leaves scripts/ out of deploys.
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'node_modules', 'maplibre-gl', 'dist', 'maplibre-gl-worker.mjs');
const outDir = path.join(__dirname, '..', 'public', 'vendor');
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(src, path.join(outDir, 'maplibre-gl-worker.mjs'));
console.log('maplibre worker copied to public/vendor/');
