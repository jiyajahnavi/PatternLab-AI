import React, { useRef, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useProblemStore } from '../../store/useProblemStore';

export const CodeEditor: React.FC = () => {
  const { code, setCode, language, setLanguage, aiReview } = useProblemStore();
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (monaco && editorRef.current && aiReview?.lineAnnotations) {
      const decorations = aiReview.lineAnnotations.map(ann => {
        let className = 'bg-blue-500/20 border-l-2 border-blue-500';
        let glyphClass = 'bg-blue-500 rounded-full w-2 h-2 ml-1 mt-1';
        
        if (ann.severity === 'error') {
          className = 'bg-red-500/20 border-l-2 border-red-500';
          glyphClass = 'bg-red-500 rounded-full w-2 h-2 ml-1 mt-1';
        } else if (ann.severity === 'warning') {
          className = 'bg-yellow-500/20 border-l-2 border-yellow-500';
          glyphClass = 'bg-yellow-500 rounded-full w-2 h-2 ml-1 mt-1';
        } else if (ann.severity === 'success') {
          className = 'bg-green-500/20 border-l-2 border-green-500';
          glyphClass = 'bg-green-500 rounded-full w-2 h-2 ml-1 mt-1';
        }

        return {
          range: new monaco.Range(ann.line, 1, ann.line, 1),
          options: {
            isWholeLine: true,
            className: className,
            glyphMarginClassName: glyphClass,
            hoverMessage: { value: `**${ann.severity.toUpperCase()}**: ${ann.message}` }
          }
        };
      });

      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, decorations);
    } else if (editorRef.current && decorationsRef.current.length > 0) {
      // Clear decorations if no review
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  }, [monaco, aiReview]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="h-10 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 text-sm">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-background border border-border rounded px-2 py-1 outline-none text-xs text-primary capitalize hover:border-accent transition-colors cursor-pointer"
        >
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="javascript">JavaScript</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
        </select>
        <div className="flex gap-2">
          <button 
            onClick={() => setCode('// Write your solution here\n')}
            className="text-muted hover:text-primary transition-colors text-xs border border-border px-2 py-1 rounded"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono',
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            glyphMargin: true, // required for gutter decorations
            smoothScrolling: true,
            cursorBlinking: "smooth",
          }}
        />
      </div>
    </div>
  );
};
