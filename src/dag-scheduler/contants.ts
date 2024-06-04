import { getTitleCase } from './util';

export const EMPTY_VALUE = '\u2014';

/**
 * The mime type for a rich contents drag object.
 */
export const CONTENTS_MIME_RICH = 'application/x-jupyter-icontentsrich';

export enum NotificationEvents {
  Failure = 'failure',
  Retry = 'retry',
  Deploy = 'deploy'
}

export enum OutputFormats {
  HTML = 'html',
  Notebook = 'ipynb'
}

export enum TriggerRules {
  ALL_SUCCESS = 'all_success',
  ALL_FAILED = 'all_failed',
  ALL_DONE = 'all_done',
  ONE_FAILED = 'one_failed',
  ONE_SUCCESS = 'one_success',
  NONE_FAILED = 'none_failed',
  NONE_FAILED_OR_SKIPPED = 'none_failed_or_skipped',
  NONE_SKIPPED = 'none_skipped'
}

export enum DeploymentStatus {
  CREATING = 'CREATING',
  CREATED = 'CREATED',
  FAILED_TO_CREATE = 'FAILED_TO_CREATE',
  DEPLOYING = 'DEPLOYING',
  DEPLOYED = 'DEPLOYED',
  UPDATED = 'UPDATED',
  FAILED_TO_DEPLOY = 'FAILED_TO_DEPLOY',
  FAILED_TO_UPDATE = 'FAILED_TO_UPDATE',
  DELETED = 'DELETED',
  UNKNOWN = 'UNKNOWN'
}

export enum JobStatus {
  QUEUED = 'QUEUED',
  FAILED = 'FAILED',
  RUNNING = 'RUNNING',
  UNKNOWN = 'UNKNOWN',
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS'
}

export enum WorkflowsViewType {
  Runs = 'Runs',
  Tasks = 'Tasks'
}

export const notificationTypes = Object.entries(
  NotificationEvents
).map(([label, value]) => ({ value, label }));

export const outputFormatTypes = Object.entries(
  OutputFormats
).map(([label, value]) => ({ value, label }));

export const triggerRuleTypes = Object.entries(TriggerRules).map(
  ([label, value]) => ({
    value,
    label: getTitleCase(label)
  })
);
