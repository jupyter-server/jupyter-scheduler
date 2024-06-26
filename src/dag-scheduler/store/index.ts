import {
  Edge,
  Node,
  addEdge,
  updateEdge,
  Connection,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  getOutgoers
} from 'reactflow';

import {
  UseBoundStoreWithEqualityFn,
  createWithEqualityFn
} from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { StoreApi } from 'zustand';
import { RunStatus, TaskStatus, emptyCreateJobDefinitionModel } from '../model';
import { Scheduler, WorkflowsService } from '../handler';
import { getLayoutedElements } from '../layout/elkjs';
import {
  buildEdges,
  buildNodes,
  buildTaskRunMap,
  buildTasksMap
} from './utils';
import { DeploymentStatus } from '../contants';

export type EdgeData = { pending?: boolean; deleting?: boolean };

export type RFState = {
  nodes: Node[];
  edges: Edge<EdgeData>[];
  selectedNodeId: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  currentJob: Omit<Scheduler.IJobRunDetail, 'tasks' | 'task_runs'> | null;
  tasksById: Record<string, Scheduler.ITask>;
  taskRunsById: Record<string, Scheduler.ITaskRun>;

  getAllTasks: () => Scheduler.ITask[];
  getTaskRuns: () => Scheduler.ITaskRun[];
  getNodeData: (nodeId: string) => Scheduler.ITask | undefined;
  getSelectedNode: () => Scheduler.ITask | undefined;
  getSelectedRunNode: () => Scheduler.ITaskRun | undefined;

  onCreateNode: (node: Node<Scheduler.ITask>) => void;
  onCreateEdge: (edge: Connection, updateEdge?: boolean) => void;
  onEdgesDelete: (edges: Edge[]) => void;
  onUpdateEdge: (oldEdge: Edge, newEdge: Connection) => void;
  isValidConnection: (connection: Connection) => boolean;

  setSelectedNode: (node: Node<Scheduler.ITask> | null) => void;

  createJobDefinition: (
    jobDefinition: Scheduler.IJobDefinition
  ) => Promise<Scheduler.IJobDefinition>;

  updateJobDefinition: (
    jobDefinition: Scheduler.IJobDefinition
  ) => Promise<void>;

  deployJobDefinition: () => Promise<void>;

  createTask: (
    taskPayload: Scheduler.ITask,
    shouldSync?: boolean
  ) => Promise<void | Scheduler.ITask>;

  deleteTask: (task: Scheduler.ITask) => Promise<void>;

  deleteJobDefinition: (
    jobDefId: string
  ) => Promise<Scheduler.IDescribeJobDefinition>;

  runJob: (parameters: any) => Promise<void>;

  reRunJob: (runId: any) => Promise<void>;

  initializeStore: (initProps: Scheduler.IJobRunDetail) => void;

  syncStore: (initProps: Scheduler.IJobRunDetail) => void;

  hasUnsavedChanges: () => boolean;

  removeTaskNode: (task: Scheduler.ITask) => void;

  updateJobData: (data: Scheduler.IJobRunDetail) => void;

  updateTaskData: (data: Scheduler.ITask) => void;

  onAutoLayout: () => void;
};

export type StoreType = UseBoundStoreWithEqualityFn<StoreApi<RFState>>;

type StoreCreator = (initProps?: any) => StoreType;

const DEFAULT_PROPS = {
  nodes: [],

  edges: [],

  tasksById: {},

  taskRunsById: {},

  currentJob: null,

  selectedNodeId: null
};

const api = new WorkflowsService({});

const convertJob =
  (currentTasks: Scheduler.ITask[], currentEdges: Edge<EdgeData>[] = []) =>
  (data: Scheduler.ITask): Scheduler.ITask => {
    const taskMap = new Map(currentTasks.map(t => [t.nodeId, t]));

    const dependsOn = currentEdges
      .filter(edge => edge.target === data.nodeId && !edge.data?.deleting)
      .map(e => taskMap.get(e.source)?.id || '')
      .filter(Boolean);

    return {
      id: data.id,
      name: data.name,
      nodeId: data.nodeId,
      notebookParameters: data.notebookParameters,
      parameters: data.parameters,
      runtimeProperties: data.runtimeProperties,
      input_uri: data.input_uri,
      input_file_id: data.input_file_id,
      output_formats: data.output_formats,
      kernelSpecId: data.kernelSpecId,
      namespaceId: data.namespaceId,
      notificationEvents: data.notificationEvents,
      notificationEmails: data.notificationEmails,
      slackChannel: data.slackChannel || undefined,
      showOutputInEmail: data.showOutputInEmail,
      taskTimeout: data.taskTimeout,
      triggerRule: data.triggerRule,
      dependsOn
    };
  };

// TODO: Split this store into 2 stores, 1 for task view and the other for run view
const useZustandStore: StoreCreator = () => {
  return createWithEqualityFn<RFState>()(
    (set, get) => ({
      ...DEFAULT_PROPS,

      async onAutoLayout() {
        const { nodes, edges } = get();
        const positionedNodes = await getLayoutedElements(nodes, edges);

        set({ nodes: positionedNodes });
      },

      async initializeStore(initProps = emptyCreateJobDefinitionModel()) {
        const { tasks = [], task_runs = [], ...job_definition } = initProps;
        const newNodes = buildNodes(tasks);
        const newEdges = buildEdges(tasks);

        const positionedNodes = await getLayoutedElements(
          newNodes as Node[],
          newEdges
        );

        set({
          edges: newEdges,
          nodes: positionedNodes,
          currentJob: job_definition,
          tasksById: buildTasksMap(tasks),
          taskRunsById: buildTaskRunMap(task_runs)
        });
      },

      syncStore(initProps) {
        const { getAllTasks, tasksById, edges: previousEdges } = get();

        if (!initProps) {
          console.error('Cannot sync store with empty data', initProps);

          return;
        }

        const previousTasks = getAllTasks();

        const {
          tasks: currentTasks = [],
          task_runs = [],
          ...job_definition
        } = initProps;
        const taskNodeId = new Map(currentTasks.map(t => [t.id, t.nodeId]));

        // For easier lookup create a hashmap with nodeId as key and the task as value
        // The dependsOn property should be replaced with nodeId so we can easily create edges on the editor
        // even when a task is not saved to the server
        const updatedTasks = currentTasks.reduce(
          (result, task) => ({
            ...result,
            [task.nodeId]: {
              ...task,
              // Update the dependency graph from the client side tasks to the server response
              // These dependecies are created after the initial request was already on wire
              dependsOn: [
                ...new Set(
                  task.dependsOn.map(d => taskNodeId.get(d)).filter(Boolean)
                )
              ]
            }
          }),
          {}
        );

        // These are the tasks that are currently in the editor but are not yet saved to the server
        const unsavedTasks = previousTasks.filter(
          ({ id, nodeId }) =>
            !id && !updatedTasks[nodeId as keyof typeof updatedTasks]
        );

        // Latest edges from server
        const currentEdges = buildEdges(currentTasks.concat(unsavedTasks));
        const previousEdgeMap = new Map(previousEdges.map(e => [e.id, e]));

        const filteredEdges = currentEdges.map(currentEdge => {
          const previousEdge = previousEdgeMap.get(currentEdge.id);

          // If a previous edge with pending attribute matches with current edge's id, then it means
          // the edge was synced to server so we can ingore the pending attribute
          if (!previousEdge || previousEdge.data?.pending) {
            return currentEdge;
          }

          // If we are here then it must be a deleted or edge with no data attribute
          // If deleted edges are not yet synced to the server, keep the delete attribute of the edge data
          return previousEdge;
        });

        // These are the edges of tasks that are currently in the editor but are not yet saved to the server
        const unsavedEdges = previousEdges.filter(
          previous =>
            previous.data?.pending &&
            currentEdges.findIndex(current => current.id === previous.id) === -1
        );

        const nextEdges = filteredEdges.concat(unsavedEdges);

        set({
          currentJob: job_definition,
          edges: nextEdges,
          tasksById: { ...tasksById, ...updatedTasks },
          taskRunsById: buildTaskRunMap(task_runs)
        });
      },

      hasUnsavedChanges() {
        const { tasksById, edges } = get();

        const unsavedTasks = Object.keys(tasksById)
          .map(key => tasksById[key as keyof typeof tasksById])
          .filter(Boolean)
          .some(t => !t.id);

        const unsavedEdges = edges.some(
          e => e.data?.pending || e.data?.deleting
        );

        return unsavedTasks || unsavedEdges;
      },

      getAllTasks() {
        const { tasksById } = get();

        return Object.keys(tasksById)
          .map(key => tasksById[key as keyof typeof tasksById])
          .filter(Boolean);
      },

      getTaskRuns() {
        const { taskRunsById } = get();

        return Object.keys(taskRunsById)
          .map(key => taskRunsById[key as keyof typeof taskRunsById])
          .filter(Boolean);
      },

      getNodeData(nodeId: string) {
        const { tasksById } = get();

        return tasksById[nodeId as keyof typeof tasksById];
      },

      getSelectedNode() {
        const { selectedNodeId, getNodeData } = get();

        return !selectedNodeId ? undefined : getNodeData(selectedNodeId);
      },

      // TODO: Remove this unused function
      getSelectedRunNode() {
        const { selectedNodeId, getNodeData, taskRunsById } = get();
        const taskData = getNodeData(selectedNodeId || '');

        if (!taskData) {
          return undefined;
        }

        const taskRun =
          taskRunsById[taskData.id as keyof typeof taskRunsById] || {};

        // This is to handle cases when task run is not available for a given task
        // The dependsOn field from task should be used always as the nodeId is only available in task
        return (
          {
            ...taskRun,
            name: taskData.name,
            dependsOn: taskData.dependsOn,
            slackChannel: taskData.slackChannel,
            notificationEmails: taskData.notificationEmails,
            notificationEvents: taskData.notificationEvents
          } || {
            ...taskData,
            status: RunStatus.NOT_STARTED
          }
        );
      },

      updateJobData(formData) {
        set(({ currentJob = {} }) => ({
          currentJob: { ...currentJob, ...formData }
        }));
      },

      updateTaskData(taskData) {
        set(({ tasksById }) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { dependsOn: _, ...rest } = taskData;

          const updatedTask = {
            ...tasksById[taskData.nodeId as keyof typeof tasksById],
            ...rest
          };

          return {
            tasksById: {
              ...tasksById,
              [taskData.nodeId as string]: updatedTask
            }
          };
        });
      },

      async removeTaskNode(task: Scheduler.ITask) {
        const nodeId = task.nodeId;
        const { nodes, edges, tasksById } = get();

        const updatedTasksByIdMap = Object.keys(tasksById)
          .filter(key => key !== nodeId)
          .reduce(
            (result, key) => ({
              ...result,
              [key]: tasksById[key as keyof typeof tasksById]
            }),
            {}
          );

        const newNodes = nodes.filter(n => n.id !== nodeId);
        const newEdges = edges.filter(
          e => !(e.source === task.nodeId || e.target === task.nodeId)
        );

        const positionedNodes = await getLayoutedElements(newNodes, newEdges);

        set({
          edges: newEdges,
          nodes: positionedNodes,
          tasksById: updatedTasksByIdMap
        });
      },

      setSelectedNode(node) {
        set({ selectedNodeId: node?.id ?? null });
      },

      onNodesChange: changes => {
        set(({ nodes }) => ({
          nodes: applyNodeChanges(changes, nodes)
        }));
      },

      async onCreateNode(node) {
        const { nodes, edges, tasksById } = get();
        const { data, ...rest } = node;

        const newNode = {
          ...rest,
          selected: true
        };

        const updatedNodes = [
          ...nodes.map((n: any) => ({ ...n, selected: false })),
          newNode
        ];

        const positionedNodes = await getLayoutedElements(updatedNodes, edges);

        set({
          nodes: positionedNodes,
          selectedNodeId: node.id,
          tasksById: { ...tasksById, [node.id]: data }
        });
      },

      onEdgesChange: changes => {
        set(({ edges }) => ({ edges: applyEdgeChanges(changes, edges) }));
      },

      async onCreateEdge(edge, updateEdge = true) {
        const { nodes, edges, tasksById, isValidConnection } = get();

        if (!isValidConnection(edge)) {
          console.error(
            'Edge cannot be created due to invalid source/target',
            edge
          );

          return;
        }

        const { source = '', target } = edge;

        const id = `${source}-${target}`;

        if (!source) {
          return;
        }

        // If we are adding a connection for a previosuly deleted edge, then filter it now
        // so a new edge with pending data can be added in the next step
        const previousEdges = edges.filter(
          e => e.id !== `${edge.source}-${edge.target}`
        );

        // If a newedge is created on top of a delete edge, first check if the dependecy is already available
        const isNewEdge = !tasksById[
          target as keyof typeof tasksById
        ]?.dependsOn.includes(source || '');

        const newEdges = updateEdge
          ? addEdge(
              { ...edge, id, data: { pending: isNewEdge } },
              previousEdges
            )
          : previousEdges;

        const positionedNodes = await getLayoutedElements(nodes, newEdges);

        set({
          edges: newEdges,
          nodes: positionedNodes
        });
      },

      async onUpdateEdge(oldEdge, newEdge) {
        const { onCreateEdge, onEdgesDelete, edges } = get();

        // This happens when the action is cancelled or edge is dropped on same source or target
        if (
          oldEdge.target === newEdge.target &&
          oldEdge.source === newEdge.source
        ) {
          return;
        }

        onEdgesDelete([oldEdge]);
        onCreateEdge(newEdge, false);

        const oldEdgeId = `${oldEdge.source}-${oldEdge.target}`;
        const newEdgeId = `${newEdge.source}-${newEdge.target}`;

        const updateEdgeId = (edge: Edge) =>
          edge.id === oldEdgeId ? { ...edge, id: newEdgeId } : edge;

        // When an edge is updated, reactflow will assign a new random Id for the edge by default but we don't
        // need this as we want the edgeId to match the pattern `source-target` so we can update the dependsOn
        // field in a Node and control the edge
        const upadtedEdges = updateEdge(oldEdge, newEdge, edges, {
          shouldReplaceId: false
        });

        set({ edges: upadtedEdges.map(updateEdgeId) });
      },

      onEdgesDelete(edges) {
        const { edges: previousEdges } = get();
        // Create different map for edges based on id, source & target for easier lookup later
        const edgeIdLookup = new Map(edges.map(edge => [edge.id, edge]));

        // Updated existing edge data with delete attribute
        // If already pending is deleted, then remove the edge completely
        const newEdges = previousEdges
          .map(edge =>
            edgeIdLookup.has(edge.id)
              ? edge.data?.pending
                ? null
                : { ...edge, data: { deleting: true } }
              : edge
          )
          .filter(Boolean);

        // Go through each task and check if it's depends on property needs to be updated because
        // of a deleted edge. Use the previously created lookup map to check if the current task (target)
        // has a deleted dependency (source)

        set({ edges: newEdges as Edge[] });
      },

      isValidConnection(connection: Connection) {
        // we are using getNodes and getEdges helpers here
        // to make sure we create isValidConnection function only once
        const { nodes, edges, getNodeData } = get();
        const target = nodes.find(node => node.id === connection.target);
        const source = nodes.find(node => node.id === connection.source);
        const exists = edges.find(
          edge =>
            edge.source === connection.source &&
            edge.target === connection.target
        );

        if (!source || !target) {
          return false;
        }

        const sourceStatus = getNodeData(source.id)?.status;
        const targetStatus = getNodeData(target.id)?.status;

        // TODO: Veify if CREATING status should be included or not
        const isInValidStatus = [TaskStatus.FAILED_TO_CREATE].some(
          s =>
            !sourceStatus ||
            !targetStatus ||
            s === sourceStatus ||
            s === targetStatus
        );

        const hasCycle = (node: Node<Scheduler.ITask>, visited = new Set()) => {
          if (visited.has(node.id)) {
            return false;
          }

          visited.add(node.id);

          for (const outgoer of getOutgoers(node, nodes, edges)) {
            if (outgoer.id === connection.source) {
              return true;
            }

            if (hasCycle(outgoer, visited)) {
              return true;
            }
          }
        };

        // Allow re-creating edge for a previously deleted edge
        if (
          target.id === connection.source ||
          (exists && !exists.data?.deleting) ||
          isInValidStatus
        ) {
          return false;
        }

        return !hasCycle(target);
      },

      createJobDefinition(jobDefinition: Scheduler.IJobDefinition) {
        const { getAllTasks, updateJobData, edges } = get();
        const tasks = getAllTasks();

        updateJobData(jobDefinition as any);

        return api.createJobDefinition({
          ...jobDefinition,
          tasks: jobDefinition.tasks.map(convertJob(tasks, edges))
        });
      },

      updateJobDefinition(jobDefinition: Scheduler.IJobDefinition) {
        const { getAllTasks, updateJobData, edges, syncStore } = get();
        const tasks = getAllTasks();

        if (!jobDefinition?.job_definition_id) {
          return Promise.reject({ message: 'Invalid Job definition status' });
        }

        updateJobData(jobDefinition as any);

        return api
          .updateJobDefinition(jobDefinition?.job_definition_id, {
            ...jobDefinition,
            tasks: tasks.filter(t => !!t.id).map(convertJob(tasks, edges))
          })
          .then(data => data && syncStore(data as any));
      },

      deployJobDefinition() {
        const { getAllTasks, currentJob } = get();
        const tasks = getAllTasks();
        const { job_definition_id, status } = currentJob || {};
        const validTaskStatus = [TaskStatus.CREATED, TaskStatus.UPDATED];
        const validDeployStatus = [
          DeploymentStatus.CREATED,
          DeploymentStatus.UPDATED,
          DeploymentStatus.DEPLOYED,
          DeploymentStatus.FAILED_TO_DEPLOY
        ];

        const hasInvalidTask = tasks.some(
          t => validTaskStatus.indexOf(t.status as TaskStatus) === -1
        );

        const isWorkflowInValid =
          validDeployStatus.indexOf(status as DeploymentStatus) === -1;

        if (!job_definition_id) {
          return Promise.reject({ message: 'Invalid Job definition status' });
        }

        if (isWorkflowInValid) {
          return Promise.reject({ message: 'Invalid Job definition status' });
        }

        if (!tasks.length) {
          return Promise.reject({
            message: 'Workflows with no tasks cannot be deployed'
          });
        }

        if (hasInvalidTask) {
          return Promise.reject({
            message:
              'Some tasks are in failed state. Please save or remove them from the edtior before deploying'
          });
        }

        // TODO: Handle
        return api.deployJobDefinition(job_definition_id);
      },

      // TODO: Remove the shouldSync param and refactor this function
      createTask(taskPayload: Scheduler.ITask, shouldSync = true) {
        const { getAllTasks, currentJob, edges, syncStore, updateTaskData } =
          get();

        if (!currentJob?.job_definition_id) {
          return Promise.reject({ message: 'Invalid Job definition' });
        }

        const tasks = getAllTasks();

        updateTaskData(taskPayload);

        const payload = convertJob(tasks, edges)(taskPayload);

        if (taskPayload.id) {
          return api
            .updateTask(payload, currentJob.job_definition_id)
            .then(data => (shouldSync ? syncStore(data as any) : undefined));
        }

        return api
          .createTask(payload, currentJob.job_definition_id)
          .then(data => (shouldSync ? syncStore(data as any) : undefined));
      },

      deleteTask(task: Scheduler.ITask) {
        const { removeTaskNode, currentJob } = get();

        if (!currentJob?.job_definition_id) {
          return Promise.reject({ message: 'Invalid Job definition status' });
        }

        if (!task.id) {
          removeTaskNode(task);

          return Promise.resolve();
        }

        return api
          .deleteTask(task.id, currentJob?.job_definition_id)
          .then(() => removeTaskNode(task));
      },

      deleteJobDefinition(jobDefId: string) {
        return api.deleteJobDefinition(jobDefId);
      },

      runJob(payload: any) {
        const { currentJob } = get();

        if (!currentJob?.job_definition_id) {
          return Promise.reject({ message: 'Invalid Job definition' });
        }

        return api.runJob(currentJob?.job_definition_id, payload);
      },

      reRunJob(runId: any) {
        if (!runId) {
          return Promise.reject({
            message: 'Unexpected error: job runId is not found'
          });
        }

        return api.rerunJob(runId);
      }
    }),
    shallow
  );
};

export default useZustandStore;
