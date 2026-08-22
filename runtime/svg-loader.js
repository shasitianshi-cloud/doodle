// SVG loader boundary for doodle-render capability.
// Responsible only for loading SVG assets.
// Scene planning and asset selection remain outside this capability.

import fs from 'node:fs/promises';

export async function loadSvgAsset(assetPath) {
  const content = await fs.readFile(assetPath, 'utf8');
  return {
    path: assetPath,
    content
  };
}
