import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

export default function MarkdownView({ content }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const copyToClipboard = (text, index) => { navigator.clipboard.writeText(text); setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); };
  return <div className="markdown-view"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeString = String(children).replace(/\n$/, "");
      const codeId = `${codeString}-${match?.[1] || "inline"}`;
      if (!inline && match) return <div className="markdown-code"><div className="markdown-code-header"><span>{match[1]}</span><button type="button" onClick={() => copyToClipboard(codeString, codeId)}>{copiedIndex === codeId ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}</button></div><pre><code>{children}</code></pre></div>;
      return <code className="markdown-inline-code" {...props}>{children}</code>;
    },
    table({ children }) { return <div className="markdown-table"><table>{children}</table></div>; },
  }}>{content}</ReactMarkdown></div>;
}
