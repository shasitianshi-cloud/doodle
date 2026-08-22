import crypto from 'node:crypto';

export function createEvidence({ capability, version, sceneHash, artifactHash, duration, status }) {
  return {
    capability,
    version,
    scene_hash: sceneHash,
    artifact_hash: artifactHash,
    duration,
    status,
    created_at: new Date().toISOString()
  };
}

export function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}
