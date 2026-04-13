// packages/core/src/types.ts

/**
 * Success result with typed data payload.
 * All core functions return this on success.
 */
export interface Success<T> {
  success: true;
  data: T;
}

/**
 * Failure result with machine-readable reason code and human-readable detail.
 * All core functions return this on failure. Never throws.
 * Pattern per D-05: { success: false, reason: 'target_exists', detail: '...' }
 */
export interface Failure<R extends string = string> {
  success: false;
  reason: R;
  detail: string;
}

/**
 * Discriminated union returned by every core function.
 * Callers check `result.success` — TypeScript narrows the type automatically.
 */
export type Result<T, R extends string = string> = Success<T> | Failure<R>;

// --- Platform Types ---

export type Platform = 'windows' | 'macos' | 'linux';

export type Shell = 'powershell' | 'cmd' | 'bash-on-windows' | 'bash' | 'zsh';

export interface PlatformInfo {
  platform: Platform;
  shell: Shell;
  homeDir: string;
  pathSeparator: '\\' | '/';
}

// --- Cloud Service Types ---

export type CloudService = 'onedrive' | 'dropbox' | 'google-drive' | 'icloud' | 'none';

export interface CloudServiceInfo {
  service: CloudService;
  syncRoot: string | null;
  /** True if the detected path is within a cloud-synced folder */
  isCloudSynced: boolean;
}

// --- Environment Types ---

export interface ProjectEntry {
  name: string;
  path: string;
  isCloudSynced: boolean;
  cloudService: CloudService;
}

export interface PathHashEntry {
  hashDirName: string;
  decodedPath: string | null;
  exists: boolean;
}

export type PathHashClassification = 'valid' | 'stale' | 'orphan' | 'undecodable';

export interface ClassifiedPathHash extends PathHashEntry {
  classification: PathHashClassification;
}

export interface EnvironmentInfo {
  platform: PlatformInfo;
  cloud: CloudServiceInfo;
  projects: ProjectEntry[];
  pathHashes: PathHashEntry[];
  claudeConfigDir: string;
}

// --- Integrity Types ---

export interface ChecksumResult {
  filePath: string;
  algorithm: 'sha256';
  hash: string;
}

export interface CompareResult {
  source: {
    path: string;
    fileCount: number;
    totalSize: number;
    hiddenDirs: string[];
  };
  target: {
    path: string;
    fileCount: number;
    totalSize: number;
    hiddenDirs: string[];
  };
  fileCountMatch: boolean;
  sizeMatch: boolean;
  hiddenDirMatch: boolean;
}

export interface GitCheckResult {
  fsck: { passed: boolean; output: string };
  status: { clean: boolean; output: string };
  branch: string;
  commitHash: string;
  hasSubmodules: boolean;
  dubiousOwnership: boolean;
}

export interface PlaceholderCheckResult {
  hasPlaceholders: boolean;
  placeholderCount: number;
  totalFiles: number;
  percentage: number;
  details: string[];
}

// --- Operations Types ---

export interface CopyData {
  source: string;
  target: string;
  tool: 'robocopy' | 'rsync';
  exitCode: number;
  filesCopied: number;
  summary: string;
}

export interface SeedMarker {
  type: 'test-file' | 'git-tag';
  path?: string;
  tag?: string;
  checksum?: string;
  commitHash?: string;
}

export interface SeedManifest {
  version: 1;
  toolkitVersion: string;
  created: string;
  projectPath: string;
  projectName: string;
  markers: SeedMarker[];
}

export interface VerifyMarkerResult {
  marker: SeedMarker;
  passed: boolean;
  detail: string;
}

export interface VerifyResult {
  manifestPath: string;
  allPassed: boolean;
  results: VerifyMarkerResult[];
}

export interface ScanMatch {
  file: string;
  line: number;
  content: string;
  cloudPath: string;
}

export interface ScanResult {
  matches: ScanMatch[];
  filesScanned: number;
  matchCount: number;
}

export interface ChunkPlan {
  chunks: Array<{
    index: number;
    source: string;
    target: string;
    estimatedSize: number;
    /** Top-level subdirectory/file names assigned to this chunk */
    entries: string[];
  }>;
  totalChunks: number;
  totalSize: number;
}

// --- Spawn Utility Types ---

export interface SpawnOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export type SpawnFailureReason =
  | 'not_found'
  | 'permission_denied'
  | 'timeout'
  | 'unexpected_error';
