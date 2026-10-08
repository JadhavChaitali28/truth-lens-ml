'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  ArrowLeft,
  User,
  Lightbulb,
  TrendingUp,
  Package,
  ReceiptText,
  Play,
  ArrowRight,
  Zap
} from 'lucide-react';
import { MarkdownPreview } from '../../components/ui/MarkdownPreview';
import { 
  VYAPAR_SKUS, 
  MONTHLY_SALES_HISTORY, 
  EXPENSE_LEDGER, 
  CUSTOMER_FEEDBACK_FEED, 
  MARKET_SIGNALS 
} from '../../lib/mockData';
import { queryLiveGeminiAgent, processNaturalLanguageQuery } from '../../lib/agentEngine';
import { ChatMessage } from '../../lib/types';

// The 5 core demonstration steps from Harsh Chavan's pitch script
const PITCH_DEMO_STEPS = [
  {
    stepNumber: 1,
    time: "1:20",
    name: "Morning Status",
    prompt: "Good morning. Aaj shop ka status batao.",
    desc: "Sales ₹48,750, Profit ₹11,430, Udhar ₹72,500, and 3 proactive alerts."
  },
  {
    stepNumber: 2,
    time: "1:50",
    name: "Smart Reorder",
    prompt: "Haan, low-stock item order kar do.",
    desc: "3-Supplier quote compare (Mahesh ₹12,450, saves ₹670) & 1-click PO."
  },
  {
    stepNumber: 3,
    time: "2:20",
    name: "Cash Recovery",
    prompt: "Kaunse customers ne payment nahi kiya?",
    desc: "Sharma Construction ₹32k (92% recovery prob), Sai ₹21.5k, Om ₹19k."
  },
  {
    stepNumber: 4,
    time: "2:50",
    name: "Profit Strategy",
    prompt: "Business improve kaise kar sakte hai?",
    desc: "LED 32% margin on 12% space vs Pumps 8% on 30% space (+₹18k–₹24k profit)."
  },
  {
    stepNumber: 5,
    time: "3:15",
    name: "Predictive Alert",
    prompt: "Copper wire stock status batao.",
    desc: "Sales surge +38%, out in 4 days, 150 rolls reorder to save ₹45k+ revenue."
  }
];

export default function DashboardPage() {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [expandedReasoningMap, setExpandedReasoningMap] = useState<Record<string, boolean>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initial welcome message grounded in Rajesh's shop
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'coo',
      finalAnswer: `### 🌅 Good morning Rajesh Bhai!
Welcome to **Vyapar AI** — your 24/7 autonomous AI business partner for **Rajesh Hardware & Electricals (Thane West)**.

| Metric | Status | Key Highlight |
| :--- | :--- | :--- |
| **Yesterday's Counter Sales** | **₹48,750** | 38 bills (Cash + BharatPe UPI QR) |
| **Estimated Net Profit** | **₹11,430** | **23.4%** net profit margin |
| **Pending Receivables (Khata)** | **₹72,500** | 3 construction trade accounts |
| **Today's Expected Forecast** | **₹52,000 – ₹58,000** | Based on recent Thane project velocity |

---

### ⚡ 3 Proactive Alerts You Should Know:
1. **📦 Low Stock**: Your **1-inch PVC pipe** will run out in **3 days** (4 bundles left).
2. **💸 Overdue Payments**: Two customers have overdue balances (**Sharma Construction ₹32,000** & **Sai Electric ₹21,500**).
3. **📈 Demand Surge**: Copper wire sales accelerated **+38%** in the last 10 days.

*Select any suggested action below or ask any question to get started.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: '👉 Step 1: "Good morning. Aaj shop ka status batao."', actionType: 'query', payload: { query: 'Good morning. Aaj shop ka status batao.' } },
        { label: '👉 Step 2: "Haan, low-stock item order kar do."', actionType: 'query', payload: { query: 'Haan, low-stock item order kar do.' } },
        { label: '👉 Step 3: "Kaunse customers ne payment nahi kiya?"', actionType: 'query', payload: { query: 'Kaunse customers ne payment nahi kiya?' } }
      ]
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setInputQuery('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Automatically update step index if this matches one of our demo steps
    const matchedStepIdx = PITCH_DEMO_STEPS.findIndex(s => 
      query.toLowerCase().includes(s.prompt.toLowerCase().slice(0, 15)) ||
      s.prompt.toLowerCase().includes(query.toLowerCase().slice(0, 15))
    );
    if (matchedStepIdx !== -1) {
      setCurrentStepIndex(matchedStepIdx);
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      finalAnswer: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await queryLiveGeminiAgent(
        query,
        VYAPAR_SKUS,
        MONTHLY_SALES_HISTORY,
        EXPENSE_LEDGER,
        CUSTOMER_FEEDBACK_FEED,
        MARKET_SIGNALS
      );

      setMessages(prev => [...prev, response]);
    } catch {
      const fallback = processNaturalLanguageQuery(
        query,
        VYAPAR_SKUS,
        MONTHLY_SALES_HISTORY,
        EXPENSE_LEDGER,
        CUSTOMER_FEEDBACK_FEED,
        MARKET_SIGNALS
      );
      setMessages(prev => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDemoStep = (stepIdx: number) => {
    if (stepIdx < 0 || stepIdx >= PITCH_DEMO_STEPS.length) return;
    const step = PITCH_DEMO_STEPS[stepIdx];
    setCurrentStepIndex(stepIdx);
    handleSendMessage(step.prompt);
  };

  const handleNextDemoStep = () => {
    const nextIdx = (currentStepIndex + 1) % PITCH_DEMO_STEPS.length;
    handleRunDemoStep(nextIdx);
  };

  const handleClearChat = () => {
    setMessages([]);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  const handleResetChat = () => {
    setCurrentStepIndex(0);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'coo',
        finalAnswer: `### 🌅 Good morning Rajesh Bhai!
Ready to assist you with **Rajesh Hardware & Electricals (Thane West)**. Ask any question or click a suggested action below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          { label: '👉 Step 1: Aaj shop ka status batao', actionType: 'query', payload: { query: 'Good morning. Aaj shop ka status batao.' } },
          { label: '👉 Step 2: Low-stock item order kar do', actionType: 'query', payload: { query: 'Haan, low-stock item order kar do.' } }
        ]
      }
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleToggleSpeak = (id: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\[\]()|]/g, ' ').replace(/\s+/g, ' ').slice(0, 450);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type or click the prompt.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuery(transcript);
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#faf9f6] text-stone-900 font-sans selection:bg-amber-500/20 selection:text-amber-900 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-[#e8e6df] bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition"
            title="Back to Overview"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center shadow-xs">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-stone-900 tracking-tight">Vyapar AI</span>
                <span className="text-xs text-stone-500 font-medium hidden sm:inline">• Rajesh Hardware (Thane West)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition"
            title="Start a new conversation"
          >
            <RotateCcw className="h-3.5 w-3.5 text-stone-500" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Clear history"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Chat Workspace */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            /* Clean Empty State with Pitch Demo Story Cards */
            <div className="py-12 text-center space-y-6">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center shadow-xs">
                <Sparkles className="h-7 w-7 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
                  Vyapar AI — Rajesh Hardware & Electricals (Thane West)
                </h2>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Click any pitch story step below to run the exact judge demo sequence.
                </p>
              </div>

              {/* Starter Pitch Demo Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-2 text-left">
                {PITCH_DEMO_STEPS.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRunDemoStep(idx)}
                    className="p-3.5 rounded-xl border border-[#e5e3dc] bg-white hover:border-amber-400/80 hover:shadow-xs transition group flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-stone-100 group-hover:bg-amber-100 text-stone-600 group-hover:text-amber-800 transition flex-shrink-0 font-mono text-xs font-bold">
                      {step.time}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-800 group-hover:text-amber-900">
                        {step.stepNumber}. {step.name}
                      </div>
                      <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                        &quot;{step.prompt}&quot;
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message Stream */
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSpeaking = speakingMsgId === msg.id;
              const hasReasoning = msg.reasoningSteps && msg.reasoningSteps.length > 0;
              const isReasoningExpanded = expandedReasoningMap[msg.id];

              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex-shrink-0 flex items-center justify-center text-white shadow-xs mt-1">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`max-w-[88%] sm:max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    {isUser ? (
                      <div className="bg-[#2d2a26] text-white px-4 py-3 rounded-2xl rounded-tr-xs text-xs font-medium shadow-xs leading-relaxed whitespace-pre-wrap">
                        {msg.finalAnswer}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Collapsible Reasoning Process (Minimalist) */}
                        {hasReasoning && (
                          <div className="rounded-xl border border-[#e5e3dc] bg-white overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() => setExpandedReasoningMap(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                              className="w-full px-3.5 py-2 flex items-center justify-between text-stone-600 hover:text-stone-900 bg-stone-50/60 hover:bg-stone-50 transition text-[11px] font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <Zap className="h-3 w-3 text-amber-600" />
                                <span>Multi-Agent Swarm Reasoning ({msg.reasoningSteps?.length} steps)</span>
                              </div>
                              {isReasoningExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
                              )}
                            </button>

                            {isReasoningExpanded && (
                              <div className="p-3 bg-stone-50/30 border-t border-[#eeebe3] space-y-2 text-[11px]">
                                {msg.reasoningSteps?.map((step, sIdx) => (
                                  <div key={sIdx} className="space-y-0.5 border-l-2 border-amber-500/40 pl-2.5">
                                    <div className="font-bold text-stone-800">{step.agentName}</div>
                                    <div className="text-stone-600 leading-relaxed">{step.thought}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Main Assistant Markdown Card */}
                        <div className="bg-white border border-[#e8e6df] rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-xs text-xs">
                          <MarkdownPreview 
                            content={msg.finalAnswer || ''}
                            showToggle={false}
                            className="border-0 bg-transparent p-0 shadow-none"
                          />

                          {/* Quick Action Suggestions / Demo Chaining Buttons */}
                          {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap gap-2">
                              {msg.suggestedActions.map((action, aIdx) => (
                                <button
                                  key={aIdx}
                                  onClick={() => handleSendMessage(action.payload?.query || action.label)}
                                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs group"
                                >
                                  <Sparkles className="h-3 w-3 text-amber-600 group-hover:scale-110 transition" />
                                  <span>{action.label}</span>
                                  <ArrowRight className="h-3 w-3 text-amber-700" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Subtle Action Toolbar */}
                        <div className="flex items-center gap-2 text-[11px] text-stone-400 px-1">
                          <span>{msg.timestamp}</span>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.id, msg.finalAnswer || '')}
                            className="hover:text-stone-700 transition flex items-center gap-1"
                            title="Copy response"
                          >
                            {copiedMsgId === msg.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleToggleSpeak(msg.id, msg.finalAnswer || '')}
                            className="hover:text-stone-700 transition flex items-center gap-1"
                            title="Listen to response"
                          >
                            {isSpeaking ? (
                              <>
                                <VolumeX className="h-3 w-3 text-amber-600" />
                                <span className="text-amber-700 font-bold">Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3 w-3" />
                                <span>Voice Readout</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="h-8 w-8 rounded-xl bg-stone-200 flex-shrink-0 flex items-center justify-center text-stone-700 shadow-xs mt-1">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Thinking / Loading Bubble */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex-shrink-0 flex items-center justify-center text-white shadow-xs">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="bg-white border border-[#e8e6df] px-4 py-2.5 rounded-2xl rounded-tl-xs shadow-xs text-xs font-medium text-stone-600 flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce [animation-delay:0.4s]"></span>
                </span>
                <span>Vyapar AI is synthesizing Rajesh Hardware records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Clean Bottom Input Section */}
      <footer className="p-4 sm:px-6 bg-gradient-to-t from-[#faf9f6] via-[#faf9f6] to-transparent flex-shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-end bg-white border border-[#dcd9d0] focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-2xl shadow-sm transition overflow-hidden"
          >
            <textarea
              ref={textareaRef}
              value={inputQuery}
              onChange={(e) => {
                setInputQuery(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Rajesh Hardware... (Press Enter to send)"
              rows={1}
              className="w-full resize-none py-3.5 pl-4 pr-24 bg-transparent text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none max-h-36 leading-relaxed"
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <button
                type="button"
                onClick={startListening}
                className={`p-2 rounded-xl transition ${
                  isListening 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                }`}
                title="Speak in Hindi / Hinglish / English"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className={`p-2 rounded-xl transition ${
                  inputQuery.trim() && !isLoading
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    : 'text-stone-300 bg-stone-100 cursor-not-allowed'
                }`}
                title="Send Message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between text-[11px] text-stone-400 px-2">
            <span>Vyapar AI • Dedicated to Rajesh Hardware & Electricals (Thane West)</span>
            <span>Enter to send • Shift + Enter for new line</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
