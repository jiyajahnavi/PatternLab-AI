import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useProblemStore } from '../../store/useProblemStore';

export const ProblemPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'problem' | 'hints' | 'notes' | 'solutions'>('problem');
  const { problem, notes, setNotes, revealedHints, revealHint } = useProblemStore();

  if (!problem) return <div className="p-4 text-muted">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-surface/50">
      <div className="flex border-b border-border text-sm shrink-0 bg-surface px-2">
        {['problem', 'hints', 'notes', 'solutions'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-3 capitalize border-b-2 transition-colors -mb-[1px] ${
              activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {tab}
            {tab === 'hints' && problem.hints.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-background text-[10px] border border-border">
                {revealedHints}/{problem.hints.length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'problem' && (
          <div className="prose prose-invert max-w-none text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {problem.description}
            </ReactMarkdown>
            
            {problem.examples.map((ex, idx) => (
              <div key={idx} className="mt-6">
                <h4 className="text-primary mb-2 font-semibold">Example {idx + 1}:</h4>
                <div className="bg-background border border-border p-4 rounded font-mono text-sm leading-relaxed">
                  <div><span className="text-muted">Input:</span> {ex.input}</div>
                  <div><span className="text-muted">Output:</span> {ex.output}</div>
                  {ex.explanation && (
                    <div className="mt-2 text-muted"><span className="text-primary">Explanation:</span> {ex.explanation}</div>
                  )}
                </div>
              </div>
            ))}

            <div className="mt-6">
              <h4 className="text-primary mb-2 font-semibold">Constraints:</h4>
              <ul className="list-disc pl-5 text-muted marker:text-accent">
                {problem.constraints.map((c, idx) => (
                  <li key={idx} className="mb-1">
                    <code className="bg-background px-1.5 py-0.5 rounded border border-border">{c}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'hints' && (
          <div className="space-y-4">
            {problem.hints.map((hint, idx) => (
              <div key={idx}>
                {idx < revealedHints ? (
                  <div className="p-4 border border-border rounded bg-surface">
                    <span className="font-bold text-accent text-xs uppercase tracking-wider mb-2 block">Hint {idx + 1}</span>
                    <div className="text-sm prose prose-invert">
                      <ReactMarkdown>{hint}</ReactMarkdown>
                    </div>
                  </div>
                ) : idx === revealedHints ? (
                  <button 
                    onClick={revealHint}
                    className="w-full p-4 border border-border rounded bg-surface/50 text-muted hover:text-primary hover:border-accent transition-colors text-sm font-medium"
                  >
                    Click to reveal Hint {idx + 1}
                  </button>
                ) : null}
              </div>
            ))}
            {revealedHints === problem.hints.length && problem.hints.length > 0 && (
              <div className="text-center text-xs text-muted mt-4">All hints revealed</div>
            )}
            {problem.hints.length === 0 && (
              <div className="text-muted text-sm">No hints available for this problem.</div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-full bg-background border border-border rounded p-4 resize-none focus:outline-none focus:border-accent text-sm"
            placeholder="Scratchpad for notes (auto-saved)..."
          />
        )}

        {activeTab === 'solutions' && (
          <div className="text-sm text-muted text-center py-10">
            <div className="mb-4 text-4xl">🔒</div>
            <p>Community solutions are hidden.</p>
            <p className="mt-2">Solve the problem or explicitly unlock to view.</p>
            <button className="mt-4 px-4 py-2 border border-border rounded hover:border-accent transition-colors text-primary">
              Unlock Solutions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
