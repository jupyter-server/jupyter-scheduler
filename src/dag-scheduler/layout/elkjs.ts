import ELK, { ElkNode } from 'elkjs/lib/elk.bundled.js';
import { Edge, Node } from 'reactflow';

const elk = new ELK();

const defaultOptions = {
  'elk.direction': 'RIGHT',
  'elk.algorithm': 'layered',
  'elk.spacing.nodeNode': 50,
  'elk.spacing.componentComponent': 100,
  'elk.layered.spacing.edgeNodeBetweenLayers': 50,
  'elk.layered.spacing.nodeNodeBetweenLayers': 100,
  'elk.layered.mergeEdges': true,
  'elk.layered.mergeHierarchyEdges': false
};

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  options: Record<string, any> = {}
): Promise<any[]> => {
  const layoutOptions = { ...defaultOptions, ...options };

  const graph = {
    id: 'task-editor',
    edges: edges,
    layoutOptions: layoutOptions,
    children: nodes.map(node => {
      return {
        ...node,
        id: node.id,
        width: node.width ?? 300,
        height: node.height ?? 150
      } as ElkNode;
    })
  };

  return elk.layout(graph as any).then(({ children }: any) => {
    // By mutating the children in-place we saves ourselves from creating a
    // needless copy of the nodes array.
    children.forEach((node: any) => {
      node.position = { x: node.x, y: node.y };
    });

    return children;
  });
};
