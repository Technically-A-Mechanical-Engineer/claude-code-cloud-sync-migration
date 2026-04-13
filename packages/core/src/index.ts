// @localground/core — barrel export
export * from './types.js';
export { spawnTool, isRobocopySuccess } from './util/spawn.js';
export {
  normalizePath,
  getClaudeConfigDir,
  getClaudeProjectsDir,
  ensureTrailingSlash,
  quotePath,
} from './util/paths.js';
export {
  detectPlatform,
  detectCloudService,
  isPathCloudSynced,
  detect,
  decode,
  encode,
  classify,
} from './environment/index.js';
export {
  checksum,
  checksumString,
  compare,
  placeholderDetect,
  gitCheck,
} from './integrity/index.js';
export {
  copy,
  seed,
  verify,
  scan,
  chunk,
} from './operations/index.js';
