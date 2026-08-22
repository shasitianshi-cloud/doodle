# Doodle Render Capability

Minimal render capability for hand-drawn explanatory animation.

## Boundary

This repository provides only:

`scene.json -> validate -> render -> mp4 + evidence`

It does not contain:

- workflow planning
- beat planning
- prompt generation
- project state
- orchestration

## Capability

```
CAPABILITY=doodle-render
VERSION=experimental-v1
```

## Runtime Contract

Input:

- scene.json

Output:

- mp4 artifact
- evidence.json

## Design

- deterministic rendering
- schema validation
- evidence binding
- reusable by external projects
