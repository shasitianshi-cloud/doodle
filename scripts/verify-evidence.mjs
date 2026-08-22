import fs from 'node:fs';
import crypto from 'node:crypto';

const [scenePath, outputPath, evidencePath, resultPath = 'out/result.json'] = process.argv.slice(2);
if (!scenePath || !outputPath || !evidencePath) {
  throw new Error('USAGE: node scripts/verify-evidence.mjs <scene.json> <output.mp4> <evidence.json> [result.json]');
}
const sceneBytes = fs.readFileSync(scenePath);
const outputBytes = fs.readFileSync(outputPath);
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const inputSha = sha256(sceneBytes);
const outputSha = sha256(outputBytes);
if (evidence.validation_result !== 'PASS') throw new Error('EVIDENCE_VALIDATION_NOT_PASS');
if (evidence.input_sha256 !== inputSha) throw new Error(`INPUT_HASH_MISMATCH expected=${inputSha} evidence=${evidence.input_sha256}`);
if (evidence.output_sha256 !== outputSha) throw new Error(`OUTPUT_HASH_MISMATCH expected=${outputSha} evidence=${evidence.output_sha256}`);
if (evidence.capability_version !== 'experimental-v1') throw new Error(`CAPABILITY_VERSION_MISMATCH ${evidence.capability_version}`);
if (!(Number(evidence.output_duration) > 0)) throw new Error('OUTPUT_DURATION_INVALID');
const result = {
  status: 'PASS',
  capability_version: evidence.capability_version,
  input_sha256: inputSha,
  output_sha256: outputSha,
  output_duration: Number(evidence.output_duration),
  evidence_run_id: evidence.run_id
};
fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
