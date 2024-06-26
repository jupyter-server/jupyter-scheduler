// Utilities to validate and sanitize job names (make them valid)

import { TranslationBundle } from '@jupyterlab/translation';

const workflowName = /^[a-zA-Z0-9._][a-zA-Z0-9._-\s]{0,23}$/;
const taskNameRegex = /^[a-zA-Z0-9._][a-zA-Z0-9._-]{0,23}$/;
const invalidFirstCharRegex = /^[^a-zA-Z0-9._]/;
const invalidCharRegex = /[^a-zA-Z0-9._-\s]/g;
const maxLength = 24;

// Modify an input string to be a valid name
export function MakeNameValid(name: string): string {
  if (taskNameRegex.test(name)) {
    return name;
  }

  // Clean up first position
  if (invalidFirstCharRegex.test(name)) {
    name = name.slice(1);
  }

  // Truncate length
  name = name.substring(0, maxLength);

  // Purge invalid characters
  name = name.replace(invalidCharRegex, '');

  name = name.replace(/\s/g, '_');

  // If nothing's left, put something in so that validation passes
  if (name === '') {
    // Deliberately not translated so as not to violate character limits
    name = 'job';
  }

  return name;
}

export function commonNameError(
  name: string,
  trans: TranslationBundle
): string | void {
  // Check for blank
  if (name === '') {
    return trans.__('You must specify a name');
  }

  // Check for errors in first position
  if (invalidFirstCharRegex.test(name)) {
    return trans.__(
      'Name must start with a letter, number, period, or underscore'
    );
  }

  // Check for length.
  if (name.length > maxLength) {
    return trans.__('Name may not be longer than %1 characters', maxLength);
  }
}

export function taskNameError(name: string, trans: TranslationBundle): string {
  if (taskNameRegex.test(name)) {
    return ''; // No errors
  }

  return (
    commonNameError(name, trans) || // By process of elimination, incorrect characters must be present
    trans.__(
      'Name must contain only letters, numbers, periods, hyphens, and underscores'
    )
  );
}

export function WorkflowNameError(
  name: string,
  trans: TranslationBundle
): string {
  if (workflowName.test(name)) {
    return ''; // No errors
  }

  // By process of elimination, incorrect characters must be present
  return (
    commonNameError(name, trans) ||
    trans.__(
      'Name must contain only letters, space, numbers, periods, hyphens, and underscores'
    )
  );
}

export function OutputFormatsError(
  name: string,
  value: string | string[] | undefined,
  trans: TranslationBundle
): string {
  if (name !== 'outputFormats') {
    return '';
  }

  if (!value?.length) {
    return trans.__('Output formats is required');
  }

  return '';
}
