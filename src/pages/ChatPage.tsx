import React, { useState, useRef, useEffect } from 'react';
import { Send, Hash, MessageSquarePlus, Trash2, Cpu, User, Volume2, VolumeX, Mic, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore, type MentorMode } from '../store/useSettingsStore';
import { aiService } from '../services/ai.service';
import { QuestionCard } from '../components/chat/QuestionCard';
import { VisualizerCard } from '../components/chat/VisualizerCard';
import { useChatStore, type ChatMessage } from '../store/useChatStore';
import { useVisualizerStore, detectDSTopic, isExplainRequest, getDryRunSteps, DS_LABELS, type DSType } from '../store/useVisualizerStore';
import { BookOpen, GraduationCap, Bug, Zap, Repeat } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [detectedTopic, setDetectedTopic] = useState<DSType | null>(null);
  const [shouldAutoVisualize, setShouldAutoVisualize] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { setTopic } = useVisualizerStore();
  
  const { preferredLanguage, model, mentorMode, setMentorMode } = useSettingsStore();
  const { 
    sessions, 
    activeSessionId, 
    createSession, 
    addMessage, 
    updateLastMessage, 
    setActiveSession, 
    deleteSession 
  } = useChatStore();

  const MENTOR_MODES: { id: MentorMode; label: string; icon: any; color: string; desc: string }[] = [
    { id: 'learn', label: 'Learn', icon: BookOpen, color: 'text-blue-400', desc: 'Slow, visual, heavy hints' },
    { id: 'interview', label: 'Interview', icon: GraduationCap, color: 'text-purple-400', desc: 'Mock FAANG interview' },
    { id: 'debug', label: 'Debug', icon: Bug, color: 'text-red-400', desc: 'Focus on bugs & edge cases' },
    { id: 'optimization', label: 'Optimize', icon: Zap, color: 'text-yellow-400', desc: 'Complexity & tradeoffs' },
    { id: 'revision', label: 'Revision', icon: Repeat, color: 'text-green-400', desc: 'Quiz from weak topics' },
  ];

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

  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    // Remove markdown characters for cleaner speech
    const cleanText = text.replace(/[*#`_]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="flex h-full bg-background text-primary">
      {/* Session Sidebar */}
      <div className="w-64 border-r border-border bg-surface p-4 hidden md:flex flex-col h-full">
        <button 
          onClick={handleNewChat}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-accent text-background rounded-xl font-bold mb-6 hover:opacity-90 transition-all shadow-lg shadow-accent/20 active:scale-95"
        >
          <MessageSquarePlus size={18} /> New Chat
        </button>

        <div className="text-xs text-muted font-bold tracking-wider mb-3">MENTOR MODE</div>
        <div className="flex flex-col gap-1.5 mb-8">
          {MENTOR_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setMentorMode(mode.id)}
              className={`group flex flex-col p-2.5 rounded-xl border transition-all text-left ${
                mentorMode === mode.id 
                  ? 'bg-accent/10 border-accent/30 shadow-inner' 
                  : 'bg-transparent border-transparent hover:bg-surface-lighter text-muted'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <mode.icon size={16} className={mentorMode === mode.id ? mode.color : 'text-muted group-hover:text-primary'} />
                <span className={`text-xs font-bold uppercase tracking-tight ${mentorMode === mode.id ? 'text-primary' : ''}`}>
                  {mode.label}
                </span>
              </div>
              <p className="text-[10px] leading-tight text-muted/60">{mode.desc}</p>
            </button>
          ))}
        </div>

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
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`relative flex flex-col gap-2 ${
                msg.role === 'user' 
                  ? 'max-w-[75%] items-end' 
                  : 'max-w-[95%] md:max-w-[85%] items-start w-full'
              }`}>
                {/* Message Header/Avatar */}
                <div className={`flex items-center gap-2 mb-1 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-lg ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-muted to-muted/50 text-background order-2' 
                      : 'bg-gradient-to-br from-accent to-accent/60 text-background'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Cpu size={16} />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'} text-muted`}>
                      {msg.role === 'user' ? 'You' : 'PatternLab AI'}
                    </span>
                    {msg.role === 'assistant' && msg.content && (
                      <button 
                        onClick={() => handleSpeak(msg.content)}
                        className={`p-1 rounded-full transition-colors ml-1 ${
                          isSpeaking ? 'bg-accent/20 text-accent animate-pulse' : 'hover:bg-accent/10 text-muted hover:text-accent'
                        }`}
                        title={isSpeaking ? "Stop reading" : "Read aloud"}
                      >
                        {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Bubble */}
                <div className={`relative p-5 rounded-2xl shadow-xl transition-all ${
                  msg.role === 'user' 
                    ? 'bg-accent text-background rounded-tr-none' 
                    : 'bg-surface/50 border border-border/50 backdrop-blur-sm rounded-tl-none w-full'
                }`}>
                  {/* AI response specific background effect */}
                  {msg.role === 'assistant' && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  )}

                  <div className={`max-w-none ${
                    msg.role === 'user' 
                      ? 'text-sm font-medium leading-relaxed' 
                      : 'prose prose-invert prose-p:leading-8 prose-p:mb-4 prose-headings:mb-3 prose-headings:text-primary prose-strong:text-accent prose-ul:my-4 prose-li:my-1 text-sm md:text-base'
                  }`}>
                    {msg.content ? (
                      <>
                        {/* Claude-style Clarifications at the Top */}
                        {msg.role === 'assistant' && msg.content.includes('[CLARIFICATIONS:') && (
                          <div className="mb-6 bg-accent/5 border border-accent/20 p-4 rounded-xl animate-in fade-in slide-in-from-top-1 duration-500">
                            <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                              <HelpCircle size={12} /> To give you the best answer, should I:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(() => {
                                const match = msg.content.match(/\[CLARIFICATIONS: (.*?)\]/s);
                                if (!match) return null;
                                try {
                                  const clarifications = JSON.parse(`[${match[1]}]`);
                                  return (clarifications as string[]).map((q, qIdx) => (
                                    <button
                                      key={qIdx}
                                      onClick={() => setInput(q)}
                                      className="px-3 py-1.5 bg-background border border-border hover:border-accent hover:text-accent rounded-lg text-xs font-medium transition-all"
                                    >
                                      {q}
                                    </button>
                                  ));
                                } catch (e) { return null; }
                              })()}
                            </div>
                          </div>
                        )}

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
                                  if (parsed.type === 'visualization' && parsed.topic) {
                                    return <VisualizerCard visualization={parsed} />;
                                  }
                                } catch (e) {
                                  // Fallback
                                }
                              }

                              return !inline ? (
                                <div className="relative group my-6">
                                  <div className="absolute -top-3 left-4 px-2 py-1 bg-background border border-border rounded text-[10px] font-bold text-muted uppercase tracking-widest z-10">
                                    {match ? match[1] : 'code'}
                                  </div>
                                  <pre className={`${className} bg-background/80 p-5 rounded-xl border border-border/50 overflow-x-auto custom-scrollbar`} {...props}>
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  </pre>
                                </div>
                              ) : (
                                <code className="bg-accent/10 text-accent px-1.5 py-0.5 rounded-md font-mono text-xs border border-accent/20" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {msg.role === 'assistant' 
                            ? msg.content
                                .replace(/\[CLARIFICATIONS: .*?\]/s, '')
                                .replace(/\[SUGGESTIONS: .*?\]/s, '')
                                .replace(/\[MEMORY: .*?\]/s, '')
                                .trim()
                            : msg.content
                          }
                        </ReactMarkdown>

                        {/* Claude-style Optional Suggestions */}
                        {msg.role === 'assistant' && msg.content.includes('[SUGGESTIONS:') && (
                          <div className="mt-8 flex flex-wrap gap-2 border-t border-border/30 pt-6 animate-in fade-in slide-in-from-top-2 duration-700">
                            {(() => {
                              const match = msg.content.match(/\[SUGGESTIONS: (.*?)\]/s);
                              if (!match) return null;
                              try {
                                const suggestions = JSON.parse(`[${match[1]}]`);
                                return (suggestions as string[]).map((suggestion, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => {
                                      setInput(suggestion);
                                      // Optional: auto-send
                                      // setTimeout(() => handleSend(), 50);
                                    }}
                                    className="px-4 py-2 bg-accent/5 border border-accent/20 hover:bg-accent/10 hover:border-accent/40 rounded-full text-xs font-medium text-accent transition-all hover:-translate-y-0.5"
                                  >
                                    {suggestion}
                                  </button>
                                ));
                              } catch (e) { return null; }
                            })()}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-3 text-muted italic py-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                        </div>
                        <span className="text-xs font-medium tracking-wide">Synthesizing response...</span>
                      </div>
                    )}
                  </div>
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
              className="w-full bg-surface border border-border rounded-lg pl-4 pr-24 py-3 text-sm focus:outline-none focus:border-accent resize-none h-24"
              disabled={isTyping}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button 
                onClick={handleMic}
                className={`p-2 rounded-md transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' 
                    : 'bg-surface border border-border text-muted hover:text-accent hover:border-accent'
                }`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                <Mic size={16} />
              </button>
              <button 
                onClick={handleSend}
                className="p-2 bg-accent text-background rounded-md hover:opacity-90 transition-opacity"
              >
                <Send size={16} />
              </button>
            </div>
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
