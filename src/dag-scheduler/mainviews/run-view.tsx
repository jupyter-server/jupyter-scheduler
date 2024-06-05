import React, {
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';
import {
  Alert,
  Button,
  LinearProgress,
  List,
  Stack,
  Toolbar,
  Typography,
  useTheme,
  ListItem
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTranslator, useWorkflowStore, useWorkflows } from '../hooks';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  FitViewOptions,
  OnSelectionChangeFunc,
  Panel,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import { Poll } from '@lumino/polling';
import { TaskRunNode } from '../components/workflow-editor/task-run-node';
import { CustomEdge } from '../components/workflow-editor/custom-edge';
import { TaskRunDetail } from './task-run-detail';
import { JobRunDetail } from './job-run-detail';
import { withStore } from '../store/store-provider';
import { Refresh, AccountTree } from '@mui/icons-material';
import { ConfirmDialog } from '../components/confirmation-dialog';
import { RFState } from '../store';
import { Scheduler } from '../handler';
import { JobStatus } from '../contants';
import { RunStatus } from '../model';
import { SplitViewTemplate } from '../templates/split-view';
import {
  PageHeader,
  StyledDrawer,
  StyledIconButton
} from '../components/styled';

const nodeTypes = {
  custom: TaskRunNode
};

const edgeTypes = {
  custom: CustomEdge
};

const defaultEdgeOptions = {
  type: 'custom',
  markerEnd: 'edge-circle',
  data: {
    hideBtn: true
  }
};

const defaultFitView: FitViewOptions = {
  maxZoom: 0.8,
  duration: 500
};

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  currentJob: state.currentJob,
  selectedNodeId: state.selectedNodeId,
  setSelectedNode: state.setSelectedNode,
  onNodesChange: state.onNodesChange,
  onAutoLayout: state.onAutoLayout
});

type Props = {
  onRefresh: () => Promise<void>;
};

type ReactWrapperHandle = { fitView: VoidFunction };

const ReactflowWrapper = forwardRef<ReactWrapperHandle, Props>(
  ({ onRefresh }, ref) => {
    const theme = useTheme();
    const { fitView } = useReactFlow();
    const useStore = useWorkflowStore();

    const {
      nodes,
      edges,
      currentJob,
      onNodesChange,
      selectedNodeId,
      setSelectedNode,
      onAutoLayout
    } = useStore(selector);

    const handleFitView = () => {
      fitView({ duration: 500, maxZoom: 0.7 });
    };

    useImperativeHandle(ref, () => ({
      fitView: handleFitView
    }));

    useEffect(() => {
      setTimeout(handleFitView, 0);
    }, [nodes.length, edges.length]);

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

    const isJobSelected = currentJob?.runId && !selectedNodeId;
    const editorBg = theme.palette.mode === 'light' ? '#daefff' : '#232f38';

    return (
      <ReactFlow
        fitView
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        elevateEdgesOnSelect={false}
        fitViewOptions={defaultFitView}
        defaultEdgeOptions={defaultEdgeOptions}
        deleteKeyCode={null}
        selectionOnDrag={false}
        multiSelectionKeyCode={null}
        onNodesChange={onNodesChange}
        onPaneClick={handlePaneClick}
        nodesConnectable={false}
        onSelectionChange={onSelectionChange}
        className={isJobSelected ? 'focused' : ''}
      >
        <Background
          variant={BackgroundVariant.Dots}
          style={{
            background: isJobSelected ? editorBg : 'transparent'
          }}
        />
        <Controls
          position="bottom-right"
          style={{ zIndex: 10 }}
          showInteractive={false}
        />
        {currentJob?.runId ? (
          <Panel position="top-right">
            <Toolbar disableGutters sx={{ gap: 1, minHeight: 'unset' }}>
              <StyledIconButton title="Re-arrange nodes" onClick={onAutoLayout}>
                <AccountTree />
              </StyledIconButton>
              <StyledIconButton title="Refresh" onClick={onRefresh}>
                <Refresh />
              </StyledIconButton>
            </Toolbar>
          </Panel>
        ) : null}
        <svg>
          <defs>
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
                fill="#b1b1b7"
                stroke="#b1b1b7"
                strokeOpacity="0.75"
              />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    );
  }
);

const actionsSelector = (state: RFState) => ({
  syncStore: state.syncStore,
  currentJob: state.currentJob,
  updateTask: state.createTask,
  selectedNodeId: state.selectedNodeId,
  initializeStore: state.initializeStore,
  reRunJob: state.reRunJob
});

export const JobsRunView: FC = () => {
  const { runId, jobId } = useParams();
  const { api, currentWorkflow } = useWorkflows();
  const useStore = useWorkflowStore();
  const trans = useTranslator('jupyterlab');
  const [loading, setLoading] = useState(true);
  const [showRerun, setShowRerun] = useState(false);
  const [displayError, setDisplayError] = useState('');
  const reactflowInstance = useRef<ReactWrapperHandle | null>(null);

  const {
    reRunJob,
    syncStore,
    updateTask,
    currentJob,
    selectedNodeId,
    initializeStore
  } = useStore(actionsSelector);
  const taskRuns = useStore(state => state.getTaskRuns());

  const failedTaks = useMemo(
    () => taskRuns.filter(run => (run.status as any) === RunStatus.FAILED),
    [taskRuns]
  );

  const pollRef = useRef(
    new Poll({
      auto: false,
      standby: 'when-hidden',
      factory: () => fetchJobRun(),
      frequency: { interval: 30 * 1000 },
      name: '@jupyterlab/scheduler-workflows:plugin:job_run'
    })
  );

  useEffect(() => {
    if (!runId) {
      return;
    }

    const fetchData = async () => {
      const data = (await api.getJob(
        runId || '',
        currentWorkflow?.version
      )) as any;

      setLoading(false);
      initializeStore(data);
      pollRef.current.start();
    };

    fetchData();
  }, [runId]);

  useEffect(() => {
    return () => {
      pollRef.current.stop();
      pollRef.current.dispose();
    };
  }, []);

  const fetchJobRun = useCallback(async () => {
    if (!runId) {
      return;
    }

    const data = await api.getJob(runId, currentWorkflow?.version);

    syncStore(data);
  }, [runId]);

  const handleRerunJob = useCallback(() => {
    setShowRerun(false);

    return reRunJob(runId).catch(error => setDisplayError(error.message));
  }, [runId]);

  const handleOpenRerunDialog = useCallback(() => {
    if (currentJob?.status !== JobStatus.FAILED || !failedTaks.length) {
      setDisplayError('Only failed jobs can be re-run');

      return;
    }

    setShowRerun(true);
  }, [currentJob]);

  const handleUpdateTask = useCallback(
    (taskPayload: Scheduler.ITask) => {
      if (taskPayload.id) {
        return updateTask(taskPayload, false).catch(error =>
          setDisplayError(error.message)
        );
      }
    },
    [jobId]
  );

  const ErrorBanner = (
    <Alert
      severity="error"
      style={{
        boxShadow: 'none',
        position: 'relative',
        boxSizing: 'border-box',
        marginBottom: '8px',
        borderTop: '1px solid var(--jp-border-color2)'
      }}
      onClose={() => setDisplayError('')}
    >
      {displayError || 'Unknown error.'}
    </Alert>
  );

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" height="100%">
        <LinearProgress sx={{ width: 300 }} />
        <Typography color="text.primary" variant="body1" sx={{ mt: 2 }}>
          {trans.__('Loading workflow run...')}
        </Typography>
      </Stack>
    );
  }

  const isEditable =
    !!currentJob?.job_definition_id && currentWorkflow?.version === 'v2';

  const showSidePanel = selectedNodeId || (currentJob && currentJob.runId);

  return (
    <Stack sx={{ height: '100%' }}>
      <PageHeader sx={{ p: 3 }}>
        <Typography variant="h6" color="text.primary">
          {currentJob?.name || 'Untitled'} run
        </Typography>
        {isEditable ? (
          <Stack direction="row" gap={2} ml="auto">
            <Button
              variant="outlined"
              title="Re-run job"
              onClick={handleOpenRerunDialog}
            >
              {trans.__('Re-run job')}
            </Button>
          </Stack>
        ) : null}
      </PageHeader>
      {displayError ? ErrorBanner : null}
      <ReactFlowProvider>
        <SplitViewTemplate
          panelWidth={showSidePanel ? 350 : 0}
          onLayout={() => reactflowInstance.current?.fitView()}
          LeftPanel={
            <ReactflowWrapper ref={reactflowInstance} onRefresh={fetchJobRun} />
          }
          RightPanel={
            <>
              <StyledDrawer
                anchor="right"
                variant="persistent"
                open={Boolean(selectedNodeId)}
              >
                {selectedNodeId ? (
                  <TaskRunDetail
                    taskId={selectedNodeId}
                    onUpdate={handleUpdateTask}
                  />
                ) : null}
              </StyledDrawer>
              <StyledDrawer
                anchor="right"
                variant="persistent"
                open={!selectedNodeId}
              >
                {!selectedNodeId ? <JobRunDetail /> : null}
              </StyledDrawer>
            </>
          }
        />
      </ReactFlowProvider>
      {showRerun ? (
        <ConfirmDialog
          title="Re-run Job"
          color="primary"
          dialogConfirmText="Re-run job"
          dialogText={
            <Stack gap={4}>
              <Typography>The following tasks will be re-run</Typography>
              <List>
                {failedTaks.map(t => (
                  <ListItem key={t.id}>{t.name}</ListItem>
                ))}
              </List>
            </Stack>
          }
          onConfirm={handleRerunJob}
          onClose={() => setShowRerun(false)}
        />
      ) : null}
    </Stack>
  );
};

export default withStore(JobsRunView);
