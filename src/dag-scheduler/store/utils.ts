import { Edge, Node } from 'reactflow';
import { Scheduler } from '../handler';

export const buildNodes = (tasks: Scheduler.ITask[] = []): Node[] => {
  return tasks.map((task: Scheduler.ITask, index) => ({
    data: {},
    id: task.nodeId || task.id || '',
    type: 'custom',
    position: { x: 0, y: 0 }
  }));
};

export const buildEdges = (tasks: Scheduler.ITask[]): Edge[] => {
  // For unsaved nodes id would be empty so use nodeId instead
  const taskNodeId = new Map(tasks.map(t => [t.id || t.nodeId, t.nodeId]));
  const getId = (id: string) => (id ? taskNodeId.get(id) : id) || '';

  // Filter out nodes that has incorrect depends on value
  const edges = tasks.flatMap(t =>
    [...new Set(t.dependsOn.filter(Boolean))]
      .map(d => ({
        source: getId(d),
        target: t.nodeId,
        id: `${getId(d)}-${t.nodeId}`
      }))
      .filter(e => e.source && e.target)
  );

  return edges;
};

export const buildTasksMap = (
  tasks: Scheduler.ITask[]
): Record<string, Scheduler.ITask> => {
  const taskNodeId = new Map(tasks.map(t => [t.id, t.nodeId]));

  return tasks?.reduce(
    (result, task: Scheduler.ITask) => ({
      ...result,
      [task.nodeId || (task.id as string)]: {
        ...task,
        dependsOn: task.dependsOn.map(d => taskNodeId.get(d)).filter(Boolean)
      } as Scheduler.ITask
    }),
    {}
  );
};

export const buildTaskRunMap = (
  tasks: Scheduler.ITaskRun[]
): Record<string, Scheduler.ITaskRun> => {
  return tasks?.reduce(
    (result, task: Scheduler.ITaskRun) => ({
      ...result,
      [task.taskId]: task
    }),
    {}
  );
};
