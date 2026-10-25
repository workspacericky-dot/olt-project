import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Play, Pause, RotateCcw, Volume2, VolumeX, SkipBack, SkipForward, Maximize2, Minimize2, Upload, X, Music, Activity, Calendar, Clock, Smile, Frown, Meh, Heart, Award, ArrowRight, Home, Settings, LogOut, Users, User, UserCheck, Sparkles, MessageCircle, TrendingUp, History, Menu, ChevronRight, BookOpen, MailOpen, Lock, Unlock, Send, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import confetti from 'canvas-confetti';
import LyricsVisualizer from './features/Visualizer/LyricsVisualizer';
import CursorAnimation from './components/CursorAnimation';
import BGMusic from './components/BGMusic';
import { startCoachSession, sendCoachMessage } from './utils/geminiCoach';

const SajakPage = lazy(() => import('./features/Sajak/SajakPage'));

// --- 1. CONFIGURATION ---
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// --- 2. CONSTANTS & STYLES ---
const QUESTIONS = [
  { id: 1, text: "How well does your partner meet your needs?", lowLabel: "Poorly", highLabel: "Extremely Well", reverse: false },
  { id: 2, text: "In general, how satisfied are you with your relationship?", lowLabel: "Unsatisfied", highLabel: "Extremely Satisfied", reverse: false },
  { id: 3, text: "How good is your relationship compared to most?", lowLabel: "Poor", highLabel: "Excellent", reverse: false },
  { id: 4, text: "How often do you wish you hadn't gotten into this relationship?", lowLabel: "Very Often", highLabel: "Never", reverse: true },
  { id: 5, text: "To what extent has your relationship met your original expectations?", lowLabel: "Hardly at all", highLabel: "Completely", reverse: false },
  { id: 6, text: "How much do you love your partner?", lowLabel: "Not much", highLabel: "Very much", reverse: false },
  { id: 7, text: "How many problems are there in your relationship?", lowLabel: "Very many", highLabel: "Very few", reverse: true }
];

const patternStyle = {
  backgroundColor: '#fff1f2',
  backgroundImage: 'radial-gradient(#fbcfe8 1.5px, transparent 1.5px)',
  backgroundSize: '20px 20px'
};

// --- 3. HELPER FUNCTIONS ---
const calculateScore = (answers) => {
  console.log("🧮 CALCULATION STARTING..."); // <--- Look for this!
  return answers.reduce((total, ans) => {
    const q = QUESTIONS.find(q => q.id === ans.questionId);

    // Check if your fix is actually active here
    // If you removed the reverse logic, it should just be ans.value
    const points = ans.value;

    console.log(`Q${q.id} (${q.text.substring(0, 10)}...): Input ${ans.value} -> Points ${points}`);
    return total + points;
  }, 0);
};

const getAssessmentResult = (score) => {
  if (score >= 22) return { level: 'High Satisfaction', color: 'text-pink-600', bg: 'bg-pink-100', border: 'border-pink-200' };
  if (score >= 15) return { level: 'Average Satisfaction', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' };
  return { level: 'Low Satisfaction', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' };
};

const getCoachTip = (score) => {
  if (score >= 22) return "Your relationship is thriving! Maintain this momentum by introducing novel activities. Focus on 'capitalization'—celebrating each other's small wins enthusiastically.";
  if (score >= 15) return "You have a solid foundation. To move from average to excellent, try a weekly 'check-in' where you discuss one unmet need without judgment.";
  return "Relationships go through seasons. Right now, focus on the basics: reliable communication and meeting simple tangible needs.";
};

// --- 4. COMPONENTS ---

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center" style={patternStyle}>
    <div className="flex flex-col items-center space-y-4 bg-white/80 p-8 rounded-2xl backdrop-blur-sm border border-pink-100 shadow-xl animate-pulse">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      <p className="text-pink-600 font-medium">Syncing Hearts...</p>
    </div>
  </div>
);

const LandingPage = ({ onJoin }) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  // 🔐 THE VIP LIST - UPDATE WITH YOUR REAL DETAILS
  const ACCOUNTS = {
    "ricky-1701": { name: "Ricky Pramoedya Hermawan", coupleId: "YUK KAPAN NIKAH?" },
    "annisa-2705": { name: "Annisa Nurul Safitri", coupleId: "YUK KAPAN NIKAH?" }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const cleanCode = accessCode.trim();
    const user = ACCOUNTS[cleanCode];

    if (user) {
      onJoin(user.coupleId, user.name);
    } else {
      setError("❌ Access Denied: Unknown ID.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={patternStyle}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-pink-100 transform transition-all hover:scale-105 duration-500">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-8 -translate-y-8 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 translate-y-12 animate-pulse delay-700"></div>
          <div className="relative z-10">
            <div className="mx-auto bg-white/25 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm shadow-inner">
              <Heart className="w-8 h-8 text-white animate-bounce" fill="currentColor" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Our Love Tracker</h1>
            <p className="text-pink-100 font-medium">Ricky & Annisa</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl border border-red-100 flex items-center animate-shake">
                <AlertCircle className="w-4 h-4 mr-2" /> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Enter Your Personal ID</label>
              <input
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
                placeholder="e.g. ricky-123"
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:ring-4 focus:ring-pink-100 outline-none bg-pink-50/30 font-bold tracking-widest text-center transition-all"
                required
              />
            </div>

            <button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-pink-200 flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 active:scale-95">
              <span>Unlock Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <a href="#/sajak" className="mt-6 flex items-center gap-4 rounded-2xl border border-pink-100 bg-pink-50/60 p-4 text-left transition-all hover:bg-pink-100 hover:shadow-md focus-visible:outline-pink-500">
            <span className="relative rounded-xl bg-white p-3 text-pink-500 shadow-sm"><MailOpen className="h-5 w-5" /><Heart className="absolute left-1/2 top-[11px] h-2.5 w-2.5 -translate-x-1/2 fill-pink-500 stroke-white stroke-[1.5]" /></span>
            <span className="flex-1"><span className="block font-bold text-slate-800">Sajak untukmu</span><span className="mt-1 block text-xs text-slate-500">Kalau ada waktu, sempetin baca ya sayang</span></span>
            <ChevronRight className="h-5 w-5 text-pink-400" />
          </a>
        </div>
      </div>
    </div>
  );
};

const Assessment = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleAnswer = (val) => {
    const newAnswers = [...answers, { questionId: QUESTIONS[step].id, value: val }];
    if (step < QUESTIONS.length - 1) {
      setAnswers(newAnswers);
      setStep(step + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  const progress = ((step + 1) / QUESTIONS.length) * 100;
  const question = QUESTIONS[step];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={patternStyle}>
      <div className="h-2 bg-pink-100">
        <div className="h-full bg-pink-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        <div className="bg-white/90 p-8 rounded-3xl shadow-xl border border-pink-100 backdrop-blur-md w-full transform transition-all duration-500">
          <div className="mb-10 text-center">
            <span className="text-pink-500 font-bold tracking-wider text-xs uppercase mb-3 block bg-pink-50 inline-block px-3 py-1 rounded-full">
              Question {step + 1} of {QUESTIONS.length}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight animate-fade-in">{question.text}</h2>
          </div>

          <div className="w-full space-y-6">
            <div className="flex justify-between text-sm font-semibold text-slate-400 px-1">
              <span>{question.lowLabel}</span>
              <span>{question.highLabel}</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => handleAnswer(val)}
                  className="aspect-square rounded-2xl border-2 border-pink-100 hover:bg-pink-500 hover:text-white text-xl font-bold text-pink-400 transition-all focus:outline-none focus:ring-4 focus:ring-pink-200 transform hover:scale-110 hover:shadow-lg shadow-sm"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 flex justify-center bg-white/50 backdrop-blur-sm">
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-medium text-sm flex items-center hover:bg-slate-100 px-4 py-2 rounded-lg">
          <LogOut className="w-4 h-4 mr-2" /> Cancel Assessment
        </button>
      </div>
    </div>
  );
};

const JournalWriter = ({ onComplete, onCancel, partnerName, score, recentJournals }) => {
  const [phase, setPhase] = useState('chat'); // 'chat' | 'write'
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [writingGuide, setWritingGuide] = useState('');
  const [content, setContent] = useState('');
  const chatEndRef = React.useRef(null);

  // Start the coaching session automatically on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const result = await startCoachSession(partnerName, score, recentJournals);
      setChatHistory(result.history);
      if (result.isDone) {
        setWritingGuide(result.reply);
        setPhase('write');
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;
    const newHistory = [...chatHistory, { role: 'user', text: userInput.trim() }];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    const result = await sendCoachMessage(newHistory, partnerName, score, recentJournals);
    const updatedHistory = [...newHistory, { role: 'coach', text: result.reply }];
    setChatHistory(updatedHistory);
    
    if (result.isDone) {
      setWritingGuide(result.reply);
      // Auto-transition to write phase after a short delay
      setTimeout(() => setPhase('write'), 1500);
    }
    setIsLoading(false);
  };

  const handleSubmitJournal = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onComplete(content.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" style={patternStyle}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <Sparkles className="w-6 h-6 text-indigo-500 mr-2" />
          {phase === 'chat' ? 'AI Coach' : 'Tell Your Story'}
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-medium px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors text-sm">
          Cancel
        </button>
      </div>

      {phase === 'chat' ? (
        /* === CHAT PHASE === */
        <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-pink-500 text-white rounded-br-sm' 
                    : 'bg-indigo-50 text-slate-700 border border-indigo-100 rounded-bl-sm'
                }`}>
                  {msg.role === 'coach' && <Sparkles className="w-4 h-4 text-indigo-400 inline mr-1 mb-0.5" />}
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          {!writingGuide && (
            <div className="border-t border-pink-100 bg-white/80 backdrop-blur-md px-4 py-3">
              <div className="flex items-center space-x-3 max-w-2xl mx-auto">
                <input
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Ketik jawabanmu..."
                  className="flex-1 px-4 py-3 rounded-xl border border-pink-200 focus:ring-4 focus:ring-pink-100 outline-none text-sm font-medium"
                  disabled={isLoading}
                  autoFocus
                />
                <button onClick={handleSendMessage} disabled={!userInput.trim() || isLoading} className="bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-xl disabled:opacity-50 transition-all shadow-md shadow-pink-200 transform hover:-translate-y-0.5 active:scale-95">
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center mt-2">
                <button onClick={() => setPhase('write')} className="text-xs text-slate-400 hover:text-indigo-500 transition-colors">
                  Skip — langsung nulis aja →
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* === WRITE PHASE === */
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white/90 p-8 rounded-3xl shadow-xl border border-pink-100 backdrop-blur-md animate-fade-in-up">
            {/* Writing Guide from Coach */}
            {writingGuide && (
              <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl mb-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Coach's Suggestion</p>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{writingGuide}</p>
              </div>
            )}

            <form onSubmit={handleSubmitJournal}>
              <textarea
                className="w-full h-48 p-4 rounded-xl border border-pink-200 focus:ring-4 focus:ring-pink-100 outline-none resize-none mb-6 text-slate-700 placeholder-slate-400 font-medium leading-relaxed shadow-inner"
                placeholder="Tulis ceritamu hari ini..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus
              />
              <div className="flex justify-between items-center">
                <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!content.trim()} className="px-6 py-3 rounded-xl font-bold bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-200 transition-all flex items-center transform hover:-translate-y-0.5 active:scale-95">
                  <span>Lock Entry</span>
                  <Lock className="w-4 h-4 ml-2" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ coupleId, partnerName, data, journals, onStart, onWriteJournal, onLogout, onOpenVisualizer }) => {
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // --- DATA PROCESSING FOR GRAPH ---
  const chartData = useMemo(() => {
    // Sort raw data chronologically
    const sortedRaw = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Group entries exactly by date to process them day-by-day
    const groupedByDateMap = new Map();
    sortedRaw.forEach(entry => {
      if (!groupedByDateMap.has(entry.date)) {
        groupedByDateMap.set(entry.date, []);
      }
      groupedByDateMap.get(entry.date).push(entry);
    });

    const dailyData = [];
    const latestScores = {}; // Tracks the most recent score for each person over time

    groupedByDateMap.forEach((entries, date) => {
      const point = { date };

      // Update the latest known scores with any submissions from this specific day
      entries.forEach(entry => {
        latestScores[entry.partner_name] = entry.score;
      });

      // Calculate the combined strength using the most recent score of both partners
      point.combined = Object.values(latestScores).reduce((sum, score) => sum + score, 0);

      // To prevent dots from connecting across days without submissions
      // we only plot individual dots on days they actually submitted
      entries.forEach(entry => {
        point[entry.partner_name] = entry.score;
      });

      // Add the day's journals into the data point so the Tooltip can access them
      const daysJournals = journals ? journals.filter(j => j.date === date) : [];
      if (daysJournals.length > 0) {
        point.journals = daysJournals;
      }

      dailyData.push(point);
    });

    return dailyData;
  }, [data, journals]);

  // --- FILTERING FOR HISTORY LIST ---
  const historyData = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (filter === 'me') return sorted.filter(d => d.partner_name === partnerName);
    if (filter === 'partner') return sorted.filter(d => d.partner_name !== partnerName);
    return sorted;
  }, [data, filter, partnerName]);

  const reversedHistory = useMemo(() => [...historyData].reverse(), [historyData]);
  const totalPages = Math.ceil(reversedHistory.length / itemsPerPage);
  const currentHistoryPage = reversedHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const latest = historyData.length > 0 ? historyData[historyData.length - 1] : null;
  const result = latest ? getAssessmentResult(latest.score) : null;

  // --- CUSTOM GRAPH TOOLTIP ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Find the specific data point we are hovering over
      const dataPoint = payload[0].payload;
      
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-pink-100 max-w-sm animate-fade-in">
          <p className="font-bold text-slate-800 text-lg mb-4 border-b border-pink-50 pb-2">{label}</p>
          
          <div className="space-y-4">
            {payload.map((entry, index) => {
              // Find if this person wrote a journal entry today
              // Journals are attached to the dataPoint object in chartData memo
              const journal = dataPoint.journals?.find(j => 
                (entry.name === 'Combined Strength' ? false : j.partner_name === entry.name)
              );

              return (
                <div key={`item-${index}`} className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ color: entry.color }}>
                      {entry.name}
                    </span>
                    <span className="font-black text-sm" style={{ color: entry.color }}>
                      {entry.value}
                    </span>
                  </div>
                  
                  {journal && (
                    <div className="mt-1 ml-2 border-l-2 border-pink-100 pl-3">
                      <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-2">
                        "{journal.content}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // --- JOURNAL DATA ---
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const todaysJournals = journals ? journals.filter(j => j.date === today) : [];
  const myJournal = todaysJournals.find(j => j.partner_name === partnerName);
  const partnerJournal = todaysJournals.find(j => j.partner_name !== partnerName);

  return (
    <div className="min-h-screen pb-12" style={patternStyle}>
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-pink-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-pink-100 p-2 rounded-full">
              <Heart className="text-pink-600 w-5 h-5" fill="currentColor" />
            </div>
            <span className="font-bold text-slate-800 text-lg hidden sm:inline tracking-tight">Our Love Tracker</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenVisualizer}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-300 transition-all transform hover:-translate-y-0.5"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">HBD Sayang</span>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{coupleId}</p>
              <p className="text-xs text-pink-500 font-medium">Hi, {partnerName}</p>
            </div>
            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">

        {/* WELCOME & CHECK-IN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-transform hover:shadow-md">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome back, {partnerName}</h1>
            <p className="text-slate-500 mt-1">Let's see how your relationship is blossoming.</p>
          </div>
          <button onClick={onStart} className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 transition-all flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 hover:scale-105 active:scale-95">
            <Activity className="w-5 h-5" />
            <span>Check-in Now</span>
          </button>
        </div>

        {/* THE DAILY VAULT - RECIPROCAL REVEAL */}
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden relative group transition-all hover:shadow-md">
          <div className="p-5 border-b border-pink-50 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
            <h3 className="font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center"><BookOpen className="w-5 h-5 mr-2 text-pink-500" /> The Daily Vault</span>
              <span className="text-xs bg-white px-3 py-1 rounded-full text-pink-600 font-bold shadow-sm">{today}</span>
            </h3>
          </div>
          <div className="p-6">
            {!myJournal && !partnerJournal && (
              <div className="text-center py-4">
                <p className="text-slate-500 mb-6 font-medium">The vault is empty today. Let the AI coach help you tell your story!</p>
                <button onClick={onWriteJournal} className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center mx-auto space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Tell Your Story Today!</span>
                </button>
              </div>
            )}
            {!myJournal && partnerJournal && (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 blur-xl"></div>
                <div className="relative z-10 w-16 h-16 bg-white shrink-0 shadow-sm border border-pink-100 text-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-bounce">
                  <Lock className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Partner's Note Locked</h4>
                <p className="text-slate-500 mb-6 text-sm max-w-xs mx-auto">Your partner dropped a thought! Write yours to unlock it.</p>
                <button onClick={onWriteJournal} className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-pink-200 transition-all flex items-center justify-center mx-auto space-x-2 transform hover:-translate-y-0.5 active:scale-95">
                  <Unlock className="w-5 h-5" />
                  <span>Tell Your Story to Unlock</span>
                </button>
              </div>
            )}
            {myJournal && !partnerJournal && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-pink-50/50 p-6 rounded-2xl border border-pink-100 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-bold text-xs">{myJournal.partner_name.charAt(0)}</div>
                    <span className="text-xs font-bold text-pink-500 uppercase tracking-wider">{myJournal.partner_name}</span>
                  </div>
                  <p className="text-slate-700 italic font-medium leading-relaxed">"{myJournal.content}"</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <Clock className="w-8 h-8 text-slate-300 mb-3 animate-pulse" />
                  <p className="text-slate-500 text-sm font-medium">Waiting for partner's entry...</p>
                </div>
              </div>
            )}
            {myJournal && partnerJournal && (
              <div className="grid md:grid-cols-2 gap-6 relative">
                 <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center shadow-md z-10 animate-fade-in">
                   <Unlock className="w-3.5 h-3.5 mr-1.5" /> Vault Unlocked
                 </div>
                <div className="bg-pink-50/80 p-6 rounded-2xl border border-pink-100 shadow-sm pt-8">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-bold text-xs">{myJournal.partner_name.charAt(0)}</div>
                    <span className="text-xs font-bold text-pink-500 uppercase tracking-wider">{myJournal.partner_name}</span>
                  </div>
                  <p className="text-slate-700 italic font-medium leading-relaxed">"{myJournal.content}"</p>
                </div>
                <div className="bg-purple-50/80 p-6 rounded-2xl border border-purple-100 shadow-sm pt-8">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 font-bold text-xs">{partnerJournal.partner_name.charAt(0)}</div>
                    <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">{partnerJournal.partner_name}</span>
                  </div>
                  <p className="text-slate-700 italic font-medium leading-relaxed">"{partnerJournal.content}"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- FILTER TOGGLE MENU --- */}
        <div className="flex justify-center">
          <div className="bg-white p-1 rounded-xl border border-pink-100 shadow-sm flex space-x-1">
            <button onClick={() => setFilter('all')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${filter === 'all' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-500 hover:bg-pink-50'}`}>
              <Users className="w-4 h-4" /> <span>Both</span>
            </button>
            <button onClick={() => setFilter('me')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${filter === 'me' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-500 hover:bg-pink-50'}`}>
              <UserCheck className="w-4 h-4" /> <span>Me</span>
            </button>
            <button onClick={() => setFilter('partner')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${filter === 'partner' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-500 hover:bg-pink-50'}`}>
              <User className="w-4 h-4" /> <span>Partner</span>
            </button>
          </div>
        </div>

        {/* LATEST RESULT CARD */}
        {latest ? (
          <div className={`rounded-3xl p-8 border-2 ${result.border} ${result.bg} shadow-sm transition-all relative overflow-hidden transform hover:scale-[1.01] duration-300`}>
            {result.level === 'High Satisfaction' && (
              <div className="absolute top-0 right-0 -mt-10 -mr-10 text-pink-200/50 animate-pulse">
                <Heart size={200} fill="currentColor" />
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`p-1.5 rounded-full bg-white/50 ${result.color}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className={`font-bold text-sm uppercase tracking-wide ${result.color}`}>
                    {filter === 'partner' ? "Partner's Status" : "Current Status"}
                  </span>
                </div>
                <h2 className={`text-4xl md:text-5xl font-extrabold ${result.color} mb-6 tracking-tight`}>{result.level}</h2>
                <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm border border-white/50 shadow-sm">
                  <h3 className="font-bold text-slate-800 flex items-center mb-3">
                    <MessageCircle className="w-5 h-5 mr-2 text-pink-500" />
                    Coach's Insight
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-sm">{getCoachTip(latest.score)}</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-md min-w-[220px] flex flex-col items-center justify-center border-2 border-white/50">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Score</span>
                <div className="relative">
                  <span className={`text-6xl font-black ${result.color}`}>{latest.score}</span>
                </div>
                <span className="text-slate-400 text-xs font-bold mt-1 uppercase">out of 35</span>
                <div className="mt-4 pt-4 border-t border-slate-100 w-full text-center">
                  <span className="text-slate-400 text-xs block font-medium">Last update</span>
                  <span className={`text-sm font-bold ${result.color}`}>{latest.partner_name}</span>
                  <span className="text-slate-400 text-xs block mt-1">{latest.date}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-pink-200 text-center">
            <div className="bg-pink-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {filter === 'partner' ? "No Data Yet" : "Start Your Journey"}
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {filter === 'partner' ? "Your partner hasn't completed an assessment yet." : "Complete your first relationship assessment to unlock insights."}
            </p>
          </div>
        )}

        {/* ANALYTICS CHART - THE UNITY GRAPH */}
        {chartData.length > 1 && (
          <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-pink-500" />
                Growth & Unity Graph
              </h3>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fdf2f8" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} padding={{ left: 10, right: 10 }} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fbcfe8', strokeWidth: 2, strokeDasharray: '5 5' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />

                  {/* The COMBINED Line (Thick & Green) */}
                  <Line name="Combined Strength" type="monotone" dataKey="combined" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 8 }} />

                  {/* Individual Lines (Thinner) */}
                  <Line name={partnerName} type="monotone" dataKey={partnerName} stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} connectNulls />
                  {/* We dynamically find the partner's name from data keys excluding date/combined/me */}
                  {Object.keys(chartData[0] || {}).filter(k => k !== 'date' && k !== 'combined' && k !== partnerName).map(otherName => (
                    <Line key={otherName} name={otherName} type="monotone" dataKey={otherName} stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2 italic">The Green Line shows your combined relationship strength!</p>
          </div>
        )}

        {/* HISTORY LIST */}
        {historyData.length > 0 && (
          <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-pink-50 bg-pink-50/30">
              <h3 className="font-bold text-slate-800 flex items-center">
                <History className="w-5 h-5 mr-2 text-pink-500" />
                History Log
              </h3>
            </div>
            <div className="divide-y divide-pink-50">
              {currentHistoryPage.map((entry, idx) => (
                <div key={entry.id || idx} className="p-4 hover:bg-pink-50/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${entry.score >= 22 ? 'bg-pink-100 text-pink-600' :
                      entry.score >= 15 ? 'bg-purple-100 text-purple-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                      {entry.score}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{entry.partner_name}</p>
                      <p className="text-xs text-slate-400 font-medium">{entry.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t border-pink-50 flex items-center justify-between bg-white text-sm">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-pink-600 hover:bg-pink-50'}`}
                >
                  Previous
                </button>
                <span className="text-slate-500 font-semibold text-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-pink-600 hover:bg-pink-50'}`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// --- 5. MAIN APP CONTROLLER ---
function TrackerApp() {
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState(() => localStorage.getItem('c_id') || '');
  const [partnerName, setPartnerName] = useState(() => localStorage.getItem('p_name') || '');
  const [view, setView] = useState('dashboard');
  const [assessments, setAssessments] = useState([]);
  const [journals, setJournals] = useState([]);

  // FETCH DATA
  const fetchData = async () => {
    if (!coupleId) return;
    try {
      const [assessmentsRes, journalsRes] = await Promise.all([
        supabase.from('assessments').select('*').eq('couple_id', coupleId),
        supabase.from('journals').select('*').eq('couple_id', coupleId)
      ]);
      if (assessmentsRes.error) throw assessmentsRes.error;
      // We log journals error but don't strictly throw if table isn't created yet by user
      if (journalsRes.error) console.warn("Journals fetch warning:", journalsRes.error.message);
      
      setAssessments(assessmentsRes.data || []);
      setJournals(journalsRes.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    if (coupleId) fetchData();
    setTimeout(() => setLoading(false), 800);
  }, [coupleId]);

  // SAVE DATA
  const handleSave = async (answers) => {
    // 1. Trigger Celebration!
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#f472b6', '#fbcfe8']
    });

    const score = calculateScore(answers);
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Optimistic Update
    const tempEntry = {
      id: Date.now(),
      couple_id: coupleId,
      partner_name: partnerName,
      score,
      date,
      created_at: new Date().toISOString()
    };
    setAssessments(prev => [...prev, tempEntry]);

    // Send to Supabase
    await supabase.from('assessments').insert([{
      couple_id: coupleId,
      partner_name: partnerName,
      score,
      answers,
      date
    }]);

    await fetchData();
    setView('dashboard');
  };

  const handleSaveJournal = async (content) => {
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Optimistic Update
    const tempEntry = {
      id: Date.now(),
      couple_id: coupleId,
      partner_name: partnerName,
      content,
      date,
      created_at: new Date().toISOString()
    };
    setJournals(prev => [...prev, tempEntry]);

    // Send to Supabase
    const { error } = await supabase.from('journals').insert([{
      couple_id: coupleId,
      partner_name: partnerName,
      content,
      date
    }]);

    if(error){
      console.error("Failed to save journal. Make sure the table exists!", error);
      alert("Failed to save journal! Did you execute the SQL script in Supabase?");
    }

    await fetchData();
    setView('dashboard');
  };

  const handleLogin = (c, p) => {
    localStorage.setItem('c_id', c);
    localStorage.setItem('p_name', p);
    setCoupleId(c);
    setPartnerName(p);
  };

  const handleLogout = () => {
    localStorage.clear();
    setCoupleId('');
    setPartnerName('');
    setAssessments([]);
    setJournals([]);
  };

  // Get the user's personal latest score for AI coach
  const getMyLatestScore = () => {
    const myAssessments = assessments.filter(a => a.partner_name === partnerName);
    return myAssessments.length > 0 ? myAssessments[myAssessments.length - 1].score : 18;
  };

  const renderContent = () => {
    if (loading) return <LoadingScreen />;
    if (!coupleId) return <LandingPage onJoin={handleLogin} />;
    if (view === 'assessment') return <Assessment onComplete={handleSave} onCancel={() => setView('dashboard')} />;
    if (view === 'journal') return (
      <JournalWriter 
        onComplete={handleSaveJournal} 
        onCancel={() => setView('dashboard')} 
        partnerName={partnerName}
        score={getMyLatestScore()}
        recentJournals={journals}
      />
    );
    if (view === 'visualizer') return <LyricsVisualizer onBack={() => setView('dashboard')} coupleId={coupleId} partnerName={partnerName} />;

    return <Dashboard 
      coupleId={coupleId} 
      partnerName={partnerName} 
      data={assessments} 
      journals={journals}
      onStart={() => setView('assessment')} 
      onWriteJournal={() => setView('journal')}
      onLogout={handleLogout} 
      onOpenVisualizer={() => setView('visualizer')} 
    />;
  };

  return (
    <>
      <CursorAnimation />
      <BGMusic isPlaying={!!coupleId && view === 'dashboard'} />
      {renderContent()}
    </>
  );
}

// The public experience mounts independently of the dashboard and its data requests.
export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);
  return hash === '#/sajak'
    ? <Suspense fallback={<LoadingScreen />}><SajakPage /></Suspense>
    : <TrackerApp />;
}
