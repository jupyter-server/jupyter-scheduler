import React, { ChangeEvent } from 'react';

import { addIcon, closeIcon } from '@jupyterlab/ui-components';

import { FormLabel, IconButton, Stack, TextField } from '@mui/material';

import { useTranslator } from './hooks';
import Scheduler from './tokens';
import { Cluster } from './components/cluster';

const AdvancedOptions = (
  props: Scheduler.IAdvancedOptionsProps
): JSX.Element => {
  const formPrefix = 'jp-create-job-advanced-';

  const trans = useTranslator('jupyterlab');

  // Cache text inputs so that React can update their state immediately, preventing
  // a situation where the cursor jumps to the end of the text box after the user
  // enters a character mid-input.
  const [textInputs, setTextInputs] = React.useState<Record<string, string>>({
    idempotencyToken: props.model.idempotencyToken ?? ''
  });

  const [tags, setTags] = React.useState<string[]>(props.model.tags ?? []);

  const handleInputChange = (event: ChangeEvent) => {
    const target = event.target as HTMLInputElement;

    const value = target.value;
    const name = target.name;

    setTextInputs({ ...textInputs, [name]: value });
    props.handleModelChange({ ...props.model, [name]: value });
  };

  const handleTagChange = (event: ChangeEvent) => {
    if (props.jobsView !== 'CreateJob') {
      return; // Read-only mode
    }

    const target = event.target as HTMLInputElement;

    const value = target.value;
    const name = target.name;
    const tagIdxMatch = name.match(/^tag-(\d+)$/);

    if (tagIdxMatch === null) {
      return null;
    }

    const newTags = props.model.tags ?? [];
    newTags[parseInt(tagIdxMatch[1])] = value;

    setTags(newTags);
    props.handleModelChange({ ...props.model, tags: newTags });
  };

  const addTag = () => {
    const newTags = [...(props.model.tags ?? []), ''];
    setTags(newTags);
    props.handleModelChange({ ...props.model, tags: newTags });
  };

  const deleteTag = (idx: number) => {
    const newTags = props.model.tags ?? [];
    newTags.splice(idx, 1);
    setTags(newTags);
    props.handleModelChange({ ...props.model, tags: newTags });
  };

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
            <IconButton
              aria-label="delete"
              onClick={() => {
                // Remove tag
                deleteTag(idx);
                return false;
              }}
              title={trans.__('Delete tag %1', idx + 1)}
            >
              <closeIcon.react />
            </IconButton>
          </Cluster>
        ))}
        <Cluster justifyContent="flex-start">
          <IconButton
            onClick={(e: React.MouseEvent) => {
              addTag();
              return false;
            }}
            title={trans.__('Add new tag')}
          >
            <addIcon.react />
          </IconButton>
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
            disabled
          />
        ))}
      </Stack>
    );
  };

  // Tags look different when they're for display or for editing.
  const tagsDisplay: JSX.Element | null =
    props.jobsView === 'CreateJob' ? createTags() : showTags();

  return (
    <Stack spacing={4}>
      <TextField
        label={trans.__('Idempotency token')}
        variant="outlined"
        onChange={handleInputChange}
        value={textInputs['idempotencyToken'] ?? props.model.idempotencyToken}
        id={`${formPrefix}idempotencyToken`}
        name="idempotencyToken"
        disabled={props.jobsView !== 'CreateJob'}
      />
      <FormLabel component="legend">{trans.__('Tags')}</FormLabel>
      {tagsDisplay}
    </Stack>
  );
};

export default AdvancedOptions;
