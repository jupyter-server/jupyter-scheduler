import React, { ChangeEvent } from 'react';

import { FormLabel, Stack, TextField } from '@mui/material';

import { Cluster } from './components/cluster';
import { AddButton, DeleteButton } from './components/icon-buttons';
import { useTranslator } from './hooks';
import { Scheduler } from './tokens';

const AdvancedOptions = (
  props: Scheduler.IAdvancedOptionsProps
): JSX.Element => {
  const formPrefix = 'jp-create-job-advanced-';

  const trans = useTranslator('jupyterlab');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    props.handleModelChange({
      ...props.model,
      [e.target.name]: e.target.value
    });

  const handleTagChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (props.jobsView !== 'CreateJob') {
      return; // Read-only mode
    }

    const { name, value } = event.target;
    const tagIdxMatch = name.match(/^tag-(\d+)$/);

    if (tagIdxMatch === null) {
      return null;
    }

    const newTags = props.model.tags ?? [];
    newTags[parseInt(tagIdxMatch[1])] = value;

    props.handleModelChange({ ...props.model, tags: newTags });
  };

  const addTag = () => {
    const newTags = [...(props.model.tags ?? []), ''];
    props.handleModelChange({ ...props.model, tags: newTags });
  };

  const deleteTag = (idx: number) => {
    const newTags = props.model.tags ?? [];
    newTags.splice(idx, 1);
    props.handleModelChange({ ...props.model, tags: newTags });
  };

  const tags = props.model.tags ?? [];

  const createTags = () => {
    return (
      <Stack spacing={2}>
        {tags.map((tag, idx) => (
          <Cluster key={idx} justifyContent="flex-start">
            <TextField
              label={trans.__('Tag %1', idx + 1)}
              id={`${formPrefix}tag-${idx}`}
              name={`tag-${idx}`}
              value={tag}
              onChange={handleTagChange}
            />
            <DeleteButton
              onClick={() => {
                // Remove tag
                deleteTag(idx);
                return false;
              }}
              title={trans.__('Delete tag %1', idx + 1)}
              addedStyle={{ marginTop: '4px' }}
            />
          </Cluster>
        ))}
        <Cluster justifyContent="flex-start">
          <AddButton
            onClick={(e: React.MouseEvent) => {
              addTag();
              return false;
            }}
            title={trans.__('Add new tag')}
          />
        </Cluster>
      </Stack>
    );
  };

  const showTags = () => {
    if (!props.model.tags) {
      return (
        <Stack spacing={2}>
          <p>
            <em>{trans.__('No tags')}</em>
          </p>
        </Stack>
      );
    }

    return (
      <Stack spacing={2}>
        {tags.map((tag, idx) => (
          <TextField
            label={trans.__('Tag %1', idx + 1)}
            id={`${formPrefix}tag-${idx}`}
            name={`tag-${idx}`}
            value={tag}
            InputProps={{
              readOnly: true
            }}
          />
        ))}
      </Stack>
    );
  };

  // Tags look different when they're for display or for editing.
  const tagsDisplay: JSX.Element | null =
    props.jobsView === 'CreateJob' ? createTags() : showTags();

  // The idempotency token is only used for jobs, not for job definitions
  return (
    <Stack spacing={4}>
      {props.model.createType === 'Job' && (
        <TextField
          label={trans.__('Idempotency token')}
          variant="outlined"
          onChange={handleInputChange}
          value={props.model.idempotencyToken}
          id={`${formPrefix}idempotencyToken`}
          name="idempotencyToken"
          InputProps={{ readOnly: props.jobsView !== 'CreateJob' }}
        />
      )}
      <FormLabel component="legend">{trans.__('Tags')}</FormLabel>
      {tagsDisplay}
    </Stack>
  );
};

export default AdvancedOptions;
