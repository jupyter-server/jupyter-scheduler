/**
 * Tests for backend utility functions.
 */
import { filterBackendsByFile } from '../util/backend-utils';
import { Scheduler } from '../handler';

describe('filterBackendsByFile', () => {
  const mockBackends: Scheduler.IBackend[] = [
    {
      id: 'jupyter_server_nb',
      name: 'Notebook',
      description: 'Run notebooks',
      file_extensions: ['ipynb'],
      output_formats: [{ id: 'ipynb', label: 'Notebook' }]
    },
    {
      id: 'jupyter_server_py',
      name: 'Python',
      description: 'Run Python scripts',
      file_extensions: ['py'],
      output_formats: [{ id: 'stdout', label: 'Output' }]
    }
  ];

  it('returns all backends when inputFile is undefined', () => {
    const result = filterBackendsByFile(mockBackends, undefined);
    expect(result).toHaveLength(2);
  });

  it('returns all backends when inputFile is empty string', () => {
    const result = filterBackendsByFile(mockBackends, '');
    expect(result).toHaveLength(2);
  });

  it('filters to backends supporting .ipynb extension', () => {
    const result = filterBackendsByFile(mockBackends, 'notebook.ipynb');
    expect(result.map(b => b.id)).toEqual(['jupyter_server_nb']);
  });

  it('filters to backends supporting .py extension', () => {
    const result = filterBackendsByFile(mockBackends, 'script.py');
    expect(result.map(b => b.id)).toEqual(['jupyter_server_py']);
  });

  it('returns empty array for unknown extension', () => {
    const result = filterBackendsByFile(mockBackends, 'data.xyz');
    expect(result).toEqual([]);
  });

  it('returns empty array for file without extension', () => {
    const result = filterBackendsByFile(mockBackends, 'Makefile');
    // 'Makefile'.split('.').pop() returns 'makefile' - no backend matches
    expect(result).toEqual([]);
  });

  it('handles file path with directories', () => {
    const result = filterBackendsByFile(mockBackends, 'path/to/notebook.ipynb');
    expect(result.map(b => b.id)).toEqual(['jupyter_server_nb']);
  });

  it('is case-insensitive for extensions', () => {
    const result = filterBackendsByFile(mockBackends, 'notebook.IPYNB');
    expect(result.map(b => b.id)).toEqual(['jupyter_server_nb']);
  });
});
