/**
 * Tests for backend utility functions.
 */
import {
  filterBackendsByFile,
  selectDefaultBackend
} from '../util/backend-utils';
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
    },
    {
      id: 'universal',
      name: 'Universal',
      description: 'Runs any file',
      file_extensions: [], // Empty = supports all
      output_formats: [{ id: 'logs', label: 'Logs' }]
    }
  ];

  it('returns all backends when inputFile is undefined', () => {
    const result = filterBackendsByFile(mockBackends, undefined);
    expect(result).toHaveLength(3);
  });

  it('returns all backends when inputFile is empty string', () => {
    const result = filterBackendsByFile(mockBackends, '');
    expect(result).toHaveLength(3);
  });

  it('filters to backends supporting .ipynb extension', () => {
    const result = filterBackendsByFile(mockBackends, 'notebook.ipynb');
    expect(result.map(b => b.id)).toEqual(['jupyter_server_nb', 'universal']);
  });

  it('filters to backends supporting .py extension', () => {
    const result = filterBackendsByFile(mockBackends, 'script.py');
    expect(result.map(b => b.id)).toEqual(['jupyter_server_py', 'universal']);
  });

  it('includes backends with empty file_extensions (universal)', () => {
    const result = filterBackendsByFile(mockBackends, 'data.xyz');
    expect(result.map(b => b.id)).toEqual(['universal']);
  });

  it('handles file without extension (returns only universal)', () => {
    const result = filterBackendsByFile(mockBackends, 'Makefile');
    // 'Makefile'.split('.').pop() returns 'makefile' - no backend matches except universal
    expect(result.map(b => b.id)).toEqual(['universal']);
  });

  it('handles file path with directories', () => {
    const result = filterBackendsByFile(mockBackends, 'path/to/notebook.ipynb');
    expect(result.map(b => b.id)).toEqual(['jupyter_server_nb', 'universal']);
  });

  it('is case-insensitive for extensions', () => {
    const result = filterBackendsByFile(mockBackends, 'notebook.IPYNB');
    expect(result.map(b => b.id)).toEqual(['jupyter_server_nb', 'universal']);
  });
});

describe('selectDefaultBackend', () => {
  // Note: preferred_backends logic is server-side (tested in Python).
  // Frontend simply uses first backend from the sorted list the server provides.

  it('returns first backend from list', () => {
    const backends: Scheduler.IBackend[] = [
      {
        id: 'first',
        name: 'First Backend',
        description: '',
        file_extensions: [],
        output_formats: []
      },
      {
        id: 'second',
        name: 'Second Backend',
        description: '',
        file_extensions: [],
        output_formats: []
      }
    ];
    expect(selectDefaultBackend(backends)?.id).toBe('first');
  });

  it('returns undefined for empty array', () => {
    expect(selectDefaultBackend([])).toBeUndefined();
  });
});
