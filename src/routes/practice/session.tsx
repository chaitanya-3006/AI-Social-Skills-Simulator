import React, { useState, useEffect, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { 
  Send, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Loader2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Radio 
} from 'lucide-react';
import { toast } from 'sonner';
import { useSimulationStore } from '../../lib/simulation-store';
import { api } from '../../lib/api';

export const Route = createFileRoute('/practice/session')({
  component: SessionComponent,
});

function SessionComponent() {
  const navigate = useNavigate();
  const { selectedScenario, difficulty, sessionId, messages, addMessage } = useSimulationStore();
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentlyPlayingMsgId, setCurrentlyPlayingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Play ElevenLabs audio for an AI message
  const playAudio = (text: string, characterName: string, msgId: string) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      setCurrentlyPlayingMsgId(msgId);
      const audioUrl = `/api/voice/tts?text=${encodeURIComponent(text)}&character=${encodeURIComponent(characterName)}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setCurrentlyPlayingMsgId(null);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setCurrentlyPlayingMsgId(null);
        currentAudioRef.current = null;
      };

      audio.play().catch((err) => {
        console.warn('Audio auto-play blocked or error:', err);
        setCurrentlyPlayingMsgId(null);
      });
    } catch (e) {
      console.error('TTS playback error', e);
      setCurrentlyPlayingMsgId(null);
    }
  };

  // Initial greeting on mount
  useEffect(() => {
    if (!sessionId || !selectedScenario) {
      navigate({ to: '/practice/skill' });
      return;
    }
    
    if (messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        const greetingId = `msg_${Date.now()}_greeting`;
        const greetingContent = `Hi there! I'm ${selectedScenario.characterName}. How can I help you today?`;
        
        addMessage({
          id: greetingId,
          role: 'ai',
          content: greetingContent,
          timestamp: new Date().toISOString()
        });
        setIsTyping(false);

        if (voiceEnabled) {
          playAudio(greetingContent, selectedScenario.characterName, greetingId);
        }
      }, 800);
    }
  }, [sessionId, selectedScenario, messages.length, addMessage, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle Speech Recognition (STT)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Listening... Speak into your microphone.');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !sessionId || !selectedScenario) return;
    
    const userMsg = inputText.trim();
    setInputText('');
    
    addMessage({
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString()
    });

    setIsTyping(true);
    try {
      const response = await api.sendMessage(sessionId, userMsg);
      addMessage(response);

      if (voiceEnabled && response.role === 'ai') {
        playAudio(response.content, selectedScenario.characterName, response.id);
      }
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
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
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
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#030014] overflow-hidden">
      {/* Left Panel: AI Character Persona */}
      <div className="w-full md:w-80 lg:w-96 glass-card rounded-none border-y-0 border-l-0 flex flex-col md:h-full z-10 sticky md:relative top-0 p-4 md:p-6 shadow-xl bg-[#030014]/90 backdrop-blur-xl">
        
        {/* Header Tag */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-glow-purple">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs tracking-widest text-slate-400 uppercase">SIMULATION</span>
          </div>

          {/* Voice Toggle */}
          <button
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              if (!next && currentAudioRef.current) {
                currentAudioRef.current.pause();
                setCurrentlyPlayingMsgId(null);
              }
              toast.info(next ? 'ElevenLabs AI Voice enabled' : 'AI Voice muted');
            }}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
              voiceEnabled 
                ? 'bg-violet-600/20 text-violet-300 border-violet-500/30 shadow-glow-purple' 
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
            title={voiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-medium hidden sm:inline">{voiceEnabled ? 'Voice ON' : 'Muted'}</span>
          </button>
        </div>

        {/* Character Avatar & Info */}
        <div className="flex items-center md:flex-col md:items-start gap-4 mb-6">
          <div className="relative">
            <img 
              src={selectedScenario.avatarUrl} 
              alt={selectedScenario.characterName} 
              className="w-16 h-16 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-white/10 shadow-2xl bg-slate-800"
            />
            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#030014]
              ${selectedScenario.characterStatus === 'Online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400'}
            `}></div>
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-white m-0 leading-tight">
              {selectedScenario.characterName}
            </h2>
            <p className="text-xs md:text-sm text-slate-400 m-0 mt-0.5">{selectedScenario.characterRole}</p>
          </div>
        </div>

        {/* Character Personality Tags */}
        <div className="hidden md:flex flex-wrap gap-1.5 mb-6">
          {selectedScenario.characterTags.map(tag => (
            <span key={tag} className="text-xs px-2.5 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/5">
              {tag}
            </span>
          ))}
        </div>

        {/* Scenario Details */}
        <div className="hidden md:block mb-6">
          <h3 className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Scenario</h3>
          <p className="text-sm font-semibold text-white mb-1 leading-snug">{selectedScenario.title}</p>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{selectedScenario.description}</p>
        </div>

        {/* Difficulty Badge */}
        <div className="hidden md:block mb-auto">
          <h3 className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Difficulty</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold capitalize border ${
            difficulty === 'easy' ? 'badge-easy' : difficulty === 'medium' ? 'badge-medium' : 'badge-hard'
          }`}>
            {difficulty}
          </span>
        </div>

        {/* Progress Tracker */}
        <div className="hidden md:block mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Exchange Progress</span>
            <span className="text-white font-bold">{Math.min(100, Math.max(0, (messages.length / 8) * 100))}%</span>
          </div>
          <div className="progress-bg h-2">
            <div className="progress-fill" style={{ width: `${Math.min(100, (messages.length / 8) * 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Right Panel: Live Chat Dialogue */}
      <div className="flex-1 flex flex-col h-[calc(100vh-80px)] md:h-full relative">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5 pb-36">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isPlaying = currentlyPlayingMsgId === msg.id;

            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-lg relative group ${
                  isUser 
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-br-sm shadow-glow-purple' 
                    : 'glass-card rounded-bl-sm border-white/10 bg-white/5'
                }`}>
                  {!isUser && (
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 m-0">
                        <img src={selectedScenario.avatarUrl} className="w-4 h-4 rounded-full bg-slate-800" alt="" />
                        {selectedScenario.characterName}
                      </p>

                      {/* Listen Button */}
                      <button
                        onClick={() => playAudio(msg.content, selectedScenario.characterName, msg.id)}
                        className={`p-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                          isPlaying 
                            ? 'text-violet-400 bg-violet-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-white/10 opacity-70 group-hover:opacity-100'
                        }`}
                        title="Listen to ElevenLabs AI character voice"
                      >
                        {isPlaying ? (
                          <>
                            <Radio className="w-3.5 h-3.5 animate-pulse text-violet-400" />
                            <span className="text-[10px] font-bold text-violet-300">Playing...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] hidden sm:inline">Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <p className="m-0 leading-relaxed text-sm md:text-base text-slate-100">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-xs text-slate-400 bg-white/5 border-white/10">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>{selectedScenario.characterName} is responding...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-0 w-full p-4 md:p-6 bg-gradient-to-t from-[#030014] via-[#030014]/90 to-transparent pt-10">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            
            {/* Finish Session Button */}
            <div className="flex justify-center">
              <button 
                onClick={handleEndSimulation} 
                disabled={isEnding || messages.length < 2}
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                  messages.length < 2 
                    ? 'opacity-0 pointer-events-none' 
                    : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 shadow-lg'
                }`}
              >
                {isEnding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Evaluating with AI Coach...
                  </>
                ) : (
                  <>
                    <PhoneOff className="w-3.5 h-3.5" /> Finish & Get Evaluation
                  </>
                )}
              </button>
            </div>

            {/* Input & Mic Controls */}
            <div className="relative flex items-end gap-2">
              {/* Mic STT Button */}
              <button 
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-3 md:p-4 rounded-2xl glass-card flex-shrink-0 transition-all ${
                  isListening 
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse' 
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak via Microphone (STT)'}
              >
                {isListening ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5" />}
              </button>
              
              {/* Text Input */}
              <div className="flex-1 glass-card p-1 pr-2 rounded-2xl flex items-center shadow-2xl border-white/10 bg-white/5 focus-within:border-violet-500/50">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Listening to your voice..." : "Type your spoken response..."}
                  className="w-full bg-transparent border-none text-white p-3 md:p-3.5 resize-none h-[48px] md:h-[54px] focus:outline-none focus:ring-0 text-sm md:text-base placeholder-slate-500"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim() || isTyping}
                  className={`p-2.5 md:p-3 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${
                    inputText.trim() && !isTyping 
                      ? 'btn btn-primary shadow-glow-purple' 
                      : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
