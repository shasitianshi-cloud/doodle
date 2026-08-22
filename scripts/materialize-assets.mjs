import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const manifest = JSON.parse(fs.readFileSync('assets/manifest.json', 'utf8'));
const byId = new Map(manifest.assets.map((asset) => [asset.asset_id, asset]));
const scenePath = process.argv[2];
const all = process.argv.includes('--all');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function normalizeTablerSvg(raw) {
  return raw
    .replace(/^<!--[\s\S]*?-->\n?/, '')
    .replace(/ width="24"/g, '')
    .replace(/ height="24"/g, '')
    .replace(/ class="[^"]*"/g, '');
}

let ids;
if (all) {
  ids = manifest.assets.map((asset) => asset.asset_id);
} else {
  if (!scenePath) throw new Error('USAGE: node scripts/materialize-assets.mjs <scene.json> | --all');
  const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
  ids = [...new Set((scene.objects || []).filter((o) => o.asset_id).map((o) => o.asset_id))];
}

const results = [];
for (const id of ids) {
  const asset = byId.get(id);
  if (!asset) throw new Error(`ASSET_NOT_IN_MANIFEST ${id}`);
  const dest = path.resolve(asset.filename);
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (fs.existsSync(dest)) {
    const got = sha256(fs.readFileSync(dest));
    if (got === asset.normalized_sha256) {
      results.push({ asset_id: id, status: 'present', sha256: got });
      continue;
    }
    fs.unlinkSync(dest);
  }

  const url = `https://raw.githubusercontent.com/tabler/tabler-icons/${asset.source_commit}/${asset.source_file}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`ASSET_DOWNLOAD_FAILED ${id} ${res.status}`);
  const normalized = normalizeTablerSvg(await res.text());
  const buf = Buffer.from(normalized, 'utf8');
  const got = sha256(buf);
  if (got !== asset.normalized_sha256) {
    throw new Error(`ASSET_HASH_MISMATCH ${id} expected=${asset.normalized_sha256} got=${got}`);
  }
  fs.writeFileSync(dest, buf);
  results.push({ asset_id: id, status: 'materialized', sha256: got });
}

console.log(JSON.stringify({ status: 'PASS', count: results.length, assets: results }, null, 2));
