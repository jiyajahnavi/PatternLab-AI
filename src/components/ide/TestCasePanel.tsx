import React, { useState } from 'react';
import { Play, CheckCircle, Loader2 } from 'lucide-react';
import { useProblemStore } from '../../store/useProblemStore';

interface TestCasePanelProps {
  onRun: () => void;
  onSubmit: () => void;
}

export const TestCasePanel: React.FC<TestCasePanelProps> = ({ onRun, onSubmit }) => {
  const [outputTab, setOutputTab] = useState<'testcases' | 'console'>('testcases');
  const { 
    testCases, 
    activeTestCaseId, 
    setActiveTestCaseId, 
    isRunning, 
    isSubmitting 
  } = useProblemStore();

  const activeTestCase = testCases.find(tc => tc.id === activeTestCaseId) || testCases[0];

  return (
    <div className="flex flex-col h-full bg-surface/50">
      <div className="flex border-b border-border text-sm shrink-0 bg-surface justify-between items-center pr-4">
        <div className="flex">
          {['testcases', 'console'].map(tab => (
            <button 
              key={tab}
              onClick={() => setOutputTab(tab as any)}
              className={`px-4 py-2 capitalize border-t-2 border-t-transparent border-b-2 transition-colors ${
                outputTab === tab ? 'border-b-accent text-accent' : 'border-b-transparent text-muted hover:text-primary'
              }`}
            >
              {tab === 'testcases' ? 'Test Cases' : 'Console'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onRun}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1 bg-surface border border-border px-3 py-1 text-xs rounded hover:border-accent transition-colors disabled:opacity-50"
          >
            {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} 
            Run
          </button>
          <button 
            onClick={onSubmit}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1 bg-accent text-background px-3 py-1 text-xs rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} 
            Submit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm font-mono">
        {outputTab === 'testcases' && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {testCases.map((tc, idx) => {
                let badgeClass = 'border-transparent text-muted';
                if (tc.passed === true) badgeClass = 'border-green-500/50 text-green-500 bg-green-500/10';
                if (tc.passed === false) badgeClass = 'border-red-500/50 text-red-500 bg-red-500/10';
                if (tc.id === activeTestCaseId) {
                  badgeClass += ' ring-1 ring-accent text-primary';
                }

                return (
                  <button 
                    key={tc.id}
                    onClick={() => setActiveTestCaseId(tc.id)}
                    className={`px-3 py-1 rounded bg-surface border shrink-0 transition-all ${badgeClass}`}
                  >
                    Case {idx + 1}
                  </button>
                );
              })}
            </div>

            {activeTestCase && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="text-xs text-muted mb-1 font-semibold uppercase tracking-wider">Input:</div>
                <div className="p-3 bg-background border border-border rounded mb-4 whitespace-pre-wrap">
                  {activeTestCase.input}
                </div>
                
                <div className="text-xs text-muted mb-1 font-semibold uppercase tracking-wider">Expected Output:</div>
                <div className="p-3 bg-background border border-border rounded mb-4 whitespace-pre-wrap">
                  {activeTestCase.expectedOutput}
                </div>

                {activeTestCase.actualOutput !== undefined && (
                  <>
                    <div className={`text-xs mb-1 font-semibold uppercase tracking-wider ${activeTestCase.passed ? 'text-green-500' : 'text-red-500'}`}>
                      Actual Output:
                    </div>
                    <div className={`p-3 bg-background border rounded mb-4 whitespace-pre-wrap ${activeTestCase.passed ? 'border-green-500/30' : 'border-red-500/30'}`}>
                      {activeTestCase.actualOutput}
                    </div>
                  </>
                )}

                {activeTestCase.error && (
                  <>
                    <div className="text-xs text-red-500 mb-1 font-semibold uppercase tracking-wider">Error:</div>
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 whitespace-pre-wrap">
                      {activeTestCase.error}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {outputTab === 'console' && (
          <div className="h-full flex flex-col">
            {testCases.some(tc => tc.actualOutput !== undefined || tc.error) ? (
              <div className="space-y-4">
                {testCases.map((tc, idx) => (
                  (tc.actualOutput || tc.error) && (
                    <div key={idx} className="border-b border-border/50 pb-4 last:border-0">
                      <div className="text-muted text-xs mb-1">Case {idx + 1}:</div>
                      {tc.actualOutput && <div className="text-primary">{tc.actualOutput}</div>}
                      {tc.error && <div className="text-red-400">{tc.error}</div>}
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-muted italic flex-1 flex items-center justify-center">
                Run code to see console output...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
