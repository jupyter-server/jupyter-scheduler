import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback
} from 'react';

import { CreateScheduleOptions } from '../components/create-schedule-options';
import { ParametersPicker } from '../components/parameters-picker';
import { useWorkflows, useTranslator } from '../hooks';
import {
  Contact,
  IJobParameter,
  ModelWithScheduleFields,
  defaultScheduleFields
} from '../model';
import { Workflows as SchedulerTokens } from '../tokens';
import { taskNameError, WorkflowNameError } from '../util/job-name-validation';

import {
  Autocomplete,
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  Slide,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Typography
} from '@mui/material';

import { Box, Stack } from '@mui/system';
import { parseDate, serializeParameters, tryParseJSON } from '../util';
import { CONTENTS_MIME_RICH, notificationTypes } from '../contants';
import { Scheduler } from '../handler';
import FolderIcon from '@mui/icons-material/Folder';
import { nanoid } from 'nanoid';
import {
  Add,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  ChevronRight,
  Close,
  WarningRounded
} from '@mui/icons-material';
import { JsonEditor } from '../components/json-editor';
import { AutoSuggestionInput } from '../components/auto-suggestion';
import {
  convertTaskTimeoutHoursToSeconds,
  convertTaskTimeoutSecondsToHours
} from '../util/task-timeout-validation';
import { debounce } from '@mui/material/utils';
import { FormInputText } from '../components/forms/text-field';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { FormInputCheckboxList } from '../components/forms/checkbox-list';
import { FormInputDate } from '../components/forms/date-input';
import { cronToSchedule } from '../components/schedule-inputs';
import { useLocation } from 'react-router-dom';
import { AsyncButton } from '../components/async-button';
import moment from 'moment';
import { Dropzone } from '../components/drop-zone';
import { CustomTextField } from '../components/styled';

export interface ICreateWorkflowProps {
  model: Scheduler.IJobDefinition;
  onCancel: () => void;
  onCreateJob: (payload: Scheduler.IJobDefinition) => any;
  handleModelChange: (model: Scheduler.IJobDefinition) => void;
}

type FormData = {
  jobName: string;
  namespaceId: string;
  scheduleStartDate: moment.Moment | null; // The default value for creating a start date should always be null.
  notificationEvents: string[];
  taskName: string;
  inputFile: string;
  kernelSpecId: string;
  outputFormats: string[];
  triggerRule: string;
  parameters: IJobParameter[];
  notebookParameters: IJobParameter[];
  runtimeProperties: string;
  taskTimeout: string;
  notificationEmails: Contact[];
  showOutputInEmail: boolean;
  taskNotificationEvents: string[];
  slackChannel: string;
  timezone: string;
  scheduleInput: ModelWithScheduleFields;
  workflowNotificationEmails: Contact[];
};

export function CreateWorkflow(props: ICreateWorkflowProps): JSX.Element {
  const trans = useTranslator('jupyterlab');
  const { api, namespaces, kernelSpecs } = useWorkflows();
  const location = useLocation();
  const canSkipTaskCreation = !location.state;

  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileUpdated, setFileUpdated] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [canAnimateTaskForm, setCanAnimateTaskForm] = useState(false);
  const [additionalSettingsOpen, setAdditionalSettingsOpen] = useState(false);

  // A mapping from input names to error messages.
  // If an error message is "truthy" (i.e., not null or ''), we should display the
  // input in an error state and block form submission.
  // TODO: Refactor Parameters picker component so this can be managed by useForms
  const [jobErrors, setJobErrors] = useState<SchedulerTokens.ErrorsType>({});
  const [taskErrors, setTaskErrors] = useState<SchedulerTokens.ErrorsType>({});

  const isFirstRender = useRef(true);
  const componentRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const settingsRef = useRef<HTMLInputElement | null>(null);

  // TODO: Remove this once Type definition is fixed
  const taskData = props.model.tasks[0];

  const methods = useForm<any>({
    mode: 'all',
    shouldUnregister: false,
    defaultValues: {
      jobName: props.model.name || '',
      namespaceId: props.model.namespaceId || '',
      scheduleStartDate: parseDate(props.model.scheduleStartDate), // The default value for creating a start date should always be null.
      notificationEvents: props.model.notificationEvents || [],
      taskName: taskData?.name || '',
      inputFile: taskData?.input_uri || '',
      kernelSpecId: taskData?.kernelSpecId || '',
      notebookParameters: [],
      runtimeProperties: '{}',
      notificationEmails: [],
      showOutputInEmail: false,
      parameters: [],
      workflowNotificationEmails: [],
      slackChannel: taskData?.slackChannel || '',
      outputFormats: taskData?.output_formats,
      taskNotificationEvents: taskData?.notificationEvents || [],
      taskTimeout:
        convertTaskTimeoutSecondsToHours(taskData?.taskTimeout) || '4',
      scheduleInput: {
        ...cronToSchedule(
          props.model.schedule || defaultScheduleFields.schedule
        ),
        schedule: props.model.schedule || defaultScheduleFields.schedule,
        timezone: props.model.timezone || ''
      }
    }
  });

  const namespaceId = methods.watch('namespaceId');
  const kernelSpecId = methods.watch('kernelSpecId');

  const selectedNamespace = useMemo(
    () => namespaces.find(n => n.id === namespaceId),
    [namespaceId]
  );

  const selectedKernelSpec = useMemo(
    () => kernelSpecs.find(n => n.value === kernelSpecId),
    [kernelSpecId]
  );

  const { handleSubmit, control } = methods;
  const cantSubmit = trans.__('One or more of the fields has an error.');

  const debouncedSearch = useMemo(() => debounce(setSearchQuery, 300), []);

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

  useEffect(() => {
    // Kernel spec is already available in the selected notebook go to job definition
    if (isFirstRender.current && !!taskData?.kernelSpecId) {
      setTimeout(() => setCurrentStep(step => step + 1), 500);
    }

    // Do this validation only when it's a 2 step process and the first form is not completely filled
    if (!taskData?.kernelSpecId && !canSkipTaskCreation) {
      methods.trigger();
    }
  }, [methods, taskData?.kernelSpecId]);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  useEffect(() => {
    inputRef.current?.focus();

    if (currentStep > 0) {
      setCanAnimateTaskForm(true);
    }
  }, [currentStep]);

  useEffect(() => {
    if (additionalSettingsOpen) {
      setTimeout(
        () => settingsRef.current?.scrollTo({ top: 700, behavior: 'smooth' }),
        100
      );
    }
  }, [additionalSettingsOpen]);

  useEffect(() => {
    const { isValid, isSubmitting } = methods.formState;

    if (!isValid && isSubmitting) {
      handleScrollToTop();
    }
  }, [methods.formState]);

  const anyJobErrors = Object.keys(jobErrors).some(key => !!jobErrors[key]);
  const anyTaskErrors = Object.keys(taskErrors).some(key => !!taskErrors[key]);

  const submitCreateJobDefinitionRequest = async (formData: FormData) => {
    const { data, error } = tryParseJSON(formData.runtimeProperties || '{}');

    if (error || anyJobErrors) {
      console.error(
        'User attempted to submit a createJobDefinition request; button should have been disabled',
        error,
        jobErrors
      );

      handleScrollToTop();

      return;
    }

    const jobDefinitionOptions: Scheduler.IJobDefinition = {
      name: formData.jobName,
      namespaceId: formData.namespaceId,
      schedule: formData.scheduleInput.schedule,
      timezone: formData.scheduleInput.timezone,
      notificationEvents: formData.notificationEvents,
      parameters: serializeParameters(formData.parameters || []),
      notebookParameters: serializeParameters(formData.parameters || []),
      scheduleStartDate: formData.scheduleStartDate?.format('YYYY-MM-DD'),
      notificationEmails: formData.workflowNotificationEmails.map(
        c => c.email
      ) as any,
      slackChannel: formData.slackChannel || undefined,
      tasks: [
        {
          dependsOn: [],
          nodeId: nanoid(),
          name: formData.taskName,
          runtimeProperties: data,
          input_uri: formData.inputFile,
          namespaceId: formData.namespaceId,
          triggerRule: formData.triggerRule,
          kernelSpecId: formData.kernelSpecId,
          output_formats: formData.outputFormats,
          notebookParameters: serializeParameters(
            formData.notebookParameters || []
          ),
          showOutputInEmail: formData.showOutputInEmail,
          taskTimeout: convertTaskTimeoutHoursToSeconds(formData.taskTimeout)
        }
      ]
    };

    if (formData.parameters !== undefined) {
      jobDefinitionOptions.parameters = serializeParameters(
        formData.parameters
      );
    }

    if (canSkipTaskCreation) {
      jobDefinitionOptions.tasks = [];
    }

    await props.onCreateJob(jobDefinitionOptions);
  };

  const handleSetFocusWithDelay = (input: HTMLInputElement | null) => {
    // This is required so we get nice animation when the form is opened in a drawer component
    if (isFirstRender.current) {
      setTimeout(() => input?.focus(), 300);
    }
  };

  const handleScrollToTop = () => {
    // Scroll back to the top of the panel. A short delay is needed to allow for smooth scroll.
    setTimeout(() => {
      componentRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: any) => {
    const mimeData = event.mimeData.getData(CONTENTS_MIME_RICH);

    if (mimeData?.model?.type !== 'notebook') {
      return;
    }

    methods.setValue('inputFile', mimeData.model.path, {
      shouldDirty: true,
      shouldTouch: true
    });

    setFileUpdated(true);

    setTimeout(() => {
      componentRef.current && setFileUpdated(false);
    }, 3000);
  }, []);

  const JobDefinition = (
    <Slide
      direction="left"
      mountOnEnter
      unmountOnExit
      in={currentStep === (canSkipTaskCreation ? 0 : 1)}
    >
      <Box
        key="job-definition"
        display="flex"
        flexDirection="column"
        p={3}
        gap={4}
        ref={componentRef}
      >
        <FormInputText
          rules={{
            validate: value => WorkflowNameError(value, trans) || undefined
          }}
          name="jobName"
          control={control}
          label={trans.__('Name')}
          placeholder={trans.__('Workflow name')}
          inputRef={handleSetFocusWithDelay}
        />

        <Controller
          name="namespaceId"
          control={control}
          rules={{
            validate: value => (!value ? 'Namespace is required' : undefined)
          }}
          render={({ field: { onChange }, fieldState: { error } }) => (
            <Autocomplete
              sx={{
                '& .MuiInputLabel-shrink': { display: 'none' },
                '& .MuiInputLabel-root': { color: 'var(--jp-border-color0)' }
              }}
              options={namespaces}
              value={selectedNamespace}
              groupBy={option => option.cluster}
              getOptionLabel={option => option.name}
              getOptionKey={option => option.id}
              onChange={(_, v) => onChange(v?.id)}
              renderInput={(params: any) => (
                <>
                  <FormLabel component="legend" focused={false} sx={{ mb: 1 }}>
                    {trans.__('Namespace')}{' '}
                  </FormLabel>
                  <CustomTextField
                    {...params}
                    name="namespaceId"
                    variant="outlined"
                    error={!!error?.message}
                    placeholder={trans.__('Select a namespace')}
                    helperText={error?.message}
                  />
                </>
              )}
            />
          )}
        />

        <Controller
          name="scheduleInput"
          control={control}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <CreateScheduleOptions
              errors={jobErrors}
              utcOnly={false}
              canChangeSchedule
              model={value}
              label={trans.__('Schedule')}
              id={'createType'}
              handleErrorsChange={setJobErrors}
              handleModelChange={onChange}
            />
          )}
        />

        <FormInputDate
          label="Start date"
          name="scheduleStartDate"
          control={control}
          placeholder={trans.__('Schedule start date')}
        />

        <Link
          underline="none"
          sx={{
            gap: 2,
            display: 'flex',
            cursor: 'pointer',
            alignItems: 'center'
          }}
          component="button"
          onClick={() => setAdditionalSettingsOpen(v => !v)}
        >
          <ChevronRight
            sx={{
              transform: additionalSettingsOpen ? 'rotate(90deg)' : 'none'
            }}
          />{' '}
          Additional settings
        </Link>

        <Collapse in={additionalSettingsOpen}>
          <Stack sx={{ gap: 4 }}>
            <Controller
              name={'parameters'}
              control={control}
              render={({
                field: { value, onChange },
                fieldState: { error }
              }) => (
                <ParametersPicker
                  errors={jobErrors}
                  name={'parameters'}
                  label={trans.__('Parameters')}
                  id={'parameters'}
                  handleErrorsChange={setJobErrors}
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

            <Stack spacing={1}>
              <InputLabel>
                {trans.__('Notification emails')}{' '}
                <Typography variant="caption">- Optional</Typography>
              </InputLabel>
              <Controller
                name="workflowNotificationEmails"
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
              label={trans.__('Slack channel')}
              placeholder={trans.__('channel to notify')}
              helperText={
                'e.g. #example-slack-channel (must be a public channel)'
              }
            />
          </Stack>
        </Collapse>

        {anyJobErrors ? (
          <FormHelperText error>
            {trans.__(
              'The form could not be submitted because some required fields are missing'
            )}
          </FormHelperText>
        ) : null}
      </Box>
    </Slide>
  );

  const TaskDetails = (
    <Slide
      mountOnEnter
      unmountOnExit
      direction="right"
      in={currentStep === 0}
      appear={canAnimateTaskForm}
    >
      <Box key="task-details" sx={{ p: 3, height: '100%' }} ref={componentRef}>
        <Box display="flex" flexDirection="column" pt={0} gap={4}>
          <FormInputText
            name="taskName"
            control={control}
            margin="none"
            label={trans.__('Name')}
            placeholder={trans.__('Task name')}
            rules={{
              validate: value => taskNameError(value, trans) || undefined
            }}
            inputRef={inputRef}
          />

          <Dropzone onDrop={handleDrop} onDragOver={handleDragOver}>
            <FormInputText
              fullWidth
              name="inputFile"
              control={control}
              margin="none"
              label={trans.__('Input file snapshot')}
              rules={{
                required: 'This field is required'
              }}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <FolderIcon fontSize="small" />
                    &nbsp;&nbsp;/
                  </InputAdornment>
                ),
                endAdornment: fileUpdated ? (
                  <InputAdornment position="end">
                    <CheckCircle color="success" fontSize="small" />
                  </InputAdornment>
                ) : null
              }}
              helperText="Drag a file from the file browser and drop it here to update the input file snapshot"
            />
          </Dropzone>

          <Controller
            name="kernelSpecId"
            control={control}
            rules={{
              validate: value =>
                !value ? 'Kernel configuration is required' : undefined
            }}
            render={({ field: { onChange }, fieldState: { error } }) => (
              <Autocomplete
                sx={{
                  '& .MuiInputLabel-shrink': { display: 'none' },
                  '& .MuiInputLabel-root': { color: 'var(--jp-border-color0)' }
                }}
                options={kernelSpecs}
                value={selectedKernelSpec}
                onChange={(_, v) => onChange(v?.value)}
                renderInput={(params: any) => (
                  <>
                    <FormLabel
                      component="legend"
                      focused={false}
                      sx={{ mb: 1 }}
                    >
                      {trans.__('Kernel configuration')}{' '}
                    </FormLabel>
                    <CustomTextField
                      {...params}
                      name="kernelSpecId"
                      variant="outlined"
                      error={!!error?.message}
                      helperText={error?.message}
                      placeholder={trans.__('Select a kernel configuration')}
                    />
                  </>
                )}
              />
            )}
          />

          <Controller
            name="notebookParameters"
            control={control}
            render={({ field: { value, onChange } }) => (
              <ParametersPicker
                errors={taskErrors}
                name={'parameters'}
                label={trans.__('Parameters')}
                id={'notebookParameters'}
                handleErrorsChange={setTaskErrors}
                onChange={onChange}
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="runtimeProperties"
            render={({ field: { value, onChange } }) => (
              <JsonEditor
                label="Runtime properties"
                initialValue={value}
                onChange={onChange}
              />
            )}
          />

          <FormInputText
            control={control}
            name="taskTimeout"
            margin="none"
            type="number"
            label={trans.__('Job timeout')}
            helperText={'Default (and minimum) is 4 hours'}
            rules={{
              validate: (value = 0) =>
                value < 4 ? 'Timeout must be 4 hours or greater.' : undefined
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {trans.__('hours')}
                </InputAdornment>
              )
            }}
          />

          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend" focused={false}>
              {trans.__('Notification email settings')}{' '}
              <Typography variant="caption">- Optional</Typography>
            </FormLabel>
            <Controller
              name="showOutputInEmail"
              control={control}
              render={({ field: { value, onChange } }) => (
                <>
                  <Tooltip
                    placement="left"
                    title={
                      <Grid
                        container
                        direction="row"
                        alignItems="center"
                        spacing={1}
                      >
                        <Grid item>
                          <WarningRounded />
                        </Grid>
                        <Grid item>
                          Do not enable if outputs include sensitive
                          information.
                        </Grid>
                      </Grid>
                    }
                  >
                    <FormControlLabel
                      control={<Checkbox checked={value} onChange={onChange} />}
                      label={trans.__('Preview outputs')}
                    />
                  </Tooltip>
                  <FormHelperText>
                    Outputs that execute Javascript will not render in emails.
                  </FormHelperText>
                </>
              )}
            />
          </FormControl>
        </Box>
      </Box>
    </Slide>
  );

  const numberOfSteps = [
    canSkipTaskCreation ? null : TaskDetails,
    JobDefinition
  ].filter(Boolean);

  const actionSteps = [
    canSkipTaskCreation ? null : (
      <React.Fragment key="step-1-btn">
        <Button
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={async () => {
            if ((await methods.trigger()) && !anyTaskErrors) {
              setCurrentStep(currentStep + 1);

              return;
            }

            handleScrollToTop();
          }}
        >
          {trans.__('Proceed to workflow')}
        </Button>
      </React.Fragment>
    ),

    <React.Fragment key="step-2-btn">
      {canSkipTaskCreation ? null : (
        <Button
          variant="text"
          sx={{ mr: 'auto' }}
          startIcon={<ArrowBack />}
          onClick={() => setCurrentStep(currentStep - 1)}
        >
          {trans.__('Back to task')}
        </Button>
      )}

      <Button variant="text" onClick={e => props.onCancel()}>
        {trans.__('Cancel')}
      </Button>

      <AsyncButton
        variant="contained"
        startIcon={<Add />}
        title={anyJobErrors ? cantSubmit : ''}
        onClick={handleSubmit(submitCreateJobDefinitionRequest)}
      >
        {trans.__('Create workflow')}
      </AsyncButton>
    </React.Fragment>
  ].filter(Boolean);

  const taskError = [
    'taskName',
    'kernelSpecId',
    'outputFormats',
    'taskTimeout'
  ].some(key => !!methods.formState.errors[key]);

  const workflowError =
    Object.keys(methods.formState.errors).length && !taskError;

  return (
    <FormProvider {...methods}>
      <Stack sx={{ height: '100%', overflow: 'hidden' }}>
        <Stack gap={5} p={4}>
          <Box
            my={2}
            px={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h5">{trans.__('Create workflow')}</Typography>
            <IconButton onClick={props.onCancel}>
              <Close />
            </IconButton>
          </Box>
          {numberOfSteps.length > 1 ? (
            <Stepper
              activeStep={currentStep}
              sx={{
                px: 1,
                '& .MuiStepLabel-root .Mui-completed': {
                  color: 'success.main'
                }
              }}
            >
              <Step>
                <StepLabel error={!!taskError || anyTaskErrors}>
                  {trans.__('Task details')}
                </StepLabel>
              </Step>
              <Step>
                <StepLabel error={!!workflowError || anyJobErrors}>
                  {trans.__('Workflow details')}
                </StepLabel>
              </Step>
            </Stepper>
          ) : null}
        </Stack>
        <Box
          px={4}
          height={500}
          ref={settingsRef}
          overflow="scroll"
          className="scroll-shadow"
        >
          <form onSubmit={e => e.preventDefault()}>
            {numberOfSteps.map((Component, idx) =>
              idx === currentStep ? Component : null
            )}
          </form>
        </Box>
        <Stack direction="row" gap={3} justifyContent="flex-end" px={7} py={4}>
          {actionSteps.length
            ? actionSteps.map((Component, idx) =>
                idx === currentStep ? Component : null
              )
            : actionSteps[0]}
        </Stack>
      </Stack>
    </FormProvider>
  );
}
