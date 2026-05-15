import React from 'react';
import { Cpu, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVisualizerStore, getDryRunSteps, type DSType } from '../../store/useVisualizerStore';

interface VisualizerCardProps {
  visualization: {
    topic: DSType;
    title: string;
    description: string;
    steps?: any[];
  };
}

export const VisualizerCard: React.FC<VisualizerCardProps> = ({ visualization }) => {
  const navigate = useNavigate();
  const { setTopic } = useVisualizerStore();

  const handleVisualize = () => {
    const steps = visualization.steps || getDryRunSteps(visualization.topic);
    setTopic(visualization.topic, visualization.description, steps);
    navigate('/visualizer');
  };

  return (
    <div className="my-6 bg-accent/5 border border-accent/20 rounded-2xl overflow-hidden group hover:border-accent/40 transition-all shadow-lg shadow-accent/5">
      <div className="flex items-stretch">
        <div className="w-16 bg-accent/10 flex items-center justify-center border-r border-accent/10">
          <div className="p-2 bg-accent rounded-lg text-background shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
            <Cpu size={20} />
          </div>
        </div>
        <div className="flex-1 p-5">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-accent font-bold text-base mb-1">{visualization.title}</h3>
              <p className="text-muted text-xs leading-relaxed max-w-md italic">
                {visualization.description}
              </p>
            </div>
            <button 
              onClick={handleVisualize}
              className="px-4 py-2 bg-accent text-background rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-accent/20"
            >
              Launch Visualizer <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      <div className="bg-accent/5 px-5 py-2 flex items-center justify-between border-t border-accent/10">
        <span className="text-[10px] font-bold text-accent/60 uppercase tracking-widest">Interactive Lab Available</span>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-accent/40 rounded-full animate-pulse" />
          <div className="w-1 h-1 bg-accent/40 rounded-full animate-pulse [animation-delay:200ms]" />
          <div className="w-1 h-1 bg-accent/40 rounded-full animate-pulse [animation-delay:400ms]" />
        </div>
      </div>
    </div>
  );
};
