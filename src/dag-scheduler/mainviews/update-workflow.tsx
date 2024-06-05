import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CreateScheduleOptions } from '../components/create-schedule-options';
import { ParametersPicker } from '../components/parameters-picker';
import { useWorkflows, useTranslator } from '../hooks';
import { Contact, convertParameters, defaultScheduleFields } from '../model';
import { Workflows as SchedulerTokens } from '../tokens';
import {
  Button,
  CircularProgress,
  FormHelperText,
  InputLabel,
  Typography
} from '@mui/material';
import { debounce } from '@mui/material/utils';
import { AutoSuggestionInput } from '../components/auto-suggestion';

import { Box, Stack } from '@mui/system';
import { parseDate, serializeParameters } from '../util';
import { notificationTypes } from '../contants';
import { Scheduler } from '../handler';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { FormInputText } from '../components/forms/text-field';
import { FormInputGroupedSelectBox } from '../components/forms/select-box';
import { cronToSchedule } from '../components/schedule-inputs';
import { FormInputCheckboxList } from '../components/forms/checkbox-list';
import { FormInputDate } from '../components/forms/date-input';

export interface IUpdateWorkflowProps {
  model: Scheduler.IJobDefinition;
  onCancel: () => void;
  onUpdate: (payload: Scheduler.IJobDefinition) => any;
}

export function UpdateWorkflow(props: IUpdateWorkflowProps): JSX.Element {
  const trans = useTranslator('jupyterlab');
  const { api, namespaces } = useWorkflows();

  const [loading, setLoading] = useState(false);
  const componentRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);

  // A mapping from input names to error messages.
  // If an error message is "truthy" (i.e., not null or ''), we should display the
  // input in an error state and block form submission.
  const [errors, setErrors] = useState<SchedulerTokens.ErrorsType>({});

  const debouncedSearch = useMemo(() => debounce(setSearchQuery, 300), []);

  const namespacesByCluster = useMemo(() => {
    const groups = namespaces.reduce((result, current) => {
      result[current.cluster] = result[current.cluster] || [];

      result[current.cluster].push({ ...current });

      return result;
    }, {} as any);

    return Object.keys(groups).map(k => ({
      groupName: k,
      items: groups[k]
    }));
  }, [namespaces]);

  const methods = useForm<any>({
    mode: 'all',
    shouldUnregister: false,
    defaultValues: {
      jobName: props.model.name || '',
      namespaceId: props.model.namespaceId || '',
      scheduleStartDate: parseDate(props.model.scheduleStartDate), // The default value for creating a start date should always be null.
      notificationEvents: props.model.notificationEvents || [],
      notificationEmails: (props.model.notificationEmails || []).map(email => ({
        email
      })),
      parameters: convertParameters(props.model.parameters || {}),
      slackChannel: props.model.slackChannel || '',
      scheduleInput: {
        ...cronToSchedule(
          props.model.schedule || defaultScheduleFields.schedule
        ),
        schedule: props.model.schedule || defaultScheduleFields.schedule,
        timezone: props.model.timezone || ''
      }
    }
  });

  const { handleSubmit, control } = methods;

  const namespacesById = useMemo(
    () => new Map(namespaces.map(item => [item.id, item.name])),
    [namespaces]
  );

  useEffect(() => {
    const stringMatch: (str: string) => boolean = str =>
      str.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1;

    const getContacts = async () => {
      const users = await api.getContacts(searchQuery);

      setContacts(
        users.filter(c => stringMatch(c.email) || stringMatch(c.name))
      );
    };

    searchQuery && getContacts();
  }, [searchQuery]);

  const anyErrors = Object.keys(errors).some(key => !!errors[key]);

  const submitCreateJobDefinitionRequest = async (formData: any) => {
    const jobDefinitionOptions: Scheduler.IJobDefinition = {
      id: props.model?.id,
      job_definition_id: props.model?.job_definition_id,
      name: props.model.name || '',
      active: props.model.active,
      namespaceId: props.model.namespaceId || '',
      schedule: formData.scheduleInput.schedule,
      timezone: formData.scheduleInput.timezone,
      notificationEvents: formData.notificationEvents,
      notificationEmails: formData.notificationEmails.map(
        (c: Contact) => c.email
      ) as any,
      scheduleStartDate: formData.scheduleStartDate?.format('YYYY-MM-DD'),
      parameters: serializeParameters(formData.parameters || []),
      notebookParameters: serializeParameters(formData.parameters || []),
      slackChannel: formData.slackChannel || undefined,
      tasks: []
    };

    try {
      setLoading(true);

      await props.onUpdate(jobDefinitionOptions);

      props.onCancel();
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={e => e.preventDefault()}>
        <Stack spacing={5} py={4}>
          <Box gap={4} display="flex" ref={componentRef} flexDirection="column">
            <FormInputText
              name="jobName"
              rules={{ required: true }}
              value={props.model.name}
              label={trans.__('Name')}
              disabled // TODO: For now keep it disabled
              helperText="Workflow name cannot be changed"
            />

            <FormInputGroupedSelectBox
              disabled
              variant="standard"
              control={control}
              name={'namespaceId'}
              rules={{ required: true }}
              label={trans.__('Namespace')}
              id={'namespaceId'}
              options={namespacesByCluster}
              placeholder="Select a namespace"
              renderValue={value => namespacesById.get(value) || value}
              helperText="Namespace cannot be changed"
            />

            <Controller
              name="scheduleInput"
              control={control}
              render={({ field: { value, onChange } }) => (
                <CreateScheduleOptions
                  errors={errors}
                  utcOnly={false}
                  canChangeSchedule
                  model={value}
                  label={trans.__('Schedule')}
                  id={'createType'}
                  handleErrorsChange={setErrors}
                  handleModelChange={onChange}
                />
              )}
            />

            <FormInputDate
              label="Start date"
              name="scheduleStartDate"
              control={control}
            />

            <Controller
              name={'parameters'}
              control={control}
              render={({
                field: { value, onChange },
                fieldState: { error }
              }) => (
                <ParametersPicker
                  errors={errors}
                  name={'parameters'}
                  label={trans.__('Parameters')}
                  id={'parameters'}
                  handleErrorsChange={setErrors}
                  onChange={onChange}
                  value={value}
                />
              )}
            />

            <FormInputCheckboxList
              control={control}
              label={trans.__('Notification events')}
              name="notificationEvents"
              id={'notificationEvents'}
              options={notificationTypes}
            />

            <Stack spacing={2}>
              <InputLabel>
                {trans.__('Notification emails')}{' '}
                <Typography variant="caption">- Optional</Typography>
              </InputLabel>
              <Controller
                name="notificationEmails"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <AutoSuggestionInput
                    value={value}
                    contacts={contacts}
                    onSearch={debouncedSearch}
                    onChange={onChange}
                  />
                )}
              />
            </Stack>

            <FormInputText
              control={control}
              name="slackChannel"
              label={trans.__('Slack channel to notify')}
              helperText={
                'e.g. #example-slack-channel (must be a public channel)'
              }
            />

            {anyErrors ? (
              <FormHelperText error>
                {trans.__(
                  'The form could not be submitted because some required fields are missing'
                )}
              </FormHelperText>
            ) : null}
          </Box>
          <Stack direction="row" gap={3} justifyContent="flex-end">
            {loading ? (
              <>
                {trans.__('Updating workflow …')}
                <CircularProgress size="20px" />
              </>
            ) : (
              <>
                <Button variant="text" onClick={props.onCancel}>
                  {trans.__('Cancel')}
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSubmit(submitCreateJobDefinitionRequest)}
                >
                  {trans.__('Update')}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </form>
    </FormProvider>
  );
}
