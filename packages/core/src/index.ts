// @localground/core — Public API (D-07: flat barrel export)
// All functions exported directly from @localground/core.
// Internal module structure (environment/, integrity/, operations/) is for navigability only.

// Environment (CORE-01, CORE-02, CORE-03)
export { detect } from './environment/detect.js';
export { decode, encode } from './environment/decode.js';
export { classify } from './environment/classify.js';
export { detectPlatform } from './environment/platform.js';
export { detectCloudService, isPathCloudSynced } from './environment/cloud.js';

// Integrity (CORE-04, CORE-05, CORE-06, CORE-07)
export { checksum, checksumString } from './integrity/checksum.js';
export { compare } from './integrity/compare.js';
export { placeholderDetect } from './integrity/placeholder.js';
export { gitCheck } from './integrity/git.js';

// Operations (CORE-08, CORE-09, CORE-10, CORE-11, CORE-12)
export { copy } from './operations/copy.js';
export { seed } from './operations/seed.js';
export { verify } from './operations/verify.js';
export { scan } from './operations/scan.js';
export { chunk } from './operations/chunk.js';

// Utilities
export { spawnTool, isRobocopySuccess } from './util/spawn.js';
export {
  normalizePath,
  getClaudeConfigDir,
  getClaudeProjectsDir,
  ensureTrailingSlash,
  quotePath,
} from './util/paths.js';

// Types — re-export all public types
export type {
  Result,
  Success,
  Failure,
  Platform,
  Shell,
  PlatformInfo,
  CloudService,
  CloudServiceInfo,
  ProjectEntry,
  PathHashEntry,
  PathHashClassification,
  ClassifiedPathHash,
  EnvironmentInfo,
  ChecksumResult,
  CompareResult,
  GitCheckResult,
  PlaceholderCheckResult,
  CopyData,
  SeedMarker,
  SeedManifest,
  VerifyMarkerResult,
  VerifyResult,
  ScanMatch,
  ScanResult,
  ChunkPlan,
  SpawnOutput,
  SpawnFailureReason,
} from './types.js';
