import { renderScene } from './renderer.js';

const scene = {
  scene_id: 'smoke-causal-chain',
  elements: [
    { type: 'svg', asset: 'people/person.svg' }
  ]
};

const result = await renderScene(scene);

console.log(JSON.stringify({
  DOODLE_RUNTIME_SMOKE_PASS: true,
  result
}, null, 2));
