// packages/core/src/environment/index.ts — Module barrel export

export { detectPlatform } from './platform.js';
export { detectCloudService, isPathCloudSynced } from './cloud.js';
export { detect } from './detect.js';
export { decode, encode } from './decode.js';
export { classify } from './classify.js';
