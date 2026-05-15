import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, MessageSquare, RefreshCw, HelpCircle, FilePlus2 } from 'lucide-react';
import { useProblemStore } from '../../store/useProblemStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService } from '../../services/ai.service';

export const AIReviewPanel: React.FC = () => {
  const { problem, code, aiReview, setAIReview } = useProblemStore();
  const [showOptimization, setShowOptimization] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const handleQuickAction = async (actionPrompt: string) => {
    setIsLoadingAction(true);
    try {
      const prompt = `Regarding my code for ${problem?.title}: ${actionPrompt}. Code:\n\n${code}\n\nIMPORTANT: Do NOT provide any practice questions, follow-up problems, or JSON blocks. Only answer the prompt using standard markdown.`;
      const initialSummary = aiReview?.approachSummary ? aiReview.approachSummary + `\n\n---\n\n**${actionPrompt}**\n\n` : `**${actionPrompt}**\n\n`;
      
      await aiService.sendMessage([{ role: 'user', content: prompt }], (chunk) => {
        setAIReview({ 
          ...aiReview, 
          verdict: aiReview?.verdict || 'correct', // Ensure required fields
          approachSummary: initialSummary + chunk 
        });
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAction(false);
    }
  };

  if (!aiReview) return null;

  const verdictConfig = {
    correct: { icon: '✅', text: 'Correct', color: 'text-green-500', border: 'border-green-500/50' },
    wrong: { icon: '❌', text: 'Wrong Answer', color: 'text-red-500', border: 'border-red-500/50' },
    tle: { icon: '⏱', text: 'Time Limit Exceeded', color: 'text-yellow-500', border: 'border-yellow-500/50' },
    error: { icon: '💥', text: 'Runtime Error', color: 'text-red-500', border: 'border-red-500/50' },
  };

  const config = verdictConfig[aiReview.verdict] || verdictConfig.wrong;

  return (
    <div className="flex flex-col bg-surface border-b border-border max-h-[300px] shrink-0 animate-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <span>🔍 AI Review</span>
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
        <div className="flex items-center gap-4 text-xs">
          <button className="text-muted hover:text-primary transition-colors flex items-center gap-1">
            <RefreshCw size={12} /> Regenerate
          </button>
          <button onClick={() => setAIReview(null)} className="text-muted hover:text-primary transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm space-y-6">
        {/* Verdict Bar */}
        <div className="flex items-center gap-4 text-xs">
          <span className={`font-bold ${config.color}`}>{config.icon} {config.text}</span>
          <span className="text-muted border-l border-border pl-4">⚡ Time: {aiReview.timeComplexity || 'N/A'}</span>
          <span className="text-muted border-l border-border pl-4">💾 Space: {aiReview.spaceComplexity || 'N/A'}</span>
          {aiReview.optimizationPotential && (
            <span className="text-yellow-500 border-l border-border pl-4">
              ⚠️ {aiReview.optimizationPotential} {aiReview.targetComplexity && `to ${aiReview.targetComplexity}`}
            </span>
          )}
        </div>

        {/* Approach Feedback */}
        {aiReview.approachSummary && (
          <div className={`pl-3 border-l-2 ${config.border} space-y-1`}>
            <div className="text-muted uppercase text-[10px] font-bold tracking-wider mb-1">Approach Feedback</div>
            <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-background prose-pre:border prose-pre:border-border prose-code:text-accent prose-code:bg-accent/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:before:content-none prose-code:after:content-none max-w-none text-sm text-primary">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    return !inline ? (
                      <pre className={className} {...props}>
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {aiReview.approachSummary}
              </ReactMarkdown>
            </div>
            {aiReview.betterApproach && (
              <p className="text-muted mt-2">{aiReview.betterApproach}</p>
            )}
          </div>
        )}

        {/* Line Annotations Summary */}
        {aiReview.lineAnnotations && aiReview.lineAnnotations.length > 0 && (
          <div>
            <div className="text-muted uppercase text-[10px] font-bold tracking-wider mb-2 border-b border-border/50 pb-1">Line Annotations</div>
            <div className="space-y-2 font-mono text-xs">
              {aiReview.lineAnnotations.map((ann, idx) => {
                let icon = 'ℹ️';
                if (ann.severity === 'error') icon = '🔴';
                if (ann.severity === 'warning') icon = '⚠️';
                if (ann.severity === 'success') icon = '✅';

                return (
                  <div key={idx} className="flex gap-3 items-start bg-background/50 p-2 rounded border border-border">
                    <span className="text-muted shrink-0 w-12 text-right">Line {ann.line}</span>
                    <span>{icon}</span>
                    <span className="text-primary">{ann.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Optimization Suggestion */}
        {aiReview.optimizedCodeSkeleton && (
          <div>
            <button 
              onClick={() => setShowOptimization(!showOptimization)}
              className="flex items-center gap-1 text-xs font-bold text-muted hover:text-primary transition-colors uppercase tracking-wider mb-2 border-b border-border/50 pb-1 w-full text-left"
            >
              {showOptimization ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Optimization Suggestion
            </button>
            {showOptimization && (
              <div className="bg-background border border-border rounded p-3">
                {aiReview.optimizedHint && <p className="mb-3 text-accent">{aiReview.optimizedHint}</p>}
                <pre className="font-mono text-xs overflow-x-auto text-primary">
                  <code>{aiReview.optimizedCodeSkeleton}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Hints */}
        {aiReview.hints && aiReview.hints.length > 0 && (
          <div>
            <div className="text-muted uppercase text-[10px] font-bold tracking-wider mb-2 border-b border-border/50 pb-1">AI Hints</div>
            <div className="flex gap-2">
              {aiReview.hints.map((hint, idx) => (
                <div key={idx} className="flex-1">
                  {idx < revealedHints ? (
                    <div className="p-2 border border-border rounded bg-background text-xs prose prose-invert prose-p:my-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{hint}</ReactMarkdown>
                    </div>
                  ) : idx === revealedHints ? (
                    <button 
                      onClick={() => setRevealedHints(r => r + 1)}
                      className="w-full p-2 border border-border rounded bg-background/50 text-muted hover:text-primary transition-colors text-xs text-center"
                    >
                      Click to reveal Hint {idx + 1}
                    </button>
                  ) : (
                    <div className="w-full p-2 border border-border rounded bg-background/20 text-muted/30 text-xs text-center cursor-not-allowed">
                      Hint {idx + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/50 overflow-x-auto pb-1">
          {isLoadingAction ? (
            <div className="flex items-center gap-2 text-xs text-accent italic px-2">
              <RefreshCw className="animate-spin" size={12} /> AI is thinking...
            </div>
          ) : (
            <>
              <button onClick={() => handleQuickAction("Explain this approach in detail")} className="whitespace-nowrap px-3 py-1.5 rounded-full border border-border bg-background text-xs text-muted hover:text-primary hover:border-accent transition-colors flex items-center gap-1.5">
                <MessageSquare size={12} /> Explain this approach
              </button>
              <button onClick={() => handleQuickAction("Show an alternative approach")} className="whitespace-nowrap px-3 py-1.5 rounded-full border border-border bg-background text-xs text-muted hover:text-primary hover:border-accent transition-colors flex items-center gap-1.5">
                <RefreshCw size={12} /> Show alternative approach
              </button>
              <button onClick={() => handleQuickAction("Why is this O(n²)?")} className="whitespace-nowrap px-3 py-1.5 rounded-full border border-border bg-background text-xs text-muted hover:text-primary hover:border-accent transition-colors flex items-center gap-1.5">
                <HelpCircle size={12} /> Why is this O(n²)?
              </button>
              <button onClick={() => handleQuickAction("Give me edge cases to test")} className="whitespace-nowrap px-3 py-1.5 rounded-full border border-border bg-background text-xs text-muted hover:text-primary hover:border-accent transition-colors flex items-center gap-1.5">
                <FilePlus2 size={12} /> Add more test cases
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
