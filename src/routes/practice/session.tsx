import React, { useState, useEffect, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Send, Mic, PhoneOff, ArrowRight } from 'lucide-react';
import { useSimulationStore } from '../../lib/simulation-store';
import { api } from '../../lib/api';

export const Route = createFileRoute('/practice/session')({
  component: SessionComponent,
});

function SessionComponent() {
  const navigate = useNavigate();
  const { selectedSkill, selectedScenario, difficulty, sessionId, messages, addMessage } = useSimulationStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId || !selectedScenario) {
      navigate({ to: '/practice/skill' });
      return;
    }
    
    // Initial AI greeting if no messages
    if (messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        addMessage({
          id: `msg_${Date.now()}`,
          role: 'ai',
          content: `Hi there. I'm ${selectedScenario.characterName}. How can I help you today?`,
          timestamp: new Date().toISOString()
        });
        setIsTyping(false);
      }, 1500);
    }
  }, [sessionId, selectedScenario, messages.length, addMessage, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim() || !sessionId) return;
    
    const userMsg = inputText.trim();
    setInputText('');
    
    addMessage({
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString()
    });

    setIsTyping(true);
    try {
      const response = await api.sendMessage(sessionId, userMsg);
      addMessage(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndSimulation = async () => {
    if (!sessionId) return;
    setIsEnding(true);
    try {
      await api.endSimulation(sessionId);
      navigate({ to: '/practice/results' });
    } catch (error) {
      console.error(error);
      setIsEnding(false);
    }
  };

  if (!selectedScenario) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[var(--bg-primary)] overflow-hidden">
      {/* Left Panel: AI Character */}
      <div className="w-full md:w-80 lg:w-96 glass-card rounded-none border-y-0 border-l-0 flex flex-col md:h-full z-10 sticky md:relative top-0 p-4 md:p-6 shadow-lg md:shadow-none bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-violet-500 to-blue-500 flex items-center justify-center font-bold text-xs" style={{ background: 'linear-gradient(to top right, var(--accent-violet), var(--accent-blue))'}}>
            S
          </div>
          <span className="font-bold text-sm tracking-widest text-secondary">SIMULATION</span>
        </div>

        <div className="flex items-center md:flex-col md:items-start gap-4 mb-6">
          <div className="relative">
            <img 
              src={selectedScenario.avatarUrl} 
              alt={selectedScenario.characterName} 
              className="w-16 h-16 md:w-32 md:h-32 rounded-full object-cover border-4 border-[var(--bg-secondary)] shadow-xl bg-slate-800"
            />
            <div className={`absolute bottom-1 right-1 md:bottom-3 md:right-3 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-[var(--bg-primary)]
              ${selectedScenario.characterStatus === 'Online' ? 'bg-green-500' : 'bg-yellow-500'}
            `}></div>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold m-0">{selectedScenario.characterName}</h2>
            <p className="text-secondary m-0">{selectedScenario.characterRole}</p>
          </div>
        </div>

        <div className="hidden md:flex flex-wrap gap-2 mb-8">
          {selectedScenario.characterTags.map(tag => (
            <span key={tag} className="text-xs px-2 py-1 rounded-md bg-[rgba(255,255,255,0.05)] text-secondary">
              {tag}
            </span>
          ))}
        </div>

        <div className="hidden md:block mb-8">
          <h3 className="text-xs font-bold text-secondary mb-2 uppercase tracking-wider">Scenario</h3>
          <p className="text-sm font-medium mb-1">{selectedScenario.title}</p>
          <p className="text-xs text-secondary line-clamp-3">{selectedScenario.description}</p>
        </div>

        <div className="hidden md:block mb-auto">
          <h3 className="text-xs font-bold text-secondary mb-2 uppercase tracking-wider">Difficulty</h3>
          <div className="inline-flex items-center px-2 py-1 rounded-md bg-[rgba(255,255,255,0.05)] text-xs font-medium capitalize">
            {difficulty}
          </div>
        </div>

        <div className="hidden md:block mt-8">
          <div className="flex justify-between text-xs text-secondary mb-2">
            <span>Simulation Progress</span>
            <span>{Math.min(100, Math.max(0, (messages.length / 10) * 100))}%</span>
          </div>
          <div className="progress-bg h-1.5">
            <div className="progress-fill" style={{ width: `${Math.min(100, (messages.length / 10) * 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="flex-1 flex flex-col h-[calc(100vh-100px)] md:h-full relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-32">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-md
                  ${isUser 
                    ? 'bg-gradient-to-br from-[var(--accent-violet)] to-[var(--accent-blue)] text-white rounded-br-sm' 
                    : 'glass-card rounded-bl-sm border-[var(--border-color)]'
                  }
                `}>
                  {!isUser && (
                    <p className="text-xs font-medium mb-1 opacity-70 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[rgba(255,255,255,0.2)] inline-block flex items-center justify-center">
                        <img src={selectedScenario.avatarUrl} className="w-4 h-4 rounded-full" alt="" />
                      </span>
                      {selectedScenario.characterName}
                    </p>
                  )}
                  <p className="m-0 leading-relaxed text-sm md:text-base">{msg.content}</p>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="glass-card rounded-2xl rounded-bl-sm p-4 flex items-center gap-2 text-sm text-secondary">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms', backgroundColor: 'var(--text-secondary)' }}></div>
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms', backgroundColor: 'var(--text-secondary)' }}></div>
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms', backgroundColor: 'var(--text-secondary)' }}></div>
                </div>
                <span>{selectedScenario.characterName} is typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 w-full p-4 md:p-6 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent pt-12">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            
            <div className="flex justify-center mb-2">
              <button 
                onClick={handleEndSimulation} 
                disabled={isEnding || messages.length < 2}
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all
                  ${messages.length < 2 ? 'opacity-0 pointer-events-none' : 'opacity-100 bg-[rgba(239,68,68,0.1)] text-[var(--error)] hover:bg-[rgba(239,68,68,0.2)]'}
                `}
              >
                {isEnding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneOff className="w-3.5 h-3.5" />}
                End Simulation
              </button>
            </div>

            <div className="relative flex items-end gap-2">
              <button className="p-3 md:p-4 rounded-xl glass-card glass-card-interactive flex-shrink-0 text-secondary hover:text-white">
                <Mic className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              
              <div className="flex-1 glass-card p-1 pr-2 rounded-xl flex items-center shadow-lg border-[var(--border-color-hover)] bg-[var(--bg-secondary)]">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  className="w-full bg-transparent border-none text-white p-3 md:p-4 resize-none h-[52px] md:h-[60px] focus:outline-none focus:ring-0 text-sm md:text-base"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim() || isTyping}
                  className={`p-2.5 md:p-3 rounded-lg flex-shrink-0 flex items-center justify-center transition-all
                    ${inputText.trim() && !isTyping 
                      ? 'bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-blue)] text-white shadow-[var(--shadow-glow-violet)]' 
                      : 'bg-[var(--bg-card)] text-secondary'
                    }
                  `}
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
