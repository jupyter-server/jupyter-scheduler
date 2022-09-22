export function size(level: number): { '--size': string } {
  return { '--size': `var(--jp-size-${level})` };
}

export type AvailableSizes = 0 | 1 | 2 | 3 | 4 | 5;
