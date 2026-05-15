import React from 'react';
import { Play, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProblemStore, type Problem } from '../../store/useProblemStore';

interface QuestionCardProps {
  question: Problem;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const navigate = useNavigate();
  const { setProblem } = useProblemStore();

  const handleSolve = () => {
    setProblem(question);
    navigate(`/problem/${question.id}`);
  };

  const levelStyles = {
    1: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Easy', time: '~10 mins' },
    2: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Medium', time: '~25 mins' },
    3: { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', label: 'Hard', time: '~40 mins' },
  };

  const style = levelStyles[question.level as 1|2|3] || levelStyles[1];

  return (
    <div className={`my-4 bg-surface/50 border border-border rounded-xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-black/20 border-l-[3px]`} style={{ borderLeftColor: style.color.replace('text-', 'bg-') }}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-primary text-base mb-1 truncate">{question.title}</h3>
          <p className="text-muted text-xs line-clamp-2 leading-relaxed break-words">
            {question.description.substring(0, 150)}...
          </p>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border ${style.bg} ${style.color} ${style.border}`}>
          {style.label}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 pt-3 border-t border-border/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <span className="px-2 py-0.5 rounded bg-background border border-border truncate max-w-[120px]">{question.topic}</span>
            <span className="px-2 py-0.5 rounded bg-background border border-border truncate max-w-[120px]">{question.pattern}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted whitespace-nowrap">
            <Clock size={12} /> {style.time}
          </div>
        </div>
        <button 
          onClick={handleSolve}
          className="flex items-center gap-1.5 bg-accent text-background px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <Play size={12} /> Solve
        </button>
      </div>
    </div>
  );
};
