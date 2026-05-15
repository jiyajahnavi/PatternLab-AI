import React, { useState, useRef, useEffect } from 'react';
import { Send, Hash, MessageSquarePlus, Trash2, Loader2, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/useSettingsStore';
import { aiService } from '../services/ai.service';
import { QuestionCard } from '../components/chat/QuestionCard';
import { useChatStore, type ChatMessage } from '../store/useChatStore';
import { useVisualizerStore, detectDSTopic, isExplainRequest, getDryRunSteps, DS_LABELS, type DSType } from '../store/useVisualizerStore';

export const ChatPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [detectedTopic, setDetectedTopic] = useState<DSType | null>(null);
  const [shouldAutoVisualize, setShouldAutoVisualize] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { setTopic } = useVisualizerStore();
  
  const { preferredLanguage, model } = useSettingsStore();
  const { 
    sessions, 
    activeSessionId, 
    createSession, 
    addMessage, 
    updateLastMessage, 
    setActiveSession, 
    deleteSession 
  } = useChatStore();

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [
    { role: 'assistant', content: "Ask PatternLab anything. Start with: 'explain binary search'" } as ChatMessage
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping]); // scroll on new messages or typing start

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsgContent = input.trim();
    setInput('');
    setIsTyping(true);

    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      currentSessionId = createSession(userMsgContent);
    }

    const userMessage: ChatMessage = { role: 'user', content: userMsgContent };
    addMessage(currentSessionId, userMessage);

    const messageHistory = useChatStore.getState().sessions.find(s => s.id === currentSessionId)?.messages || [userMessage];

    try {
      // Add empty assistant message that will be streamed into
      addMessage(currentSessionId, { role: 'assistant', content: '' });
      
      await aiService.sendMessage(messageHistory, (chunk) => {
        updateLastMessage(currentSessionId!, chunk);
      });
    } catch (error: any) {
      updateLastMessage(currentSessionId!, `**Error:** ${error.message}`);
    } finally {
      setIsTyping(false);
      const detected = detectDSTopic(userMsgContent);
      const isExplain = isExplainRequest(userMsgContent);
      setDetectedTopic(detected);
      setShouldAutoVisualize(isExplain && !!detected);
    }
  };

  // Auto-navigate to visualizer when explain+DS detected
  useEffect(() => {
    if (shouldAutoVisualize && detectedTopic && !isTyping) {
      const lastAIMsg = useChatStore.getState().sessions
        .find(s => s.id === activeSessionId)?.messages
        .filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
      const steps = getDryRunSteps(detectedTopic);
      setTopic(detectedTopic, lastAIMsg.slice(0, 800), steps);
      setShouldAutoVisualize(false);
      // Small delay so user sees the chat response first
      setTimeout(() => navigate('/visualizer'), 2200);
    }
  }, [shouldAutoVisualize, detectedTopic, isTyping]);

  const handleVisualize = () => {
    if (detectedTopic) {
      const lastAIMsg = useChatStore.getState().sessions
        .find(s => s.id === activeSessionId)?.messages
        .filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
      const steps = getDryRunSteps(detectedTopic);
      setTopic(detectedTopic, lastAIMsg.slice(0, 800), steps);
      navigate('/visualizer');
    }
  };

  const handleNewChat = () => {
    setActiveSession(null);
  };

  return (
    <div className="flex h-full bg-background text-primary">
      {/* Session Sidebar */}
      <div className="w-64 border-r border-border bg-surface p-4 hidden md:flex flex-col h-full">
        <button 
          onClick={handleNewChat}
          className="flex items-center justify-center gap-2 w-full py-2 bg-accent text-background rounded-md font-medium mb-6 hover:opacity-90 transition-opacity"
        >
          <MessageSquarePlus size={18} /> New Chat
        </button>
        <div className="text-xs text-muted font-bold tracking-wider mb-3">RECENT SESSIONS</div>
        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1">
          {sessions.length === 0 ? (
            <div className="text-xs text-muted/50 italic text-center mt-4">No previous sessions</div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`group flex items-center justify-between p-2 rounded cursor-pointer border transition-colors ${
                  activeSessionId === session.id 
                    ? 'bg-accent/10 border-accent/20 text-accent' 
                    : 'bg-transparent border-transparent hover:bg-background/50 text-muted'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <Hash size={14} className="shrink-0" />
                  <span className="text-sm truncate">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative pb-8 h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-surface border border-border' 
                  : 'bg-transparent border border-border shadow-sm'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    msg.role === 'user' ? 'bg-muted text-background' : 'bg-accent text-background'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </div>
                  <span className="text-xs font-mono text-muted">{msg.role === 'user' ? 'You' : 'PatternLab'}</span>
                </div>
                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-background prose-pre:border prose-pre:border-border prose-code:text-accent prose-code:bg-accent/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:before:content-none prose-code:after:content-none max-w-none text-sm">
                  {msg.content ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const isJson = match && match[1] === 'json';
                          
                          if (!inline && isJson) {
                            try {
                              const parsed = JSON.parse(String(children).replace(/\n$/, ''));
                              if (parsed.id && parsed.title && parsed.level) {
                                return <QuestionCard question={parsed} />;
                              }
                            } catch (e) {
                              // Fallback to normal code block
                            }
                          }

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
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 text-muted italic">
                      <Loader2 className="animate-spin text-accent" size={16} />
                      Thinking...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 bg-background border-t border-border mt-auto shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about a DSA topic or pattern..."
              className="w-full bg-surface border border-border rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-accent resize-none h-24"
              disabled={isTyping}
            />
            <button 
              onClick={handleSend}
              className="absolute right-3 bottom-3 p-2 bg-accent text-background rounded-md hover:opacity-90 transition-opacity"
            >
              <Send size={16} />
            </button>
            <div className="absolute left-4 -bottom-6 flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1 cursor-pointer hover:text-primary">
                Language: {preferredLanguage}
              </span>
              <span className="flex items-center gap-1 cursor-pointer hover:text-primary">
                Model: {model}
              </span>
              {detectedTopic && !isTyping && (
                <button
                  onClick={handleVisualize}
                  className="flex items-center gap-1.5 text-accent border border-accent/30 bg-accent/10 px-2 py-0.5 rounded-full hover:bg-accent/20 transition-colors font-medium"
                >
                  <Cpu size={11} />
                  Visualize {DS_LABELS[detectedTopic]}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
