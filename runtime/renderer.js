// Doodle Render Capability - renderer backend boundary.
// Owns rendering only. No Project, Beat, or workflow logic.

import { loadSvgAsset } from './svg-loader.js';

export async function renderScene(scene, outputPath = 'output.mp4') {
  if (!scene || !Array.isArray(scene.elements)) {
    throw new Error('Invalid scene input');
  }

  const loadedAssets = [];

  for (const element of scene.elements) {
    if (element.asset) {
      loadedAssets.push(await loadSvgAsset(element.asset));
    }
  }

  return {
    status: 'render-backend-ready',
    output: outputPath,
    duration: Number(scene.duration || 0),
    assets_loaded: loadedAssets.length,
    hash: null
  };
}
