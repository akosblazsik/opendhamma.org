// components/MarkdownEditor.tsx
'use client';
import dynamic from 'next/dynamic';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function MarkdownEditor({ value, onChange }: Props) {
  return (
    <div className="h-full w-full bg-[#1e1e1e] overflow-auto">
      <CodeMirror
        value={value}
        height="100%"
        basicSetup={{ lineNumbers: true }}
        theme={oneDark}
        extensions={[markdown(), EditorView.lineWrapping]}
        onChange={(val) => onChange(val)}
      />
    </div>
  );
}