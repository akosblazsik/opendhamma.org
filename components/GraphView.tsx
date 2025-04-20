// components/GraphView.tsx
'use client';
import ReactFlow, { Background, Node, Edge, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

interface Props {
  centerLabel: string;
  links: string[];
}

export default function GraphView({ centerLabel, links }: Props) {
  const nodes: Node[] = [
    {
      id: 'center',
      data: { label: centerLabel },
      position: { x: 250, y: 150 },
      style: { backgroundColor: '#569cd6', color: '#ffffff', border: 'none' },
    },
    ...links.map((label, i) => ({
      id: `link-${i}`,
      data: { label },
      position: { x: 100 + i * 150, y: 300 },
      style: { backgroundColor: '#c586c0', color: '#ffffff', border: 'none' },
    }))
  ];

  const edges: Edge[] = links.map((_, i) => ({
    id: `e-${i}`,
    source: 'center',
    target: `link-${i}`,
    animated: true,
    style: { stroke: '#d4d4d4' },
  }));

  return (
    <div className="h-full bg-[#252526]">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background color="#202020" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
