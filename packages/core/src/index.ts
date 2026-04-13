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
