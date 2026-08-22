// Doodle Render Capability - video output boundary
// FFmpeg integration will be added after render smoke validation.

export function createVideoArtifact(frames) {
  return {
    status: 'pending',
    frames
  };
}
