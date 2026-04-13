// packages/core/src/operations/chunk.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import type { Result, ChunkPlan } from '../types.js';

type ChunkFailureReason = 'dir_not_found' | 'scan_error';

/**
 * Maximum estimated size per chunk (in bytes).
 * Targeted to complete within MCP timeout constraints (~60 seconds per tool call).
 * Conservative estimate: ~500MB per chunk should complete within 55 seconds
 * on reasonable hardware with SSD storage.
 */
const DEFAULT_CHUNK_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * Break a large copy operation into chunks that fit within MCP timeout constraints.
 *
 * CORE-12: Chunk large copy operations to complete within MCP timeout constraints
 * (~60 seconds per tool call).
 *
 * Strategy: enumerate top-level subdirectories in the source, estimate each
 * directory's size, and group them into chunks that stay under the size threshold.
 * Each chunk becomes one copy() call.
 *
 * This is a planning function — it does NOT perform any copy operations.
 * Returns a ChunkPlan that the MCP layer or skill can execute chunk by chunk.
 */
export async function chunk(
  source: string,
  target: string,
  maxChunkSize?: number,
): Promise<Result<ChunkPlan, ChunkFailureReason>> {
  const threshold = maxChunkSize ?? DEFAULT_CHUNK_SIZE;

  try {
    const stat = await fs.stat(source);
    if (!stat.isDirectory()) {
      return { success: false, reason: 'dir_not_found', detail: `Not a directory: ${source}` };
    }
  } catch {
    return { success: false, reason: 'dir_not_found', detail: `Source directory not found: ${source}` };
  }

  try {
    // Enumerate top-level entries with sizes
    const entries = await fs.readdir(source, { withFileTypes: true });
    const entryInfos: Array<{ name: string; size: number; isDir: boolean }> = [];

    for (const entry of entries) {
      const fullPath = path.join(source, entry.name);
      if (entry.isDirectory()) {
        const size = await estimateDirectorySize(fullPath);
        entryInfos.push({ name: entry.name, size, isDir: true });
      } else if (entry.isFile()) {
        try {
          const fileStat = await fs.stat(fullPath);
          entryInfos.push({ name: entry.name, size: fileStat.size, isDir: false });
        } catch {
          entryInfos.push({ name: entry.name, size: 0, isDir: false });
        }
      }
    }

    // Group entries into chunks, tracking which subdirectory/file names belong to each chunk.
    // Each chunk records its entries so the MCP layer can execute chunks independently
    // (e.g., copying only the listed subdirectories per chunk call).
    const chunks: ChunkPlan['chunks'] = [];
    let currentChunkSize = 0;
    let chunkIndex = 0;
    let currentChunkEntries: string[] = [];

    for (const entry of entryInfos) {
      if (currentChunkSize + entry.size > threshold && currentChunkEntries.length > 0) {
        // Flush current chunk
        chunks.push({
          index: chunkIndex,
          source,
          target,
          estimatedSize: currentChunkSize,
          entries: currentChunkEntries,
        });
        chunkIndex++;
        currentChunkEntries = [];
        currentChunkSize = 0;
      }
      currentChunkEntries.push(entry.name);
      currentChunkSize += entry.size;
    }

    // Flush remaining entries
    if (currentChunkEntries.length > 0) {
      chunks.push({
        index: chunkIndex,
        source,
        target,
        estimatedSize: currentChunkSize,
        entries: currentChunkEntries,
      });
    }

    const totalSize = entryInfos.reduce((sum, e) => sum + e.size, 0);

    return {
      success: true,
      data: {
        chunks,
        totalChunks: chunks.length,
        totalSize,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      reason: 'scan_error',
      detail: `Failed to plan chunks: ${(err as Error).message}`,
    };
  }
}

/**
 * Estimate directory size by sampling top-level entries.
 * Uses a conservative estimate for subdirectories to avoid deep recursive scanning.
 */
async function estimateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        try {
          const stat = await fs.stat(path.join(dirPath, entry.name));
          totalSize += stat.size;
        } catch {
          // Skip unreadable files
        }
      } else if (entry.isDirectory()) {
        // Rough estimate per subdirectory
        totalSize += 10 * 1024 * 1024; // 10MB estimate
      }
    }
  } catch {
    totalSize = 50 * 1024 * 1024; // 50MB conservative estimate
  }
  return totalSize;
}
