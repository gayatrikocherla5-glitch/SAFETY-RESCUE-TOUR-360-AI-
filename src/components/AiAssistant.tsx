/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff, 
  Sparkles, 
  ShieldAlert, 
  Trash2, 
  Compass, 
  Hospital, 
  Languages, 
  User as UserIcon,
  HelpCircle
} from 'lucide-react';
import { LanguageCode, LocationCoordinate, User } from '../types';
import { soundEngine } from '../utils/audio';
import { getOfflineAiResponse } from '../utils/offlineAi';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  isOffline?: boolean;
}

interface AiAssistantProps {
  currentLanguage: LanguageCode;
  userCoords: LocationCoordinate;
  isOffline: boolean;
  user: User;
  isEmergencyActive: boolean;
  onTriggerSos: () => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  currentLanguage,
  userCoords,
  isOffline,
  user,
  isEmergencyActive,
  onTriggerSos,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm_welcome',
      sender: 'ai',
      text: `Hello ${user.name}! I am SAFETY AI, your dedicated tourist safety and emergency companion. I can guide you to verified safe zones, find the nearest hospital or tourist police, translate emergency phrases across 18 languages, and provide safe travel routes. How may I protect your journey today?`,
      timestamp: Date.now(),
      isOffline: isOffline,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState<boolean>(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Match language code
      const langMap: Record<string, string> = {
        en: 'en-US',
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        pa: 'pa-IN',
      };
      recognition.lang = langMap[currentLanguage] || 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputPrompt(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentLanguage]);

  // Text-To-Speech synthesis
  const speakReply = (text: string) => {
    if (!isSpeakingEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Clean up markdown/bullet points for cleaner speech
      const cleaned = text.replace(/[*#_\[\]]/g, '').slice(0, 250);
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const toggleListening = () => {
    soundEngine.playClickSound();
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

    soundEngine.playClickSound();
    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage);

    if (isOffline) {
      // Offline mode: use local safety reasoning engine immediately
      setTimeout(() => {
        const offlineReply = getOfflineAiResponse(query, currentLanguage, userCoords);
        const aiMsg: Message = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: offlineReply,
          timestamp: Date.now(),
          isOffline: true,
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        speakReply(offlineReply);
      }, 500);
      return;
    }

    // Online mode: call server Gemini 3.8 Flash endpoint
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language: langObj?.name || 'English',
          userLocation: userCoords,
          isEmergency: isEmergencyActive,
        }),
      });

      if (!res.ok) throw new Error('API request failed');

      const data = await res.json();
      const aiReply = data.reply || getOfflineAiResponse(query, currentLanguage, userCoords);
      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: Date.now(),
        isOffline: data.fallback || false,
      };
      setMessages(prev => [...prev, aiMsg]);
      speakReply(aiReply);
    } catch {
      const fallbackReply = getOfflineAiResponse(query, currentLanguage, userCoords);
      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: fallbackReply,
        timestamp: Date.now(),
        isOffline: true,
      };
      setMessages(prev => [...prev, aiMsg]);
      speakReply(fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Where is the nearest hospital?',
    'How can I reach the police station?',
    'I am lost. What should I do?',
    'Show me safe places nearby.',
    'Translate emergency message into Marathi.',
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[650px] relative">
      
      {/* Header */}
      <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                SAFETY AI ASSISTANT
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                isOffline 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                <span>{isOffline ? 'Offline Mode' : 'Gemini 3.8 Flash'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isOffline
                ? 'Using locally downloaded safety blueprints & emergency database.'
                : 'Cloud AI with live location grounding & translation.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundEngine.playClickSound();
              setIsSpeakingEnabled(!isSpeakingEnabled);
              if (isSpeakingEnabled && typeof window !== 'undefined') {
                window.speechSynthesis?.cancel();
              }
            }}
            className={`p-2 rounded-xl border text-xs ${
              isSpeakingEnabled 
                ? 'bg-blue-600/20 text-cyan-300 border-blue-500/40' 
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title={isSpeakingEnabled ? 'Voice reply audio enabled' : 'Voice reply muted'}
          >
            {isSpeakingEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              soundEngine.playClickSound();
              setMessages([messages[0]]);
            }}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white'
            }`}>
              {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-md ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
            }`}>
              {msg.text}
              {msg.isOffline && msg.sender === 'ai' && (
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-amber-400 font-mono">
                  <span>OFFLINE REASONING</span>
                  <span>Zero Latency</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2.5 max-w-sm mr-auto">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-300">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>SAFETY AI is calculating response...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 overflow-x-auto flex items-center gap-2 no-scrollbar">
        <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Quick Queries:</span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs whitespace-nowrap border border-slate-700/60 transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box with Voice Mic Button */}
      <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-2xl border transition-all ${
              isListening
                ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-600/40'
                : 'bg-slate-900 text-cyan-400 border-slate-800 hover:bg-slate-800'
            }`}
            title={isListening ? 'Listening... Speak your emergency or question' : 'Voice Assistant (Speak instead of typing)'}
          >
            {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            placeholder={
              isListening
                ? 'Listening to your voice...'
                : isOffline
                ? 'Ask offline safety assistance, hospital, or translation...'
                : 'Ask SAFETY AI: "Where is nearest hospital?", "I am lost"...'
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
          />

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white shadow-md shadow-blue-600/30 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

    </div>
  );
};
