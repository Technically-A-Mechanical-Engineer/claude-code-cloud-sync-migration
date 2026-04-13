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
