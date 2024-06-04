import { Poll } from '@lumino/polling';
import React, {
  useCallback,
  useRef,
  useState,
  FC,
  useEffect,
  useMemo
} from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  getOutgoers,
  ReactFlowInstance,
  Background,
  OnSelectionChangeFunc,
  NodeMouseHandler,
  BackgroundVariant,
  FitViewOptions,
  EdgeChange,
  NodeChange,
  getConnectedEdges,
  ReactFlowProvider,
  Panel,
  useReactFlow
} from 'reactflow';
import { Stack, useTheme } from '@mui/system';

import { RFState } from '../store';
import { CustomNode } from '../components/workflow-editor/custom-node';
import { CustomEdge } from '../components/workflow-editor/custom-edge';
import { Dropzone, IDropZoneProps } from '../components/drop-zone';
import { emptyCreateTaskModel, emptyCreateJobDefinitionModel } from '../model';
import {
  Badge,
  Button,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Tab,
  Tabs,
  Toolbar,
  Typography
} from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBlocker, useBeforeUnload } from 'react-router-dom';
import { useTranslator, useWorkflowStore, useWorkflows } from '../hooks';
import { withStore } from '../store/store-provider';
import { Scheduler } from '../handler';
import { ConnectionLine } from '../components/workflow-editor/connection-line';
import { JobDefinition } from './job-definition-detail';
import { MakeNameValid } from '../util/job-name-validation';
import { TaskDetail } from './task-detail';
import {
  Delete,
  PlayArrow,
  Publish,
  Refresh,
  Save,
  AccountTree,
  Upgrade
} from '@mui/icons-material';
import { nanoid } from 'nanoid';
import { generateUniqueName } from '../util';
import { RunJobForm } from './run-job-form';
import { SplitButton } from '../components/split-button';
import { ConfirmDialog } from '../components/confirmation-dialog';
import { SplitViewTemplate } from '../templates/split-view';
import { CONTENTS_MIME_RICH, WorkflowsViewType } from '../contants';
import {
  PageHeader,
  StyledAlert,
  StyledDrawer,
  StyledIconButton
} from '../components/styled/drawer';

const nodeTypes = {
  custom: CustomNode
};

const edgeTypes = {
  custom: CustomEdge
};

const defaultEdgeOptions = {
  type: 'custom',
  markerEnd: 'edge-circle'
};

const defaultFitView: FitViewOptions = {
  maxZoom: 0.8,
  duration: 500
};

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  currentJob: state.currentJob,
  updateJobData: state.updateJobData,
  setSelectedNode: state.setSelectedNode,
  onCreateEdge: state.onCreateEdge,
  onCreateNode: state.onCreateNode,
  onUpdateEdge: state.onUpdateEdge,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onEdgesDelete: state.onEdgesDelete,
  selectedNodeId: state.selectedNodeId,
  onAutoLayout: state.onAutoLayout,
  hasUnsavedChanges: state.hasUnsavedChanges,
  isValidConnection: state.isValidConnection
});

type Props = {
  onUpdate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
  onCreateTask: (payload: Scheduler.ITask) => Promise<unknown>;
};

const ReactflowWrapper: FC<Props> = ({
  onCreateTask,
  onRefresh,
  onUpdate,
  onError
}) => {
  const theme = useTheme();
  const { fitView } = useReactFlow();
  const useStore = useWorkflowStore();
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const editorBg = theme.palette.mode === 'light' ? '#daefff' : '#232f38';

  const {
    nodes,
    edges,
    currentJob,
    onCreateEdge,
    onCreateNode,
    onUpdateEdge,
    onEdgesChange,
    onNodesChange,
    onEdgesDelete,
    setSelectedNode,
    isValidConnection,
    selectedNodeId,
    onAutoLayout,
    hasUnsavedChanges
  } = useStore(selector);

  // Getters should be invoked
  const getAllTasks = useStore(state => state.getAllTasks);

  useEffect(() => {
    setTimeout(() => fitView({ duration: 500, maxZoom: 0.7 }), 0);
  }, [nodes.length, edges.length]);

  const shouldSave = useMemo(hasUnsavedChanges, [nodes, edges]);

  const handleDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (event: any) => {
      if (!currentJob?.job_definition_id) {
        console.error('The Workflow creation is still in progress.');

        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const model = emptyCreateTaskModel();
      const mimeData = event.mimeData.getData(CONTENTS_MIME_RICH);
      const response = await mimeData.withContent();

      // check if the dropped element is valid
      if (!reactFlowInstance.current || !response) {
        return;
      }

      const { name, content } = response;
      const { kernelspec } = content.metadata;

      const currentNames = getAllTasks().map(t => t.name);
      const fileName = MakeNameValid(name.split('.ipynb').shift());

      model.nodeId = nanoid();
      model.name = generateUniqueName(currentNames, fileName);
      model.input_uri = mimeData.model.path ?? '';
      model.kernelSpecId = kernelspec?.name || '';

      if (!model.kernelSpecId) {
        onError(
          `${model.name} is missing kernel spec. Choose a kernel spec and save task`
        );
      }

      // reactFlowInstance.project was renamed to reactFlowInstance.screenToFlowPosition
      // and you don't need to subtract the reactFlowBounds.left/top anymore
      // details: https://reactflow.dev/whats-new/2023-11-10
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      const newNode = {
        position,
        data: model,
        type: 'custom',
        id: model.nodeId // The node id should be the same as the data id so we can fetch the same and render later
      };

      // Create a new entry in the store
      onCreateNode(newNode);

      if (model.kernelSpecId) {
        // Save the task to the Backend
        onCreateTask(model);

        return;
      }
    },
    [onCreateNode, getAllTasks, currentJob]
  );

  const handleInit = useCallback(
    (instance: ReactFlowInstance) => (reactFlowInstance.current = instance),
    []
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const onSelectionChange = useCallback<OnSelectionChangeFunc>(
    params => {
      const [selectedItem] = params.nodes;

      if (params.nodes.length === 1 && selectedItem.id !== selectedNodeId) {
        setSelectedNode(selectedItem);

        return;
      }

      if (!selectedItem || params.nodes.length > 1) {
        setSelectedNode(null);
      }
    },
    [setSelectedNode, selectedNodeId]
  );

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_: unknown, params) => {
      setSelectedNode(params);
    },
    [setSelectedNode]
  );

  const handleEdgesDelete = useCallback(
    (edges: Edge[]) => {
      onEdgesDelete(edges);
    },
    [onEdgesDelete]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const selectedEdges: NodeChange[] = getOutgoers(node, nodes, edges).map(
        node => ({
          id: node.id,
          type: 'select',
          selected: true,
          item: node
        })
      );

      const connectedEdges: EdgeChange[] = getConnectedEdges([node], edges)
        .filter(edge => edge.source === node.id)
        .map(node => ({
          id: node.id,
          type: 'select',
          selected: true,
          item: node
        }));

      onNodesChange(selectedEdges);
      onEdgesChange(connectedEdges);
    },
    [nodes, edges]
  );

  const canAddTasks =
    !!currentJob?.job_definition_id && currentJob?.version === 'v2';

  const isJobSelected = currentJob?.id && !selectedNodeId;

  const dropzoneProps: IDropZoneProps = canAddTasks
    ? {
        onDrop: handleDrop,
        onDragOver: handleDragOver
      }
    : {};

  return (
    <>
      <Dropzone {...dropzoneProps}>
        <ReactFlow
          fitView
          nodes={nodes}
          edges={edges}
          id="task-editor"
          onInit={handleInit}
          elevateEdgesOnSelect
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          edgeUpdaterRadius={10}
          onConnect={onCreateEdge}
          onEdgeUpdate={onUpdateEdge}
          onPaneClick={handlePaneClick}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitViewOptions={defaultFitView}
          onEdgesDelete={handleEdgesDelete}
          defaultEdgeOptions={defaultEdgeOptions}
          onSelectionChange={onSelectionChange}
          isValidConnection={isValidConnection}
          onNodeDoubleClick={handleNodeDoubleClick}
          connectionLineComponent={ConnectionLine}
          deleteKeyCode={null}
          selectionOnDrag={false}
          multiSelectionKeyCode={null}
          edgesUpdatable={canAddTasks}
          nodesConnectable={canAddTasks}
          className={isJobSelected ? 'focused' : ''}
        >
          <Background
            variant={BackgroundVariant.Dots}
            style={{
              background: isJobSelected ? editorBg : 'transparent'
            }}
          />
          <Controls
            position={'bottom-right'}
            style={{ zIndex: 10 }}
            showInteractive={false}
          />
          {canAddTasks ? (
            <Panel position="top-right">
              <Toolbar disableGutters sx={{ gap: 1, minHeight: 'unset' }}>
                <StyledIconButton
                  title="Re-arrange nodes"
                  onClick={onAutoLayout}
                >
                  <AccountTree />
                </StyledIconButton>
                <StyledIconButton title="Refresh" onClick={onRefresh}>
                  <Refresh />
                </StyledIconButton>
                <StyledIconButton title="Save" onClick={onUpdate}>
                  <Badge color="error" variant="dot" invisible={!shouldSave}>
                    <Save />
                  </Badge>
                </StyledIconButton>
              </Toolbar>
            </Panel>
          ) : null}
          <svg>
            <defs>
              <linearGradient id="edge-gradient">
                <stop offset="0%" stopColor={theme.palette.success.light} />
                <stop offset="100%" stopColor={theme.palette.info.light} />
              </linearGradient>
              <linearGradient id="edge-gradient-error">
                <stop offset="0%" stopColor={theme.palette.error.light} />
                <stop offset="100%" stopColor={theme.palette.error.dark} />
              </linearGradient>
              <marker
                refX="0"
                refY="0"
                orient="auto"
                id="edge-circle"
                markerWidth="10"
                markerHeight="10"
                viewBox="-5 -5 10 10"
                markerUnits="strokeWidth"
              >
                <circle
                  r="2"
                  cx="0"
                  cy="0"
                  fill={theme.palette.grey[400]}
                  stroke={theme.palette.grey[400]}
                  strokeOpacity="0.75"
                />
              </marker>
            </defs>
          </svg>
        </ReactFlow>
      </Dropzone>
    </>
  );
};

const actionSelector = (state: RFState) => ({
  runJob: state.runJob,
  syncStore: state.syncStore,
  createTask: state.createTask,
  deleteTask: state.deleteTask,
  currentJob: state.currentJob,
  getAllTasks: state.getAllTasks,
  selectedNodeId: state.selectedNodeId,
  initializeStore: state.initializeStore,
  createJobDefinition: state.createJobDefinition,
  updateJobDefinition: state.updateJobDefinition,
  deleteJobDefinition: state.deleteJobDefinition,
  deployJobDefinition: state.deployJobDefinition,
  hasUnsavedChanges: state.hasUnsavedChanges
});

const TaskView: FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const useStore = useWorkflowStore();
  const trans = useTranslator('jupyterlab');
  const { api, setCurrentWorkflow } = useWorkflows();

  const [displayError, setDisplayError] = useState('');
  const [openRunJob, setOpenRunJob] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [jobData, setJobData] = useState<any>({
    ...emptyCreateJobDefinitionModel(),
    tasks: location?.state?.task ? [location?.state?.task] : []
  });

  const {
    runJob,
    createTask,
    deleteTask,
    syncStore,
    currentJob,
    selectedNodeId,
    initializeStore,
    getAllTasks,
    hasUnsavedChanges,
    createJobDefinition,
    updateJobDefinition,
    deleteJobDefinition,
    deployJobDefinition
  } = useStore(actionSelector);

  const pollRef = useRef(
    new Poll({
      auto: false,
      standby: 'when-hidden',
      frequency: { interval: 30 * 1000 },
      factory: () => fetchJobDefinition(),
      name: '@jupyterlab/scheduler-workflows:plugin:job_def'
    })
  );

  const fetchJobDefinition = useCallback(async () => {
    if (!jobId) {
      return;
    }

    const data = await api.getJobDefinition(jobId);

    // TODO: Fix typing
    syncStore(data as any);
    setJobData(data);
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    const fetchData = async () => {
      const jobDefinition = await api.getJobDefinition(jobId);

      setJobData(jobDefinition);
      // TODO: Fix typing
      initializeStore(jobDefinition as any);
      setCurrentWorkflow(jobDefinition);
    };

    fetchData();
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      pollRef.current.start();
    }

    return () => {
      pollRef.current.stop();
      pollRef.current.dispose();
    };
  }, [jobId]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return (
      hasUnsavedChanges() && currentLocation.pathname !== nextLocation.pathname
    );
  });

  useBeforeUnload(
    useCallback(
      event => {
        if (hasUnsavedChanges()) {
          event.preventDefault();
          event.returnValue = 'There are unsaved changes';
        }
      },
      [getAllTasks]
    )
  );

  const handleCreateJobDefinition = useCallback(
    (jobDefinition: Scheduler.IJobDefinition) => {
      return createJobDefinition(jobDefinition)
        .then(data =>
          navigate(`/job-definitions/${data.job_definition_id}`, {
            state: null // clear the state so the create workflows won't showup again when the app is restored
          })
        )
        .catch(error => setDisplayError(error.message));
    },
    [navigate]
  );

  const handleUpdateJobDefinition = useCallback(() => {
    return updateJobDefinition(currentJob as any).then(() =>
      pollRef.current?.refresh()
    );
  }, [currentJob]);

  const handleDeployJobDefinition = useCallback(() => {
    return deployJobDefinition()
      .then(() => pollRef.current?.refresh())
      .catch(error => setDisplayError(error.message));
  }, []);

  const handleCreateTask = useCallback((taskPayload: Scheduler.ITask) => {
    return createTask(taskPayload).catch(error =>
      setDisplayError(error.message)
    );
  }, []);

  const handleDeleteTask = useCallback((task: Scheduler.ITask) => {
    return deleteTask(task)
      .then(() => pollRef.current?.refresh())
      .catch(error => setDisplayError(error.message));
  }, []);

  const handleDeleteJobDefinition = useCallback(() => {
    if (jobId) {
      return deleteJobDefinition(jobId)
        .then(() => navigate('/job-definitions'))
        .catch(error => setDisplayError(error.message));
    }

    return Promise.resolve();
  }, [navigate]);

  const handleRunJob = useCallback((payload: any) => {
    setOpenRunJob(false);

    return runJob(payload);
  }, []);

  const handleMigrateWorkflow = useCallback(() => {
    handleCreateJobDefinition(jobData);
  }, [jobData, handleCreateJobDefinition]);

  const ErrorBanner = (
    <StyledAlert severity="error" onClose={() => setDisplayError('')}>
      {displayError || 'Unknown error.'}
    </StyledAlert>
  );

  const isEditable = !!jobData?.job_definition_id && jobData?.version === 'v2';
  const showSidePanel = selectedNodeId || (currentJob && currentJob.status);

  if (jobId && !jobData.id) {
    return (
      <Stack alignItems="center" justifyContent="center" height="100%">
        <LinearProgress sx={{ width: 300 }} />
        <Typography color="text.primary" variant="body1" sx={{ mt: 2 }}>
          {trans.__('Loading workflow...')}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack sx={{ height: '100%' }}>
      {jobData?.version === 'v1' ? (
        <StyledAlert
          severity="warning"
          sx={{ mx: 3 }}
          action={
            <Button
              size="small"
              color="inherit"
              startIcon={<Upgrade />}
              onClick={handleMigrateWorkflow}
            >
              {trans.__('MIGRATE')}
            </Button>
          }
        >
          Migrate to workflows to add new tasks, deploy and run as a workflow
        </StyledAlert>
      ) : null}
      <PageHeader sx={{ p: 3 }}>
        <Typography variant="h6" color="text.primary">
          {jobData?.name || 'Untitled'}
        </Typography>
        {isEditable ? (
          <Stack direction="row" gap={2} ml="auto">
            <SplitButton
              defaultAction={
                <Button
                  variant="contained"
                  startIcon={<Publish />}
                  onClick={handleDeployJobDefinition}
                >
                  {trans.__('Deploy')}
                </Button>
              }
            >
              <MenuItem onClick={() => setOpenRunJob(true)}>
                <ListItemIcon>
                  <PlayArrow />
                </ListItemIcon>
                <ListItemText>{trans.__('Run Now')}</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => setIsDeleting(true)}>
                <ListItemIcon>
                  <Delete />
                </ListItemIcon>
                <ListItemText>{trans.__('Delete workflow')}</ListItemText>
              </MenuItem>
            </SplitButton>
          </Stack>
        ) : null}
      </PageHeader>
      {displayError ? ErrorBanner : null}
      <Tabs value={WorkflowsViewType.Tasks}>
        <Tab
          value={WorkflowsViewType.Runs}
          label={trans.__(WorkflowsViewType.Runs)}
          onClick={() => navigate(`/job-definitions/${jobId}/runs`)}
        />
        <Tab
          value={WorkflowsViewType.Tasks}
          label={trans.__(WorkflowsViewType.Tasks)}
        />
      </Tabs>
      <ReactFlowProvider>
        <SplitViewTemplate
          panelWidth={showSidePanel ? 450 : 0}
          LeftPanel={
            <ReactflowWrapper
              onError={setDisplayError}
              onRefresh={fetchJobDefinition}
              onCreateTask={handleCreateTask}
              onUpdate={handleUpdateJobDefinition}
            />
          }
          RightPanel={
            <>
              <StyledDrawer
                anchor="right"
                variant="persistent"
                open={Boolean(selectedNodeId)}
              >
                {selectedNodeId ? (
                  <TaskDetail
                    key={selectedNodeId}
                    onDelete={handleDeleteTask}
                    onCreate={handleCreateTask as any}
                  />
                ) : null}
              </StyledDrawer>
              <StyledDrawer
                anchor="right"
                variant="persistent"
                open={!selectedNodeId}
              >
                {currentJob && currentJob.status ? <JobDefinition /> : null}
              </StyledDrawer>
            </>
          }
        />
      </ReactFlowProvider>
      {jobId && openRunJob ? (
        <RunJobForm
          jobDefinitionId={jobId}
          onSubmit={handleRunJob}
          onClose={() => setOpenRunJob(false)}
        />
      ) : null}
      {isDeleting ? (
        <ConfirmDialog
          title="Warning"
          color="error"
          dialogConfirmText="Delete Workflow"
          dialogText="The workflow and all tasks in the workflow will be deleted permanently. This action cannot be undone."
          onConfirm={handleDeleteJobDefinition}
          onClose={() => setIsDeleting(false)}
        />
      ) : null}
      {blocker.state === 'blocked' ? (
        <ConfirmDialog
          title="Warning"
          dialogConfirmText="Leave"
          dialogCancelText="Stay"
          dialogText={
            <Typography variant="body1">
              Your changes to the workflow <b>{currentJob?.name}</b> will be
              lost if you leave before saving.
            </Typography>
          }
          onClose={() => blocker.reset()}
          onConfirm={() => blocker.proceed()}
        />
      ) : null}
    </Stack>
  );
};

export default withStore(TaskView);
