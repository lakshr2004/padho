import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  FileText,
  HelpCircle,
  MessageSquare,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import MarkdownView from "./components/MarkdownView";

const sampleJDs = [
  {
    title: "Backend Python Engineer",
    content: `Role: Backend Python Developer
Requirements:
- Python 3+ and FastAPI
- REST API Design and Microservices
- PostgreSQL, MongoDB, SQL queries
- JWT Authentication and Role-Based Access Control (RBAC)
- Git, GitHub, Version Control
- Docker, Cloud deployment (Render or Vercel)
Nice to have:
- Basic Machine Learning with NumPy and Pandas
- Automated testing and security validation`,
  },
  {
    title: "Full-Stack Web Developer",
    content: `Role: Full Stack Software Engineer
Requirements:
- JavaScript, Node.js, Express.js
- React and Vite Modern Frontend
- REST API Design
- Database schema design (PostgreSQL/MongoDB)
- Security Checks, Input Validation, and bcrypt
- Deployment on Vercel / Render
Nice to have:
- Python scripting
- Manual Test-Case Design and QA suites`,
  },
];

const quickPrompts = [
  { label: "Technical stack", prompt: "What is your primary tech stack, programming languages, and backend frameworks?" },
  { label: "Monetrik project", prompt: "Explain the Monetrik Full-Stack Finance Dashboard: what architecture and security tiers did you build?" },
  { label: "Security and QA", prompt: "How do you implement Role-Based Access Control (RBAC), input validation, and test cases in your projects?" },
  { label: "Education and profile", prompt: "Tell me about your academic background at Asansol Engineering College and your technical focus." },
];

const panelClass = "border border-white/[0.08] bg-[#101012]";
const mutedText = "text-sm leading-6 text-zinc-400";

function StatusDot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-[#ff3347] shadow-[0_0_0_3px_rgba(255,51,71,0.12)]" aria-hidden="true" />;
}

function SectionLabel({ children }) {
  return <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ff5261]">{children}</p>;
}

function SkillGroup({ title, description, skills, tone, icon: Icon, emptyText }) {
  const toneStyles = {
    matched: "border-t-[#ff3347] text-[#ff6170]",
    missing: "border-t-[#8b2636] text-[#c79aa0]",
    optional: "border-t-[#7f3340] text-[#d77280]",
    neutral: "border-t-white/10 text-zinc-500",
  };
  return (
    <section className={`min-h-39.5 border-t-2 bg-[#101012] p-5 ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/4 text-current"><Icon size={15} /></span>
          <div><h3 className="mb-1 font-[Space_Grotesk] text-sm font-semibold text-zinc-100">{title}</h3><p className="text-[11px] leading-4 text-zinc-500">{description}</p></div>
        </div>
        <span className="font-mono text-xs text-zinc-500">{skills?.length || 0}</span>
      </div>
      {skills?.length ? <div className="mt-5 flex flex-wrap gap-1.5">{skills.map((skill, index) => <span className="inline-flex max-w-full items-center gap-1 rounded border border-white/10 bg-white/2.5 px-2 py-1 text-[11px] text-zinc-300" key={`${skill}-${index}`}>{tone === "matched" && <Check size={12} className="text-[#ff5261]" />}{skill}</span>)}</div> : <p className="mt-5 text-xs italic text-zinc-600">{emptyText}</p>}
    </section>
  );
}

export default function App() {
  const [mode, setMode] = useState("chat");
  const [messages, setMessages] = useState([{ role: "assistant", content: "I can answer questions about Laksh's verified profile, projects, education, and technical experience. Ask me about his full-stack work, FastAPI and Python expertise, or system design capabilities.", isStreaming: false, timestamp: "Ready" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedMsgIndex, setCopiedMsgIndex] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchValidationError, setMatchValidationError] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const sendMessage = async (overridePrompt) => {
    const textToSend = typeof overridePrompt === "string" ? overridePrompt : input;
    if (!textToSend.trim() || loading) return;
    const question = textToSend.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((previous) => [...previous, { role: "user", content: question, isStreaming: false, timestamp: timeNow }, { role: "assistant", content: "", isStreaming: true, timestamp: timeNow }]);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
      if (!response.body) throw new Error("Streaming response not supported by server");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((previous) => { const updated = [...previous]; const lastMessage = updated[updated.length - 1]; updated[updated.length - 1] = { ...lastMessage, content: `${lastMessage.content}${chunk}` }; return updated; });
      }
      setMessages((previous) => { const updated = [...previous]; updated[updated.length - 1] = { ...updated[updated.length - 1], isStreaming: false }; return updated; });
    } catch (error) {
      console.error(error);
      setMessages((previous) => { const updated = [...previous]; updated[updated.length - 1] = { role: "assistant", content: "**Connection notice**: Unable to connect to the FastAPI backend at `http://127.0.0.1:8000`. Please verify that the server is running.", isStreaming: false, timestamp: timeNow }; return updated; });
    } finally { setLoading(false); setTimeout(() => textareaRef.current?.focus(), 50); }
  };

  const clearChat = () => setMessages([{ role: "assistant", content: "Session refreshed. I am ready to answer questions about Laksh's skills, credentials, and achievements.", isStreaming: false, timestamp: "Ready" }]);
  const copyMessage = (content, index) => { navigator.clipboard.writeText(content); setCopiedMsgIndex(index); setTimeout(() => setCopiedMsgIndex(null), 2000); };

  const analyzeCandidate = async () => {
    const trimmed = jobDescription.trim();
    if (!trimmed) { setMatchValidationError("Please provide a job description to analyze."); return; }
    if (trimmed.length < 20) { setMatchValidationError("Job description must contain at least 20 characters for deterministic evaluation."); return; }
    setMatchValidationError(""); setMatchLoading(true); setMatchResult(null);
    try {
      const response = await fetch("http://127.0.0.1:8000/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_description: trimmed }) });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = Array.isArray(errorData?.detail) ? errorData.detail.map((item) => item?.msg).filter(Boolean).join(" ") || "Candidate analysis failed." : errorData?.detail || "Candidate analysis failed.";
        throw new Error(message);
      }
      setMatchResult(await response.json());
    } catch (error) { console.error(error); setMatchResult({ error: error.message || "Could not analyze the job description. Ensure the FastAPI backend is online." }); }
    finally { setMatchLoading(false); }
  };

  const clearMatch = () => { setJobDescription(""); setMatchResult(null); setMatchValidationError(""); };
  const score = matchResult?.score ?? 0;
  const scoreLabel = score >= 75 ? "High alignment" : score >= 50 ? "Moderate alignment" : "Partial alignment";
  const scoreColor = score >= 75 ? "#ff3347" : score >= 50 ? "#d77280" : "#8b2636";

  return (
    <div className="min-h-screen bg-[#070707] text-zinc-100 selection:bg-[#ff3347]/30 selection:text-white">
      <header className="sticky top-0 z-20 border-b border-white/8 bg-[#070707]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-[min(1120px,calc(100%-32px))] items-center justify-between gap-6">
          <button type="button" className="group flex items-center gap-2.5 text-left" onClick={() => setMode("chat")} aria-label="Open Laksh AI chat"><span className="grid h-8 w-8 place-items-center rounded-md bg-[#ff3347] font-[Space_Grotesk] font-bold text-[#070707] transition group-hover:bg-[#ff5261]">L</span><span className="flex flex-col"><strong className="font-[Space_Grotesk] text-sm tracking-tight text-zinc-100">Laksh AI</strong><small className="text-[10px] text-zinc-500">Candidate intelligence</small></span></button>
          <nav className="flex items-center gap-1" aria-label="Primary navigation"><button type="button" className={`inline-flex items-center gap-2 border-b-2 px-3 py-5 text-xs font-semibold transition ${mode === "chat" ? "border-[#ff3347] text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"}`} onClick={() => setMode("chat")} aria-current={mode === "chat" ? "page" : undefined}><MessageSquare size={14} /> Chat</button><button type="button" className={`inline-flex items-center gap-2 border-b-2 px-3 py-5 text-xs font-semibold transition ${mode === "match" ? "border-[#ff3347] text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"}`} onClick={() => setMode("match")} aria-current={mode === "match" ? "page" : undefined}><BriefcaseBusiness size={14} /> Job match</button></nav>
          <div className="hidden items-center gap-2 text-[10px] text-zinc-500 sm:flex"><StatusDot /> Profile verified</div>
        </div>
      </header>

      <main className="mx-auto w-[min(960px,calc(100%-32px))] py-12 sm:py-20">
        {mode === "chat" ? <section aria-labelledby="chat-title">
          <div className="mb-12 flex items-start justify-between gap-8"><div><SectionLabel>Candidate representative</SectionLabel><h1 id="chat-title" className="max-w-2xl font-[Space_Grotesk] text-4xl font-semibold tracking-[-0.055em] text-zinc-100 sm:text-5xl">Get clear answers about Laksh.</h1><p className={`mt-4 max-w-xl ${mutedText}`}>Ask about experience, projects, education, or the technical decisions behind the work.</p></div><button type="button" className="mt-1 inline-flex shrink-0 items-center gap-2 border border-white/[0.1] px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-[#ff3347]/50 hover:text-zinc-100 disabled:opacity-40" onClick={clearChat} disabled={loading}><RotateCcw size={14} /> <span className="hidden sm:inline">Reset</span></button></div>
          {messages.length === 1 && <div className="mb-12"><div className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600"><span>Start with a question</span><span className="h-px flex-1 bg-white/8" /></div><div className="grid gap-2 sm:grid-cols-2">{quickPrompts.map((item) => <button type="button" className={`${panelClass} group grid min-h-19.5 grid-cols-[1fr_auto] gap-x-4 gap-y-2 p-4 text-left transition hover:border-[#ff3347]/40 hover:bg-[#16090c]`} key={item.label} onClick={() => sendMessage(item.prompt)}><span className="text-sm font-semibold text-zinc-200">{item.label}</span><ArrowUpRight size={15} className="text-[#ff5261] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /><small className="col-span-2 text-xs leading-5 text-zinc-500">{item.prompt}</small></button>)}</div></div>}
          <div className="space-y-8" aria-live="polite">{messages.map((message, index) => { const isUser = message.role === "user"; return <article className={`max-w-3xl ${isUser ? "ml-auto" : ""}`} key={`${message.timestamp}-${index}`}><div className={`mb-2 flex items-center gap-2 text-[10px] text-zinc-600 ${isUser ? "justify-end" : ""}`}><span className="font-semibold text-zinc-400">{isUser ? "You" : "Laksh AI"}</span><time>{message.timestamp || "Active"}</time></div><div className={`${panelClass} ${isUser ? "border-[#7f1d2d] bg-[#16090c]" : "rounded-tr-xl"} p-5`}>{message.isStreaming && !message.content ? <div className="flex items-center gap-2 text-xs text-[#ff5261]"><span className="h-3 w-3 animate-spin rounded-full border-2 border-[#8b2636] border-t-[#ff3347]" /> Reading the verified profile...</div> : isUser ? <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{message.content}</p> : <MarkdownView content={message.content} />}</div>{!isUser && message.isStreaming && <div className="mt-2 text-[10px] text-[#ff5261]">Generating response</div>}{!isUser && !message.isStreaming && message.content && <div className="mt-2 flex items-center justify-between gap-4 text-[10px] text-zinc-600"><span className="inline-flex items-center gap-1.5"><ShieldCheck size={12} /> Grounded in verified profile</span><button type="button" className="inline-flex items-center gap-1.5 text-zinc-500 transition hover:text-[#ff5261]" onClick={() => copyMessage(message.content, index)} aria-label="Copy response">{copiedMsgIndex === index ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}</button></div>}</article>; })}<div ref={messagesEndRef} /></div>
          <div className="sticky bottom-4 z-10 mt-12"><div className="flex items-end gap-3 border border-white/12 bg-[#101012] p-2 pl-4 shadow-2xl shadow-black/30 transition focus-within:border-[#ff3347]/50 focus-within:ring-2 focus-within:ring-[#ff3347]/10"><textarea ref={textareaRef} id="chat-input-textarea" aria-label="Ask about Laksh's profile, projects, or skills" className="min-h-10 max-h-36 flex-1 resize-none bg-transparent py-2 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Ask a question about the candidate..." rows={1} disabled={loading} /><button type="button" className="grid h-10 w-10 shrink-0 place-items-center bg-[#ff3347] text-[#070707] transition hover:bg-[#ff5261] disabled:cursor-not-allowed disabled:opacity-30" onClick={() => sendMessage()} disabled={!input.trim() || loading} aria-label="Send message">{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#070707]/30 border-t-[#070707]" /> : <Send size={16} />}</button></div><p className="mt-2 flex justify-between px-1 text-[10px] text-zinc-600"><span>Enter to send</span><span className="hidden sm:inline">Shift + Enter for a new line</span></p></div>
        </section> : <section aria-labelledby="match-title">
          <div className="mb-10 flex items-start justify-between gap-8"><div><SectionLabel>Recruitment analysis</SectionLabel><h1 id="match-title" className="max-w-2xl font-[Space_Grotesk] text-4xl font-semibold tracking-[-0.055em] text-zinc-100 sm:text-5xl">Measure role fit with evidence.</h1><p className={`mt-4 max-w-xl ${mutedText}`}>Paste a job description to compare its requirements with the verified candidate profile.</p></div><button type="button" className="mt-1 inline-flex shrink-0 items-center gap-2 border border-white/[0.1] px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-[#ff3347]/50 hover:text-zinc-100 disabled:opacity-40" onClick={clearMatch} disabled={matchLoading}><RotateCcw size={14} /> <span className="hidden sm:inline">Clear</span></button></div>
          <div className={`${panelClass} p-5 sm:p-6`}><div className="flex items-start justify-between gap-4"><div><label htmlFor="jd-textarea" className="flex items-center gap-2 text-sm font-semibold text-zinc-200"><FileText size={15} className="text-[#ff5261]" /> Job description</label><p className="mt-1 text-xs text-zinc-500">Use the complete posting for the clearest comparison.</p></div><span className="font-mono text-[10px] text-zinc-600">{jobDescription.length} characters</span></div><textarea id="jd-textarea" aria-label="Job description text input" className="mt-5 block w-full resize-y border border-white/8 bg-[#0b0b0d] p-4 font-mono text-xs leading-6 text-zinc-300 outline-none transition placeholder:text-zinc-700 focus:border-[#ff3347]/60 focus:ring-2 focus:ring-[#ff3347]/10" value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); if (matchValidationError) setMatchValidationError(""); }} placeholder="Paste a job description here..." rows={8} disabled={matchLoading} />{matchValidationError && <div className="mt-3 flex items-start gap-2 border border-[#8b2636]/60 bg-[#16090c] p-3 text-xs text-[#e5a5ac]"><AlertCircle size={15} className="mt-0.5 shrink-0 text-[#ff5261]" /><span>{matchValidationError}</span></div>}<div className="mt-5 flex flex-col items-start justify-between gap-4 border-t border-white/8 pt-5 sm:flex-row sm:items-center"><span className="inline-flex items-center gap-2 text-[11px] text-[#c77b84]"><ShieldCheck size={14} /> Deterministic matching. No generated scoring.</span><button type="button" className="inline-flex w-full items-center justify-center gap-2 bg-[#ff3347] px-4 py-2.5 text-xs font-bold text-[#070707] transition hover:bg-[#ff5261] disabled:opacity-40 sm:w-auto" onClick={analyzeCandidate} disabled={matchLoading}>{matchLoading ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#070707]/30 border-t-[#070707]" /> Analyzing</> : <><Target size={15} /> Analyze fit</>}</button></div><div className="mt-5 flex flex-col gap-2 border-t border-white/8 pt-4 text-[10px] text-zinc-600 sm:flex-row sm:items-center"><span>Try a template</span>{sampleJDs.map((sample) => <button type="button" key={sample.title} className="inline-flex w-fit items-center gap-1.5 text-zinc-500 transition hover:text-[#ff5261]" onClick={() => { setJobDescription(sample.content); setMatchValidationError(""); }}><Clipboard size={12} /> {sample.title}</button>)}</div></div>
          {matchResult?.error && <div className="mt-6 flex items-start gap-3 border border-[#8b2636]/60 bg-[#16090c] p-4 text-sm text-[#e5a5ac]"><AlertCircle size={17} className="shrink-0 text-[#ff5261]" /><div><strong className="text-[#ff8792]">Analysis unavailable</strong><p className="mt-1 text-xs leading-5 text-[#c77b84]">{matchResult.error}</p></div><button type="button" className="ml-auto text-[#c77b84] hover:text-white" onClick={() => setMatchResult(null)} aria-label="Dismiss analysis error"><X size={15} /></button></div>}
          {matchResult && !matchResult.error && <div className="mt-12" aria-live="polite"><div className={`${panelClass} flex flex-col items-start justify-between gap-8 p-6 sm:flex-row sm:items-center sm:p-8`}><div><SectionLabel>Match suitability index</SectionLabel><div className="font-[Space_Grotesk] text-6xl font-semibold tracking-[-0.08em] text-zinc-100">{score}<span className="ml-1 text-2xl text-[#ff3347]">%</span></div><h2 className="mt-3 font-[Space_Grotesk] text-xl font-semibold text-zinc-100">{scoreLabel}</h2><p className="mt-1 text-xs text-zinc-500"><strong className="text-zinc-300">{matchResult.matched_skills_count ?? matchResult.matched_required_skills?.length ?? 0}</strong> of <strong className="text-zinc-300">{matchResult.required_skills_count ?? matchResult.required_skills?.length ?? 0}</strong> required skills matched.</p></div><div className="relative grid h-36 w-36 shrink-0 place-items-center self-center rounded-full" style={{ background: `conic-gradient(${scoreColor} ${score}%, #241015 0)` }}><div className="absolute inset-2 rounded-full bg-[#101012]" /><div className="relative flex flex-col items-center"><strong className="font-[Space_Grotesk] text-3xl text-zinc-100">{score}</strong><span className="text-[10px] text-zinc-600">out of 100</span></div></div></div><div className="mb-4 mt-12 flex items-end justify-between"><div><SectionLabel>Evidence breakdown</SectionLabel><h2 className="font-[Space_Grotesk] text-2xl font-semibold tracking-tight text-zinc-100">Skills in context</h2></div><span className="text-[10px] text-zinc-600">Four distinct signals</span></div><div className="grid gap-3 md:grid-cols-2"><SkillGroup title="Matched required" description="Mandatory skills found in the profile" skills={matchResult.matched_required_skills} tone="matched" icon={CheckCircle2} emptyText="No required skills matched." /><SkillGroup title="Missing required" description="Mandatory skills not found in the profile" skills={matchResult.missing_required_skills} tone="missing" icon={AlertCircle} emptyText="All required skills are satisfied." /><SkillGroup title="Matched optional" description="Additional skills that strengthen fit" skills={matchResult.matched_optional_skills} tone="optional" icon={Sparkles} emptyText="No optional skills matched." /><SkillGroup title="Missing optional" description="Nice-to-have skills not specified" skills={matchResult.missing_optional_skills} tone="neutral" icon={HelpCircle} emptyText="No optional gaps identified." /></div><div className={`${panelClass} mt-8 flex flex-col items-start justify-between gap-5 border-l-2 border-l-[#ff3347] p-6 sm:flex-row sm:items-center`}><div><SectionLabel>Recruitment verdict</SectionLabel><h2 className="font-[Space_Grotesk] text-xl font-semibold text-zinc-100">{matchResult.recommendation}</h2><p className="mt-1 text-xs leading-5 text-zinc-500">Calculated from exact skill overlap against Laksh's verified profile and project experience.</p></div><span className="border border-[#8b2636] bg-[#16090c] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#ff6170]">{matchResult.recommendation}</span></div></div>}
        </section>}
      </main>

      <footer className="border-t border-white/8 bg-[#0b0b0d]"><div className="mx-auto flex w-[min(1120px,calc(100%-32px))] flex-col gap-2 py-5 text-[10px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between"><span className="inline-flex items-center gap-2"><StatusDot /> FastAPI profile connection</span><span>Information Technology candidate profile</span><span>Deterministic verification enabled</span></div></footer>
    </div>
  );
}
