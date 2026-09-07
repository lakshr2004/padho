import { useEffect, useRef, useState } from "react";
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Briefcase, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Copy, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Terminal,
  FileText,
  Compass,
  HelpCircle,
  XCircle
} from "lucide-react";
import ThreeCanvas from "./components/ThreeCanvas";
import TiltCard from "./components/TiltCard";
import HoloOrb3D from "./components/HoloOrb3D";
import ScoreGauge3D from "./components/ScoreGauge3D";
import MarkdownView from "./components/MarkdownView";

export default function App() {
  const [mode, setMode] = useState("chat");

  // ============================================================
  // CHAT STATE
  // ============================================================
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Greetings! I am **Laksh's AI Representative** with neural access to his verified profile, projects, and competencies. Ask me about his full-stack engineering, FastAPI & Python expertise, Monetrik finance dashboard, or system design capabilities.",
      isStreaming: false,
      timestamp: "Ready",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedMsgIndex, setCopiedMsgIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // ============================================================
  // JOB MATCH STATE
  // ============================================================
  const [jobDescription, setJobDescription] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchValidationError, setMatchValidationError] = useState("");

  // Sample JDs for 1-click testing
  const sampleJDs = [
    {
      title: "Backend Python Engineer",
      content: `Role: Backend Python Developer
Requirements:
• Python 3+ & FastAPI
• REST API Design & Microservices
• PostgreSQL, MongoDB, SQL queries
• JWT Authentication & Role-Based Access Control (RBAC)
• Git, GitHub, Version Control
• Docker, Cloud deployment (Render or Vercel)
Nice to have:
• Basic Machine Learning with NumPy & Pandas
• Automated testing & security validation`,
    },
    {
      title: "Full-Stack Web Developer",
      content: `Role: Full Stack Software Engineer
Requirements:
• JavaScript, Node.js, Express.js
• React / Vite Modern Frontend
• REST API Design
• Database schema design (PostgreSQL/MongoDB)
• Security Checks, Input Validation, and bcrypt
• Deployment on Vercel / Render
Nice to have:
• Python scripting
• Manual Test-Case Design & QA suites`,
    },
  ];

  // ============================================================
  // AUTO SCROLL
  // ============================================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ============================================================
  // QUICK PROMPTS
  // ============================================================
  const quickPrompts = [
    {
      icon: <Zap className="h-4 w-4 text-cyan-400" />,
      label: "Technical Stack",
      prompt: "What is your primary tech stack, programming languages, and backend frameworks?",
    },
    {
      icon: <Layers className="h-4 w-4 text-indigo-400" />,
      label: "Monetrik Project",
      prompt: "Explain the Monetrik Full-Stack Finance Dashboard: what architecture and security tiers did you build?",
    },
    {
      icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
      label: "Security & QA",
      prompt: "How do you implement Role-Based Access Control (RBAC), input validation, and test cases in your projects?",
    },
    {
      icon: <Terminal className="h-4 w-4 text-amber-400" />,
      label: "Education & Profile",
      prompt: "Tell me about your academic background at Asansol Engineering College and your technical focus.",
    },
  ];

  // ============================================================
  // CHAT HANDLER
  // ============================================================
  const sendMessage = async (overridePrompt) => {
    const textToSend = typeof overridePrompt === "string" ? overridePrompt : input;
    if (!textToSend.trim() || loading) return;

    const question = textToSend.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: question,
        isStreaming: false,
        timestamp: timeNow,
      },
      {
        role: "assistant",
        content: "",
        isStreaming: true,
        timestamp: timeNow,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Streaming response not supported by server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantResponse += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: assistantResponse,
            isStreaming: true,
          };
          return updated;
        });
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: assistantResponse,
          isStreaming: false,
        };
        return updated;
      });
    } catch (error) {
      console.error(error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            "⚠️ **Connection Notice**: Unable to connect to the FastAPI core backend at `http://127.0.0.1:8000`. Please verify the Python server status in your terminal.",
          isStreaming: false,
          timestamp: timeNow,
        };
        return updated;
      });
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Session refreshed. I am ready to answer any questions regarding Laksh's skills, credentials, and achievements.",
        isStreaming: false,
        timestamp: "Ready",
      },
    ]);
  };

  const copyMessage = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgIndex(index);
    setTimeout(() => setCopiedMsgIndex(null), 2000);
  };

  // ============================================================
  // JOB MATCH HANDLER
  // ============================================================
  const analyzeCandidate = async () => {
    const trimmed = jobDescription.trim();
    if (!trimmed) {
      setMatchValidationError("Please provide a job description to analyze.");
      return;
    }
    if (trimmed.length < 20) {
      setMatchValidationError("Job description must contain at least 20 characters for deterministic evaluation.");
      return;
    }

    setMatchValidationError("");
    setMatchLoading(true);
    setMatchResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_description: trimmed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let message = "Candidate analysis failed.";
        if (Array.isArray(errorData?.detail)) {
          message = errorData.detail.map((item) => item?.msg).filter(Boolean).join(" ") || message;
        } else if (typeof errorData?.detail === "string") {
          message = errorData.detail;
        }
        throw new Error(message);
      }

      const data = await response.json();
      setMatchResult(data);
    } catch (error) {
      console.error(error);
      setMatchResult({
        error:
          error.message ||
          "Could not analyze job description. Ensure the FastAPI backend server is online at port 8000.",
      });
    } finally {
      setMatchLoading(false);
    }
  };

  const clearMatch = () => {
    setJobDescription("");
    setMatchResult(null);
    setMatchValidationError("");
  };

  return (
    <div className="relative min-h-screen bg-[#05070e] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-cyan-200">
      {/* 3D Background Canvas Layer */}
      <ThreeCanvas isStreaming={loading} />

      {/* Subtle Background Accent Overlays */}
      <div className="pointer-events-none fixed inset-0 bg-grid-cyber opacity-30" />
      <div className="pointer-events-none fixed inset-0 bg-radial-glow" />

      {/* ========================================================
          HEADER NAVIGATION
      ======================================================== */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#05070e]/85 backdrop-blur-2xl transition-all">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="flex h-16 sm:h-18 items-center justify-between">
            {/* BRAND / AVATAR */}
            <div className="flex items-center gap-3 group">
              <HoloOrb3D isStreaming={loading} size="sm" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                    Laksh AI
                  </span>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-mono font-medium text-cyan-300">
                    Production v2.0
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-medium text-slate-400">
                    Candidate Intelligence & Deterministic Matching
                  </span>
                </div>
              </div>
            </div>

            {/* HEADER ACTIONS */}
            <div className="flex items-center gap-3">
              {mode === "chat" ? (
                <button
                  type="button"
                  onClick={clearChat}
                  disabled={loading}
                  aria-label="Clear conversation history"
                  className="btn-3d flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-medium text-slate-300 hover:border-white/20 hover:text-white disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Reset Session</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearMatch}
                  disabled={matchLoading}
                  aria-label="Clear analysis workspace"
                  className="btn-3d flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-medium text-slate-300 hover:border-white/20 hover:text-white disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Clear Input</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          PERSPECTIVE MODE SWITCHER
      ======================================================== */}
      <nav aria-label="Application View Switcher" className="relative z-20 border-b border-white/[0.05] bg-[#070b14]/70 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-8">
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[#090e1a]/90 p-1.5 shadow-xl shadow-black/40">
            <button
              type="button"
              onClick={() => setMode("chat")}
              aria-pressed={mode === "chat"}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                mode === "chat"
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-white/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Interactive Dialogue</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("match")}
              aria-pressed={mode === "match"}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                mode === "match"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-600/30 border border-white/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Deterministic Job Match</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================
          CHAT MODE
      ======================================================== */}
      {mode === "chat" && (
        <main className="relative z-10 flex min-h-[calc(100vh-14rem)] flex-col">
          <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:py-8 sm:px-8">
            {/* HERO INTRODUCTION (When only 1 message or empty) */}
            {messages.length <= 1 && (
              <div className="mb-8 text-center">
                <div className="flex justify-center mb-5">
                  <HoloOrb3D isStreaming={loading} size="lg" />
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3.5 py-1 backdrop-blur-md mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-300">
                    Verified Candidate Representative
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Discover <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Laksh Raj</span>
                </h1>

                <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-400">
                  Full-Stack Software Engineer • B.Tech in IT • Specializing in Python, FastAPI, Node.js, and secure multi-tier architectural design.
                </p>

                {/* QUICK PROMPT CHIPS */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {quickPrompts.map((item, idx) => (
                    <TiltCard
                      key={idx}
                      tiltAmount={5}
                      onClick={() => sendMessage(item.prompt)}
                      className="cursor-pointer border border-white/10 bg-slate-900/60 p-3.5 sm:p-4 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-white/5 p-2 border border-white/10 shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xs text-slate-400 leading-snug line-clamp-2">
                            {item.prompt}
                          </p>
                        </div>
                      </div>
                    </TiltCard>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES CONTAINER */}
            <div className="space-y-5 pb-6">
              {messages.map((message, index) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="mt-1 shrink-0 hidden sm:block">
                        <HoloOrb3D isStreaming={message.isStreaming} size="sm" />
                      </div>
                    )}

                    <div className={isUser ? "w-fit max-w-[92%] sm:max-w-[80%]" : "w-full max-w-3xl"}>
                      {/* ROLE & METADATA BAR */}
                      <div className={`mb-1.5 flex items-center gap-2 px-1 text-[11px] text-slate-400 ${isUser ? "justify-end" : "justify-start"}`}>
                        <span className="font-semibold uppercase tracking-wider text-slate-300">
                          {isUser ? "You" : "Laksh AI"}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-slate-400">{message.timestamp || "Active"}</span>
                      </div>

                      {/* MESSAGE BUBBLE */}
                      {isUser ? (
                        <div
                          className="rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 px-4 py-3 sm:px-5 sm:py-3.5 text-sm leading-relaxed text-white shadow-lg shadow-indigo-950/40 border border-indigo-400/30"
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ) : (
                        <div className="cyber-card-3d rounded-2xl rounded-tl-sm p-4 sm:p-6">
                          <div className="relative">
                            {message.isStreaming && !message.content ? (
                              <div className="flex items-center gap-3 py-2 text-cyan-400">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                                <span className="text-xs font-mono font-medium tracking-wide">
                                  Querying candidate profile...
                                </span>
                              </div>
                            ) : (
                              <MarkdownView content={message.content} />
                            )}

                            {/* Streaming indicator */}
                            {message.isStreaming && (
                              <div className="mt-3 flex items-center gap-1.5 border-t border-white/5 pt-2.5">
                                <span className="h-2 w-1 bg-cyan-400 animate-pulse" />
                                <span className="h-3 w-1 bg-cyan-400 animate-pulse delay-75" />
                                <span className="h-2 w-1 bg-cyan-400 animate-pulse delay-150" />
                                <span className="ml-2 text-[11px] font-mono text-cyan-400">
                                  Streaming response
                                </span>
                              </div>
                            )}

                            {/* Quick Action footer */}
                            {!message.isStreaming && message.content && (
                              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-slate-400">
                                <span className="font-mono text-[10px] text-slate-500">
                                  Verified Profile Grounded
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyMessage(message.content, index)}
                                  aria-label="Copy response"
                                  className="flex items-center gap-1 rounded-md px-2 py-1 text-slate-400 hover:bg-white/5 hover:text-white transition"
                                >
                                  {copiedMsgIndex === index ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* ========================================================
              CHAT INPUT CONSOLE
          ======================================================== */}
          <div className="sticky bottom-0 z-30 border-t border-white/[0.08] bg-[#05070e]/95 backdrop-blur-2xl py-3 sm:py-4">
            <div className="mx-auto max-w-4xl px-4 sm:px-8">
              <div className="relative rounded-2xl border border-white/12 bg-[#0a0f1e]/90 p-2 shadow-xl focus-within:border-cyan-400/50 focus-within:ring-2 focus-within:ring-cyan-500/20">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    id="chat-input-textarea"
                    aria-label="Ask about Laksh's profile, projects, or skills"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Laksh's projects, tech stack, or engineering experience..."
                    rows={1}
                    disabled={loading}
                    className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    aria-label="Send message"
                    className="btn-3d flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold transition hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-cyan-600/20"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Press <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-slate-300">Enter</kbd> to send, <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-slate-300">Shift + Enter</kbd> for newline</span>
                <span className="hidden sm:inline font-mono text-cyan-400/80">Deterministic Backend Grounding</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================
          JOB MATCH MODE
      ======================================================== */}
      {mode === "match" && (
        <main className="relative z-10 flex-1 py-6 sm:py-10">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-8">
            {/* HERO BANNER */}
            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 backdrop-blur-md mb-3">
                <Compass className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-xs font-medium text-sky-300">
                  Precision Deterministic Match Matrix
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Job Fit & Recruitment Analyzer
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                Paste any job description to instantly execute deterministic evaluation against Laksh's verified technical profile and project deliverables.
              </p>

              {/* QUICK TEST TEMPLATES */}
              <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Quick Templates:
                </span>
                {sampleJDs.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setJobDescription(sample.content);
                      setMatchValidationError("");
                    }}
                    className="btn-3d rounded-lg border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:border-cyan-500/40 hover:text-white transition"
                  >
                    ⚡ {sample.title}
                  </button>
                ))}
              </div>
            </div>

            {/* JD INPUT CARD */}
            <div className="cyber-card-3d p-5 sm:p-7 mb-8 rounded-2xl">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <label htmlFor="jd-textarea" className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-cyan-400" />
                    Target Job Description Specification
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Include roles, technology stack, backend APIs, and experience prerequisites.
                  </p>
                </div>
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                  {jobDescription.length} chars
                </span>
              </div>

              <textarea
                id="jd-textarea"
                aria-label="Job description text input"
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  if (matchValidationError) setMatchValidationError("");
                }}
                placeholder="Paste job description here or pick one of the quick templates above..."
                rows={7}
                disabled={matchLoading}
                className="w-full resize-y rounded-xl border border-white/10 bg-[#060912] p-4 text-sm font-mono text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-500/30 transition disabled:opacity-50"
              />

              {matchValidationError && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>{matchValidationError}</span>
                </div>
              )}

              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Strict zero-hallucination deterministic matching</span>
                </div>

                <button
                  type="button"
                  onClick={analyzeCandidate}
                  disabled={matchLoading}
                  aria-label="Analyze Job Description Fit"
                  className="btn-3d flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {matchLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Evaluating Match...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Analyze Alignment</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ERROR ALERT */}
            {matchResult?.error && (
              <div className="mb-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 shadow-xl backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-bold text-rose-200">Analysis Notice</h2>
                    <p className="mt-1 text-xs text-rose-300/80 leading-relaxed">
                      {matchResult.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* MATCH RESULTS SECTION */}
            {matchResult && !matchResult.error && (
              <div className="space-y-6">
                {/* SCORE OVERVIEW CARD */}
                <div className="cyber-card-3d p-6 sm:p-8 rounded-2xl">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-3 text-center md:text-left">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono text-cyan-300">
                        <Zap className="h-3 w-3 text-cyan-400" />
                        <span>Deterministic Score Calculation</span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                        Match Suitability Index
                      </h2>

                      <p className="text-sm text-slate-400 max-w-md">
                        Laksh matched{" "}
                        <strong className="text-cyan-300 font-mono">
                          {matchResult.matched_skills_count ?? matchResult.matched_required_skills?.length ?? 0}
                        </strong>{" "}
                        out of{" "}
                        <strong className="text-slate-200 font-mono">
                          {matchResult.required_skills_count ?? matchResult.required_skills?.length ?? 0}
                        </strong>{" "}
                        mandatory required technical competencies detected in this requisition.
                      </p>

                      <div className="pt-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold tracking-wide ${
                          matchResult.score >= 75
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : matchResult.score >= 50
                            ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
                            : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                        }`}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {matchResult.score >= 75
                            ? "High Alignment — Strong Candidate"
                            : matchResult.score >= 50
                            ? "Moderate Alignment — Good Potential"
                            : "Partial Alignment — Core Gaps Identified"}
                        </span>
                      </div>
                    </div>

                    {/* SCORE GAUGE METER */}
                    <div className="shrink-0">
                      <ScoreGauge3D score={matchResult.score} size={180} />
                    </div>
                  </div>
                </div>

                {/* 4 DISTINCT SKILL BREAKDOWN CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 1. MATCHED REQUIRED SKILLS */}
                  <div className="cyber-card-3d p-5 rounded-2xl border-l-4 border-l-emerald-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-1.5 text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Matched Required</h3>
                          <p className="text-[11px] text-slate-400">Verified mandatory skills matched</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300">
                        {matchResult.matched_required_skills?.length || 0}
                      </span>
                    </div>

                    {matchResult.matched_required_skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {matchResult.matched_required_skills.map((skill, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-medium text-emerald-300"
                          >
                            <Check className="h-3 w-3 text-emerald-400 stroke-[3]" />
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No required skills were matched.</p>
                    )}
                  </div>

                  {/* 2. MISSING REQUIRED SKILLS */}
                  <div className="cyber-card-3d p-5 rounded-2xl border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-1.5 text-amber-400">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Missing Required</h3>
                          <p className="text-[11px] text-slate-400">Required skills not in candidate profile</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300">
                        {matchResult.missing_required_skills?.length || 0}
                      </span>
                    </div>

                    {matchResult.missing_required_skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {matchResult.missing_required_skills.map((skill, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-mono font-medium text-amber-300"
                          >
                            <span className="font-bold text-amber-400">!</span>
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-400/90 font-medium">✓ All required skills satisfied (0 missing).</p>
                    )}
                  </div>

                  {/* 3. MATCHED OPTIONAL SKILLS */}
                  <div className="cyber-card-3d p-5 rounded-2xl border-l-4 border-l-cyan-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-1.5 text-cyan-400">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Matched Optional</h3>
                          <p className="text-[11px] text-slate-400">Bonus skills that add candidate value</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-300">
                        {matchResult.matched_optional_skills?.length || 0}
                      </span>
                    </div>

                    {matchResult.matched_optional_skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {matchResult.matched_optional_skills.map((skill, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-mono font-medium text-cyan-300"
                          >
                            <span>✦</span>
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No secondary bonus skills matched.</p>
                    )}
                  </div>

                  {/* 4. MISSING OPTIONAL SKILLS */}
                  <div className="cyber-card-3d p-5 rounded-2xl border-l-4 border-l-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-slate-800 border border-slate-700 p-1.5 text-slate-400">
                          <HelpCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Missing Optional</h3>
                          <p className="text-[11px] text-slate-400">Nice-to-have skills not specified in profile</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-400">
                        {matchResult.missing_optional_skills?.length || 0}
                      </span>
                    </div>

                    {matchResult.missing_optional_skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {matchResult.missing_optional_skills.map((skill, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-2.5 py-1 text-xs font-mono font-medium text-slate-400"
                          >
                            <span>·</span>
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No unfulfilled optional skills.</p>
                    )}
                  </div>
                </div>

                {/* EXECUTIVE RECOMMENDATION */}
                <div className="cyber-card-3d p-6 sm:p-7 rounded-2xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400">
                        Recruitment Verdict
                      </span>
                      <h3 className="text-xl font-extrabold text-white">
                        {matchResult.recommendation}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                        Deterministic outcome calculated using exact skillset overlap against Laksh's verified technical profile and project experience.
                      </p>
                    </div>

                    <div className={`shrink-0 rounded-xl border px-5 py-2.5 text-sm font-bold ${
                      matchResult.recommendation === "Interview Recommended"
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-400/30 bg-rose-500/10 text-rose-300"
                    }`}>
                      {matchResult.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ========================================================
          FOOTER
      ======================================================== */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#03050a]/90 py-5 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FastAPI Backend 2.0 • Deterministic Verification</span>
          </div>

          <p className="font-mono text-[11px] text-slate-500">
            Laksh Raj • Information Technology (2027)
          </p>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Latency: &lt;50ms</span>
            <span>Grounding: 100% Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}