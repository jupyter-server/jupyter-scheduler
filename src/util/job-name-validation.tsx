// Utilities to validate and sanitize job names (make them valid)

import { TranslationBundle } from '@jupyterlab/translation';

const jobNameRegex = /^[a-zA-Z0-9._][a-zA-Z0-9._ -]{0,62}$/;
const invalidFirstCharRegex = /^[^a-zA-Z0-9._]/;
const invalidCharRegex = /[^a-zA-Z0-9._ -]/g;
const maxLength = 63;

export function NameIsValid(name: string): boolean {
  return jobNameRegex.test(name);
}

// Modify an input string to be a valid name
export function MakeNameValid(name: string): string {
  if (jobNameRegex.test(name)) {
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

  // If nothing's left, put something in so that validation passes
  if (name === '') {
    // Deliberately not translated so as not to violate character limits
    name = 'job';
  }

  return name;
}

export function NameError(name: string, trans: TranslationBundle): string {
  if (NameIsValid(name)) {
    return ''; // No errors
  }

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

  // By process of elimination, incorrect characters must be present
  return trans.__(
    'Name must contain only letters, numbers, spaces, periods, hyphens, and underscores'
  );
}
