#!/usr/bin/env node

// Doodle Render Capability entry point.
// Current stage: runtime contract implementation.
// Rendering backend will be attached after smoke validation.

import fs from 'node:fs';
import crypto from 'node:crypto';
import { validateScene } from './validate.js';
import { createEvidence } from './evidence.js';

const input = process.argv[2];

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

console.log(JSON.stringify({
  status: 'accepted',
  capability: 'doodle-render',
  stage: 'runtime-skeleton',
  scene_hash: sceneHash,
  evidence: createEvidence({ scene_hash: sceneHash })
}, null, 2));
