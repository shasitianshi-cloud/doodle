// Doodle Render Capability - video output boundary
// Owns frame-to-video conversion only.
// Does not create scenes or manage project execution.

import { execFile } from 'node:child_process';

export function createVideoArtifact(frames) {
  return {
    status: 'prepared',
    frames,
  };
}

export function encodeVideo(inputFrames, outputPath) {
  return new Promise((resolve, reject) => {
    execFile(
      'ffmpeg',
      ['-y', '-framerate', '30', '-i', inputFrames, '-pix_fmt', 'yuv420p', outputPath],
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          status: 'success',
          output: outputPath,
        });
      }
    );
  });
}
