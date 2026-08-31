import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { AIAssistantResponse } from '../../types/index.js';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  citations?: Array<{ documentId: string; title: string }>;
  suggestedActions?: string[];
  timestamp: string;
}

const QUICK_PROMPTS = [
  'What is the grace period for check-in?',
  'How many casual leaves do I have left?',
  'When do I need a supporting document for late arrival?',
  'How is overtime calculated?',
];

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: 'Hello! I am your Enterprise HR & Attendance AI Assistant. You can ask me questions about company policies, leave entitlements, grace periods, or your personal attendance records.',
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiRequest<AIAssistantResponse>('/ai/employee-assistant', {
        method: 'POST',
        body: JSON.stringify({ question: textToSend.trim() }),
      });

      const assistantMsg: ChatMessage = {
        id: 'ast_' + Date.now(),
        sender: 'assistant',
        content: response.answer,
        citations: response.citations,
        suggestedActions: response.suggestedActions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'assistant',
        content: error.message || 'I encountered an error retrieving policy guidance. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-bold shadow">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white font-display">HR Policy Assistant</h3>
                <p className="text-xs text-slate-400">Grounded in Authorized Policies</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-amber-400 text-xs shadow-sm">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div className={`max-w-[82%] space-y-2`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white font-medium rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-amber-600" />
                        <span>Policy Citations</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-medium text-amber-800"
                          >
                            {c.title || c.documentId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="block text-[10px] text-slate-400 px-1">{msg.timestamp}</span>
                </div>

                {msg.sender === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-sm">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200/80 w-fit">
                <Sparkles className="h-4 w-4 text-amber-500 animate-spin" />
                <span>Retrieving authorized policies and formulating response...</span>
              </div>
            )}
          </div>

            {/* Quick Prompt Chips */}
            <div className="p-3 bg-white border-t border-slate-100">
              <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Suggested Questions</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="text-[11px] bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

          {/* Input Footer */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about attendance policies, leave rules..."
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
