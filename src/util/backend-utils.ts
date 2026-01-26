import { Scheduler } from '../handler';

/**
 * Filter backends by file extension.
 * Returns backends that support the given file type, or all backends if no file/extension provided.
 */
export function filterBackendsByFile(
  backends: Scheduler.IBackend[],
  inputFile: string | undefined
): Scheduler.IBackend[] {
  if (!inputFile) {
    return backends;
  }
  const ext = inputFile.split('.').pop()?.toLowerCase();
  if (!ext) {
    return backends;
  }
  return backends.filter(b => b.file_extensions.includes(ext));
}
