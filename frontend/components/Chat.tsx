"use client";

import { useState, type FormEvent } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type {
  ChatMessage,
  SavingsGoal,
  Subscription,
  SpendingSummary,
} from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface ChatProps {
  goals: SavingsGoal[];
  subscriptions: Subscription[];
  spending: SpendingSummary;
}

export default function Chat({ goals, subscriptions, spending }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm SpendSense, your AI financial assistant. Ask me about your spending, subscriptions, or savings goals!",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.sendChat(
        message,
        assistantId,
        threadId,
        goals,
        subscriptions,
        spending,
      );

      setAssistantId(response.assistant_id);
      setThreadId(response.thread_id);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't connect to the AI assistant. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startNewConversation() {
    setThreadId(null);
    setMessages([
      {
        role: "assistant",
        content: "New conversation started! What would you like to discuss?",
      },
    ]);
  }

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Bot className="text-indigo-600" size={24} />
          <div>
            <h2 className="font-semibold text-gray-900">SpendSense AI</h2>
            <p className="text-xs text-gray-500">
              Your personal financial assistant
            </p>
          </div>
        </div>

        <button
          onClick={startNewConversation}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <Bot className="mt-2 shrink-0 text-indigo-600" size={20} />
            )}

            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                message.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 bg-white text-gray-800"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="text-sm leading-relaxed [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1">
                  <ReactMarkdown
                    remarkPlugins={[
                      remarkGfm,
                      [remarkMath, { singleDollarTextMath: false }],
                    ]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>

            {message.role === "user" && (
              <User className="mt-2 shrink-0 text-gray-500" size={20} />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="animate-spin" size={18} />
            SpendSense is thinking...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-gray-200 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your finances..."
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-indigo-600 px-4 text-white hover:bg-indigo-700 disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
