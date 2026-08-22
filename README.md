# Doodle Render Capability — remote execution mirror

This repository mirrors the accepted `doodle-render/experimental-v1` implementation and adds a GitHub Actions execution envelope.

## Canonical runtime contract

The renderer itself is kept compatible with the frozen capability:

```bash
node runtime.js validate <scene.json>
node runtime.js render <scene.json> --output <file.mp4>
node runtime.js list-assets
```

Input remains `canvas + background + seed + objects[]`. The remote wrapper does not translate the scene schema or change visual semantics.

## Remote execution

`.github/workflows/remote-render.yml` accepts a base64-encoded frozen scene through `workflow_dispatch`, verifies the caller-provided request SHA256, materializes the exact pinned CJK font and any manifest-selected SVG assets, invokes the canonical runtime, verifies Evidence, then uploads:

- `request.json`
- `output.mp4`
- `evidence.json`
- `result.json`

The CJK font is materialized from the pinned Noto CJK `Sans2.004` release and must match SHA256 `b76b0433203017ca80401b2ee0dd69350349871c4b19d504c34dbdd80541690a` before rendering.

SVG assets are fetched only as an environment-preparation step from the pinned Tabler source commit recorded in `assets/manifest.json`, normalized using the frozen normalization rule, and hash-verified before `runtime.js` is invoked. Runtime asset resolution itself remains local-only.

## Boundary

This repository owns rendering only. It does not own Project planning, beat planning, story logic, orchestration, state, provider routing, or media assembly.
