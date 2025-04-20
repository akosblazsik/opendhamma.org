// components/MarkdownEditor.tsx
'use client';
import dynamic from 'next/dynamic';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data'; // For code block languages
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
// Base styles might be needed depending on setup, but often handled by framework
// import 'codemirror/lib/codemirror.css';

// Dynamically import CodeMirror to avoid SSR issues
const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function MarkdownEditor({ value, onChange }: Props) {
  return (
    // Ensure parent container provides dimensions (h-full w-full)
    <div className="h-full w-full bg-[#1e1e1e] text-white text-sm">
      <CodeMirror
        value={value}
        height="100%" // Make editor fill the container
        theme={oneDark}
        extensions={[
          markdown({ base: markdownLanguage, codeLanguages: languages }), // Enable markdown highlighting with code block support
          EditorView.lineWrapping // Enable line wrapping
        ]}
        onChange={(val) => onChange(val)}
        // Common basic setup options
        basicSetup={{
          lineNumbers: true,      // Show line numbers
          foldGutter: true,       // Enable code folding
          highlightActiveLine: true, // Highlight the current line
          autocompletion: true,   // Basic autocompletion
          bracketMatching: true,  // Highlight matching brackets
        }}
      />
    </div>
  );
}