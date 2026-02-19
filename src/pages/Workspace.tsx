import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { apiStream } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-secondary overflow-hidden my-3 animate-scale-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <span className="text-xs font-mono text-muted-foreground">{lang || "code"}</span>
        <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors duration-200">
          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={lastIndex} className="whitespace-pre-wrap">
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    parts.push(<CodeBlock key={match.index} lang={match[1]} code={match[2]} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={lastIndex} className="whitespace-pre-wrap">
        {text.slice(lastIndex)}
      </span>
    );
  }

  return parts;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-primary animate-typing-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-6">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 sm:mb-6 animate-float">
        <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
      </div>
      <h2 className="text-lg sm:text-xl font-semibold mb-2 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        AetherCampus Workspace
      </h2>
      <p className="text-sm text-muted-foreground max-w-md opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        Start a conversation with your connected backend model.
      </p>
    </div>
  );
}

export default function Workspace() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);
    setError(null);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    await apiStream(
      "/chat",
      { messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })) },
      {
        onChunk: (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: updated[updated.length - 1].content + chunk,
            };
            return updated;
          });
        },
        onDone: () => setIsStreaming(false),
        onError: (err) => {
          setError(err);
          setIsStreaming(false);
        },
      }
    );
  }, [input, isStreaming, messages]);

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-3.5rem)]">
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex animate-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                style={{ animationDelay: "0.05s" }}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed transition-all duration-300 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  }`}
                >
                  {msg.role === "assistant" && msg.content === "" && isStreaming ? (
                    <TypingIndicator />
                  ) : msg.role === "assistant" ? (
                    renderMarkdown(msg.content)
                  ) : (
                    msg.content
                  )}
                  {msg.role === "assistant" && isStreaming && msg.content !== "" && i === messages.length - 1 && (
                    <span className="inline-block w-2 h-5 bg-primary animate-pulse-glow ml-1 rounded-sm" />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="px-3 sm:px-6 py-2 animate-slide-up">
          <div className="max-w-3xl mx-auto text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2 border border-destructive/20">
            {error}
          </div>
        </div>
      )}

      <div className="border-t border-border bg-card/50 backdrop-blur-xl px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto flex items-end gap-2 sm:gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your prompt..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="p-2.5 sm:p-3 rounded-xl bg-primary text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:shadow-none hover-scale"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
