# Doodle Render Capability Contract V1

## Identity

name: doodle-render
version: experimental-v1

## Input

scene.json

Required:

- scene_id
- width
- height
- fps
- duration
- elements

## Output

- video/mp4
- evidence.json

## Guarantees

- schema validation
- deterministic seed support
- artifact hash evidence
- duration verification

## Forbidden

Capability must not contain:

- project logic
- beat planning
- visual planning
- prompt generation
- workflow engine
- state management
