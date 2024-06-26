// Convert an array of parameters (as used for display) to an object

import { IJobParameter } from '../model';
import { Scheduler } from '../handler';
import { TranslationBundle } from '@jupyterlab/translation';
import moment from 'moment';
import cronstrue from 'cronstrue';
import { PathExt } from '@jupyterlab/coreutils';

function isObject(input: string) {
  return (
    null !== input &&
    typeof input === 'object' &&
    // eslint-disable-next-line no-prototype-builtins
    Object.getPrototypeOf(input).isPrototypeOf(Object)
  );
}

export const stringify = (
  input: Record<string, unknown>,
  indent = 2
): string => {
  try {
    return JSON.stringify(input, null, indent);
  } catch (error: any) {
    return error.message;
  }
};

export const tryParse = (input: string): string | null => {
  try {
    if (!isObject(JSON.parse(input))) {
      return 'Invalid JSON object';
    }
  } catch (error: any) {
    return error.message;
  }

  return null;
};

// (for submission to the API)
export const serializeParameters = (
  parameters: IJobParameter[]
): Scheduler.Parameters => {
  const jobParameters: { [key: string]: any } = {};

  parameters.forEach(param => {
    const { name, value } = param;
    if (jobParameters[name] !== undefined) {
      console.error(
        'Parameter ' +
          name +
          ' already set to ' +
          jobParameters[name] +
          ' and is about to be set again to ' +
          value
      );
    } else {
      jobParameters[name] = value;
    }
  });

  return jobParameters;
};

export function tryParseJSON(input: string): {
  data?: Record<string, unknown>;
  error?: Error;
} {
  const result = {} as any;

  try {
    result.data = JSON.parse(input);
  } catch (error) {
    result.error = error;
    console.error(error);
  }

  return result;
}

export function getJobStatus(status: string, trans: TranslationBundle): string {
  switch (status) {
    case 'CREATED':
      return trans.__('Created');
    case 'QUEUED':
      return trans.__('Queued');
    case 'COMPLETED':
      return trans.__('Completed');
    case 'FAILED':
      return trans.__('Failed');
    case 'IN_PROGRESS':
      return trans.__('In progress');
    case 'STOPPED':
      return trans.__('Stopped');
    case 'STOPPING':
      return trans.__('Stopping');
    default:
      return trans.__('UNKNOWN');
  }
}

export class Deferred {
  constructor() {
    this._initialie();
  }

  private _initialie(): void {
    this._isFullfilled = false;
    this._promise = new Promise(resolve => {
      this.resolve = resolve;
    });

    this._promise.then(() => {
      this.resolve = undefined;
      this._isFullfilled = true;
    });
  }

  get promise(): Promise<unknown> {
    if (this._isFullfilled) {
      this._initialie();
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._promise!;
  }

  private _isFullfilled = false;
  public resolve?: (v: unknown) => void;
  private _promise?: Promise<unknown>;
}

export function parseDate(date?: string | null): moment.Moment | null {
  try {
    return date ? moment(date) : null;
  } catch (e) {
    console.error(e);
  }

  return null;
}

export const timestampLocalize = (time: number | ''): string => {
  if (time === '') {
    return '';
  }

  const display_date = new Date(time);

  return display_date ? display_date.toLocaleString() : '';
};

export function formatCronString(
  model: Omit<Scheduler.IJobDefinition, 'tasks'>
): string {
  let cronString = '';

  try {
    if (model.schedule !== undefined) {
      cronString = cronstrue.toString(model.schedule);
    }
  } catch (e) {
    // Do nothing; let the errors or nothing display instead
  }

  return cronString;
}

export function generateUniqueName(
  names: string[],
  defaultName = 'task'
): string {
  let index = 1;
  let newName = defaultName;

  for (;;) {
    const found = names.find(name => name === newName || name === newName);

    if (!found) {
      return newName;
    }

    newName = `${defaultName}${index++}`;
  }
}

export function generateFileName(
  fileName: string,
  existingNames: string[]
): string {
  let index = 0;
  let tempName = '';
  const baseName = PathExt.basename(fileName, PathExt.extname(fileName));

  do {
    tempName = `${baseName}${index++ || ''}${PathExt.extname(fileName)}`;
  } while (existingNames.includes(tempName));

  return tempName;
}

export const getTitleCase = (input: string): string =>
  input
    .toLowerCase()
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase()) // Initial char (after -/_)
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toLowerCase()); // First char after each -/_

export const humanize = (time: number): string => {
  const result = [];
  const seconds = Math.floor(time / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    result.push(`${days}d`);
  }

  if (hours > 0) {
    result.push(`${hours % 24}h`);
  }

  if (minutes > 0) {
    result.push(`${minutes % 60}m`);
  }

  if (seconds > 0) {
    result.push(`${seconds % 60}s`);
  }

  return result.join(' ');
};

export const formatTime = (time?: number): string => {
  try {
    return new Date(time ? +time : Date.now())
      .toLocaleString()
      .replace(/([/:\s]|,\s)/g, '-');
  } catch (e) {
    console.error(e);

    return 'invalid-date';
  }
};
