import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

export default function MarkdownView({ content }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-100 prose-p:leading-relaxed prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-cyan-300 prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-a:underline prose-table:text-xs">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            const codeId = Math.random();

            if (!inline && match) {
              return (
                <div className="group relative my-3 overflow-hidden rounded-xl border border-white/10 bg-[#070b14] shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/60 px-4 py-1.5 text-[11px] font-mono text-slate-400">
                    <span className="uppercase text-cyan-400 font-semibold">{match[1]}</span>
                    <button
                      onClick={() => copyToClipboard(codeString, codeId)}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-white/10 hover:text-white transition"
                    >
                      {copiedIndex === codeId ? (
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
                  <pre className="overflow-x-auto p-4 font-mono text-xs text-slate-200">
                    <code>{children}</code>
                  </pre>
                </div>
              );
            }

            return (
              <code
                className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-xs text-cyan-300 border border-white/10"
                {...props}
              >
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/30">
                <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2 text-slate-300 border-t border-white/5">
                {children}
              </td>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
