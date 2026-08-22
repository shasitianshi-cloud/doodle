// Doodle Render Capability
// Input validation boundary.

export function validateScene(scene) {
  if (!scene || typeof scene !== 'object') {
    return { valid: false, error: 'scene_required' };
  }

  if (!Array.isArray(scene.elements)) {
    return { valid: false, error: 'elements_required' };
  }

  return { valid: true };
}
