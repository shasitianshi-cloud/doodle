#!/usr/bin/env node

// Doodle Render Capability entry point.
// Stage: renderer pipeline boundary.
// Project logic must not enter this layer.

import fs from 'node:fs';
import crypto from 'node:crypto';
import { validateScene } from './validate.js';
import { createEvidence } from './evidence.js';
import { renderScene } from './renderer.js';

const input = process.argv[2];
const output = process.argv[3] || 'output.mp4';

if (!input) {
  console.error('scene.json required');
  process.exit(1);
}

const scene = JSON.parse(fs.readFileSync(input, 'utf8'));
const result = validateScene(scene);

if (!result.valid) {
  console.error(JSON.stringify(result));
  process.exit(1);
}

const sceneHash = crypto
  .createHash('sha256')
  .update(JSON.stringify(scene))
  .digest('hex');

const artifact = await renderScene(scene, output);

console.log(JSON.stringify({
  status: 'completed',
  capability: 'doodle-render',
  artifact,
  evidence: createEvidence({
    scene_hash: sceneHash,
    artifact_hash: artifact.hash,
    duration: artifact.duration
  })
}, null, 2));
