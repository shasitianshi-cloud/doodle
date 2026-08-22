import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const EXPECTED_SHA256 = 'b76b0433203017ca80401b2ee0dd69350349871c4b19d504c34dbdd80541690a';
const FONT_URL = 'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/OTC/NotoSansCJK-Regular.ttc';
const dest = path.resolve('fonts/NotoSansCJK-Regular.ttc');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

if (fs.existsSync(dest)) {
  const buf = fs.readFileSync(dest);
  if (sha256(buf) === EXPECTED_SHA256) {
    console.log(JSON.stringify({ status: 'present', path: dest, sha256: EXPECTED_SHA256 }));
    process.exit(0);
  }
  fs.unlinkSync(dest);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
const res = await fetch(FONT_URL, { redirect: 'follow' });
if (!res.ok) throw new Error(`FONT_DOWNLOAD_FAILED ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
const got = sha256(buf);
if (got !== EXPECTED_SHA256) throw new Error(`FONT_HASH_MISMATCH expected=${EXPECTED_SHA256} got=${got}`);
fs.writeFileSync(dest, buf);
console.log(JSON.stringify({ status: 'materialized', path: dest, sha256: got, bytes: buf.length }));
