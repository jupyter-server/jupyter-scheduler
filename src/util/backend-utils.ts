import { Scheduler } from '../handler';

/**
 * Filter backends by file extension.
 * Returns backends that support the given file type, or all backends if no file/extension provided.
 * Backends with empty file_extensions array are considered "universal" and match all files.
 */
export function filterBackendsByFile(
  backends: Scheduler.IBackend[],
  inputFile: string | undefined
): Scheduler.IBackend[] {
  if (!inputFile) return backends;
  const ext = inputFile.split('.').pop()?.toLowerCase();
  if (!ext) return backends;
  return backends.filter(
    b => b.file_extensions.length === 0 || b.file_extensions.includes(ext)
  );
}

/**
 * Select the default backend from a list.
 * Returns the backend marked as default, or falls back to the first one.
 */
export function selectDefaultBackend(
  backends: Scheduler.IBackend[]
): Scheduler.IBackend | undefined {
  return backends.find(b => b.is_default) || backends[0];
}
