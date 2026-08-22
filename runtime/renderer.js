// Doodle Render Capability - renderer backend boundary.
// Owns rendering only. No Project, Beat, or workflow logic.

export async function renderScene(scene, outputPath = 'output.mp4') {
  if (!scene || !Array.isArray(scene.elements)) {
    throw new Error('Invalid scene input');
  }

  const duration = Number(scene.duration || 0);

  // SVG/Rough.js/FFmpeg execution is attached here.
  // The boundary remains stable for remote execution.
  return {
    status: 'backend-pending',
    output: outputPath,
    duration,
    hash: null
  };
}
