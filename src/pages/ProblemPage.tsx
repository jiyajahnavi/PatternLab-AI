import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

import { useProblemStore, mockProblem } from '../store/useProblemStore';
import { judge0Service } from '../services/judge0.service';
import { useProgressStore } from '../store/useProgressStore';
import { useReminderStore } from '../store/useReminderStore';
import { ProblemPanel } from '../components/ide/ProblemPanel';
import { CodeEditor } from '../components/ide/CodeEditor';
import { TestCasePanel } from '../components/ide/TestCasePanel';
import { AIReviewPanel } from '../components/ide/AIReviewPanel';

export const ProblemPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { solvedProblems } = useProgressStore();
  
  const { 
    problem, 
    setProblem, 
    code, 
    language, 
    testCases, 
    updateTestCase,
    setRunning,
    setSubmitting,
    aiReview,
    setAIReview
  } = useProblemStore();

  useEffect(() => {
    // If we navigated here from a QuestionCard, the store already has the problem loaded.
    // If it's missing (e.g., page refresh), fallback to mockProblem for demo purposes.
    const currentProblem = useProblemStore.getState().problem;
    if (!currentProblem || currentProblem.id !== id) {
      setProblem(mockProblem);
    }
  }, [id, setProblem]);

  const handleRun = async () => {
    setRunning(true);
    setAIReview(null);

    for (const tc of testCases) {
      try {
        const result = await judge0Service.runCode(code, language, tc.input, tc.expectedOutput);
        
        const actualOutput = result.stdout?.trim() || '';
        const expectedOutput = tc.expectedOutput.trim();
        
        // Robust comparison: remove spaces if it looks like a JSON array/object
        const normalize = (s: string) => s.replace(/\s/g, '');
        const passed = result.status.id === 3 && normalize(actualOutput) === normalize(expectedOutput);

        updateTestCase(tc.id, {
          actualOutput: actualOutput,
          error: result.stderr || (result.status.id !== 3 ? result.status.description : undefined),
          passed
        });
      } catch (error: any) {
        updateTestCase(tc.id, { error: error.message || 'Execution failed', passed: false });
      }
    }

    setRunning(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setAIReview(null);

    let allPassed = true;

    for (const tc of testCases) {
      try {
        const result = await judge0Service.runCode(code, language, tc.input, tc.expectedOutput);
        
        const actualOutput = result.stdout?.trim() || '';
        const expectedOutput = tc.expectedOutput.trim();
        
        const normalize = (s: string) => s.replace(/\s/g, '');
        const passed = result.status.id === 3 && normalize(actualOutput) === normalize(expectedOutput);
        
        if (!passed) {
          allPassed = false;
        }

        updateTestCase(tc.id, {
          actualOutput: actualOutput,
          error: result.stderr || (result.status.id !== 3 ? result.status.description : undefined),
          passed
        });
      } catch (error: any) {
        allPassed = false;
        updateTestCase(tc.id, { error: error.message || 'Execution failed', passed: false });
      }
    }

    setSubmitting(false);

    if (allPassed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7C6FF7', '#4ADE80', '#FACC15']
      });

      // Simulate AI Review for a correct submission
      setAIReview({
        verdict: 'correct',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        optimizationPotential: 'Already optimal',
        approachSummary: 'You used a hash map to achieve a single-pass O(n) solution. Excellent work!',
        lineAnnotations: [
          { line: 5, severity: 'success', message: 'Good use of early return inside the loop.', type: 'good_practice' }
        ]
      });

      if (problem) {
        useProgressStore.getState().recordProblemSolved(
          problem.topic || 'general', 
          problem.level as 1 | 2 | 3, 
          problem.id,
          problem.pattern
        );
        useReminderStore.getState().scheduleReminder(problem.id, problem.title, problem.topic || 'general');
      }
    } else {
      // Simulate AI Review for a wrong submission
      setAIReview({
        verdict: 'wrong',
        approachSummary: 'Your logic seems to have a gap. It might be returning the wrong indices or failing to find the complement.',
        hints: [
          "What if you stored the numbers you've seen so far?",
          "For each element x, check if (target - x) exists in your stored set."
        ],
        lineAnnotations: [
          { line: 4, severity: 'warning', message: 'Ensure you are checking for the complement, not the number itself.', type: 'logic' }
        ],
        optimizedCodeSkeleton: "def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = ___\n        if complement in seen:\n            return [___, i]\n        seen[___] = i"
      });
    }
  };

  if (!problem) return <div className="p-8 text-muted">Loading...</div>;

  return (
    <div className="h-full flex flex-col bg-background text-primary">
      {/* Topbar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-surface shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="hover:text-accent transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="font-bold">{problem.title}</div>
          {solvedProblems.includes(problem.id) && (
            <div className="flex items-center gap-1 text-accent text-xs font-bold bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
              <CheckCircle2 size={12} /> Solved
            </div>
          )}
          <div className={`px-2 py-0.5 rounded text-xs border ${
            problem.level === 1 ? 'bg-green-500/10 text-green-500 border-green-500/20' :
            problem.level === 2 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
            'bg-accent/10 text-accent border-accent/20'
          }`}>
            {problem.level === 1 ? 'Easy' : problem.level === 2 ? 'Medium' : 'Hard'}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-muted text-sm">00:00:00</div>
        </div>
      </div>

      {/* Main Split Area */}
      <Group orientation="horizontal" className="flex-1 overflow-hidden">
        {/* Left Panel */}
        <Panel defaultSize={40} minSize={30}>
          <ProblemPanel />
        </Panel>

        <Separator className="w-1 bg-border hover:bg-accent transition-colors" />

        {/* Right Panel */}
        <Panel defaultSize={60} minSize={30} className="flex flex-col relative">
          <Group orientation="vertical">
            {/* Editor */}
            <Panel defaultSize={aiReview ? 40 : 65} minSize={20}>
              <CodeEditor />
            </Panel>

            {aiReview && (
              <>
                <Separator className="h-1 bg-border hover:bg-accent transition-colors" />
                <Panel defaultSize={35} minSize={20}>
                  <AIReviewPanel />
                </Panel>
              </>
            )}

            <Separator className="h-1 bg-border hover:bg-accent transition-colors" />

            {/* Test Cases */}
            <Panel defaultSize={aiReview ? 25 : 35} minSize={15}>
              <TestCasePanel onRun={handleRun} onSubmit={handleSubmit} />
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  );
};
