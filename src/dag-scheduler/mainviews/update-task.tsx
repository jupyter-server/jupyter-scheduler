import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { ParametersPicker } from '../components/parameters-picker';
import { useWorkflows, useTranslator } from '../hooks';
import { convertParameters } from '../model';
import { taskNameError } from '../util/job-name-validation';
import FolderIcon from '@mui/icons-material/Folder';
import {
  CircularProgress,
  FormHelperText,
  InputAdornment,
  FormControlLabel,
  FormControl,
  FormLabel,
  Tooltip,
  Grid,
  Typography,
  Checkbox,
  Button,
  Autocomplete,
  TextField,
  styled,
  TextFieldProps,
  Stack
} from '@mui/material';
import { WarningRounded, CheckCircle } from '@mui/icons-material';

import { Box } from '@mui/system';
import { JsonEditor } from '../components/json-editor';
import {
  triggerRuleTypes,
  TriggerRules,
  CONTENTS_MIME_RICH
} from '../contants';
import TaskDependency from '../components/task-dependency';
import { Scheduler } from '../handler';
import { FormInputText } from '../components/forms/text-field';
import { Controller } from 'react-hook-form';
import { FormInputSelectBox } from '../components/forms/select-box';

import {
  convertTaskTimeoutHoursToSeconds,
  convertTaskTimeoutSecondsToHours
} from '../util/task-timeout-validation';
import { useForm, FormProvider } from 'react-hook-form';
import { serializeParameters, tryParseJSON } from '../util';
import { nanoid } from 'nanoid';
import { Workflows } from '../tokens';
import { Dropzone } from '../components/drop-zone';

export interface IUpdateTaskProps {
  model: Scheduler.ITask;
  onCancel: () => void;
  onCreate: (payload: Scheduler.ITask) => any;
}

const CustomTextField = styled(TextField)<TextFieldProps>(({ theme }) => ({
  '& fieldset': { top: 0 },
  '& legend': {
    display: 'none',
    color: theme.palette.grey,
    marginBottom: theme.spacing(2)
  },
  '& .MuiInputLabel-shrink': { opacity: 0 },
  '& .MuiInputLabel-root': { color: 'var(--jp-border-color0)' }
}));

// TODO: rename the component & file name
export function UpdateTask(props: IUpdateTaskProps): JSX.Element {
  const { model } = props;
  const trans = useTranslator('jupyterlab');
  const { kernelSpecs } = useWorkflows();
  const [errors, setErrors] = useState<Workflows.ErrorsType>({});
  const [loading, setLoading] = useState(false);
  const [fileUpdated, setFileUpdated] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const componentRef = useRef<HTMLElement | null>(null);

  const methods = useForm<any>({
    mode: 'all',
    shouldUnregister: false,
    defaultValues: {
      taskName: model?.name || '',
      inputFile: model?.input_uri || model.input_filename,
      kernelSpecId: model?.kernelSpecId || '',
      triggerRule: model?.triggerRule || TriggerRules.ALL_SUCCESS,
      parameters: convertParameters(props.model.parameters || {}),
      notebookParameters: convertParameters(
        props.model.notebookParameters || {}
      ),
      runtimeProperties: JSON.stringify(
        model?.runtimeProperties || {},
        null,
        2
      ),
      notificationEmails: model?.notificationEmails || [],
      showOutputInEmail: model?.showOutputInEmail,
      slackChannel: model?.slackChannel || '',
      outputFormats: model?.output_formats || [],
      taskNotificationEvents: model?.notificationEvents || [],
      taskTimeout: convertTaskTimeoutSecondsToHours(model?.taskTimeout) || '4'
    }
  });

  const { handleSubmit, control } = methods;

  const kernelSpecId = methods.watch('kernelSpecId');

  const selectedKernelSpec = useMemo(
    () => kernelSpecs.find(n => n.value === kernelSpecId),
    [kernelSpecId]
  );

  useEffect(() => {
    inputRef.current?.focus();

    return () => {
      inputRef.current = null;
      componentRef.current = null;
    };
  }, []);

  useEffect(() => {
    const { isValid, isSubmitting } = methods.formState;

    if (!isValid && isSubmitting) {
      handleScrollToTop();
    }
  }, [methods.formState]);

  useEffect(() => {
    if (!model.id) {
      methods.trigger();
    }
  }, [model.id, methods]);

  const submitTaskChange = async (formData: any) => {
    const { data, error } = tryParseJSON(formData.runtimeProperties || '{}');

    if (error) {
      console.error(
        'User attempted to submit a createJobDefinition request; button should have been disabled',
        error
      );

      return;
    }

    const taskDeatil: Scheduler.ITask = {
      dependsOn: [],
      id: model?.id,
      nodeId: model?.nodeId || nanoid(),
      name: formData.taskName,
      runtimeProperties: data,
      input_uri: undefined as any,
      namespaceId: formData.namespaceId,
      triggerRule: formData.triggerRule,
      kernelSpecId: formData.kernelSpecId,
      output_formats: formData.outputFormats,
      input_file_id: model?.input_file_id,
      notebookParameters: serializeParameters(
        formData.notebookParameters || []
      ),
      taskTimeout: convertTaskTimeoutHoursToSeconds(formData.taskTimeout),
      slackChannel: formData.slackChannel || undefined,
      showOutputInEmail: formData.showOutputInEmail,
      notificationEmails: formData.notificationEmails
    };

    if (formData.parameters !== undefined) {
      taskDeatil.parameters = serializeParameters(formData.parameters);
    }

    // Only if the inputFile is updated or same file is used, send the value to backend else do not send file path
    // This is because if a task is updated from a different server that it was originally created
    // backend cannot read the file content because the input_uri saved in the task is not a valid path
    if (
      !model.id || // If the task is not yet saved, always send the input_uri
      methods.formState.dirtyFields.inputFile ||
      methods.formState.touchedFields.inputFile
    ) {
      taskDeatil.input_uri = formData.inputFile;
      taskDeatil.input_file_id = model.input_file_id;
    }

    try {
      setLoading(true);
      await props.onCreate(taskDeatil);
      props.onCancel();
    } finally {
      setLoading(false);
    }
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

  const handleScrollToTop = () => {
    // Scroll back to the top of the panel. A short delay is needed to allow for smooth scroll.
    setTimeout(() => {
      componentRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={e => e.preventDefault()}>
        <Box
          display="flex"
          flexDirection="column"
          py={4}
          gap={4}
          ref={componentRef}
        >
          <FormInputText
            name="taskName"
            control={control}
            margin="none"
            label={trans.__('Name')}
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

          <TaskDependency />

          <FormInputSelectBox
            variant="standard"
            control={control}
            name="triggerRule"
            id={'triggerRule'}
            label={trans.__('Trigger rule')}
            options={triggerRuleTypes}
            renderValue={v => v}
          />

          <Controller
            name="notebookParameters"
            control={control}
            render={({ field: { value, onChange } }) => (
              <ParametersPicker
                errors={errors}
                name={'notebookParameters'}
                label={trans.__('Parameters')}
                id={'notebookParameters'}
                handleErrorsChange={setErrors}
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
                    placement="left"
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

          <Stack direction="row" gap={3} justifyContent="flex-end">
            {loading ? (
              <>
                {trans.__('Updating task detail …')}
                <CircularProgress size="20px" />
              </>
            ) : (
              <>
                <Button variant="text" onClick={props.onCancel}>
                  {trans.__('Cancel')}
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSubmit(submitTaskChange)}
                >
                  {trans.__('Update')}
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </form>
    </FormProvider>
  );
}
