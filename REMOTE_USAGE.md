# Remote Doodle Runtime Usage

## Trigger contract

Use GitHub Actions `workflow_dispatch` on `.github/workflows/remote-render.yml` with these inputs:

- `request_id`: caller-generated unique ID, `[A-Za-z0-9._-]`, max 80 chars.
- `scene_b64`: base64 of the exact frozen scene JSON bytes.
- `request_sha256`: SHA256 of those exact JSON bytes.
- `artifact_name`: optional logical artifact label.
- `caller_run_id`: optional upstream Run ID for correlation only.

The workflow name is `doodle-remote-render` and the run display name is `doodle-<request_id>`.

## Result

A successful run uploads artifact `doodle-<request_id>` containing:

- `request.json`
- `output.mp4`
- `evidence.json`
- `result.json`

`result.json.status` must equal `PASS`. Its `input_sha256` must equal the caller request hash. Its `output_sha256` must equal the downloaded MP4 SHA256.

## Authentication boundary

A VPS caller does not need repository source write access. Use a repository-scoped fine-grained GitHub token with the minimum permission needed to dispatch/read Actions runs and artifacts. Do not place this credential in Project files or scene JSON.
