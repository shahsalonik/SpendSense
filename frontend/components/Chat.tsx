"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Bot, User, Loader2, History, Trash2, X } from "lucide-react";
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

interface SavedChat {
  id: string;
  title: string;
  messages: ChatMessage[];
  threadId: string | null;
  assistantId: string | null;
}

const HISTORY_KEY = "spendsense-chat-history";

function isSavedChat(value: unknown): value is SavedChat {
  if (!value || typeof value !== "object") return false;
  const chat = value as Partial<SavedChat>;
  return typeof chat.id === "string" && typeof chat.title === "string" &&
    (chat.threadId === null || typeof chat.threadId === "string") &&
    (chat.assistantId === null || typeof chat.assistantId === "string") &&
    Array.isArray(chat.messages) && chat.messages.length > 0 &&
    chat.messages.every((message) => message &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string");
}

const STARTER_PROMPTS = [
  {
    label: "Review my spending",
    message: "Analyze my spending. Which categories am I spending the most on, and where could I save?",
  },
  {
    label: "Find subscription increases",
    message: "Which of my subscriptions increased in price, and how much extra will they cost me each month and year?",
  },
  {
    label: "Help with my savings goals",
    message: "Review my savings goals and suggest specific changes to my spending or subscriptions that could help me reach them.",
  },
];

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
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const historyRef = useRef<SavedChat[]>([]);

  useEffect(() => {
    // Browser storage is read after hydration; it is unavailable during prerendering.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed) || !parsed.every(isSavedChat)) {
        throw new Error("Invalid chat history");
      }
      historyRef.current = parsed;
      setSavedChats(parsed);
    } catch {
      setStorageError("Saved chats could not be loaded. Chat still works in this session.");
    } finally {
      setHistoryReady(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function persistHistory(chats: SavedChat[]) {
    historyRef.current = chats;
    setSavedChats(chats);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(chats));
      setStorageError(null);
    } catch {
      setStorageError("Chat history could not be saved in this browser. Keep this page open to retain this session.");
    }
  }

  function saveChat(chat: SavedChat) {
    persistHistory([chat, ...historyRef.current.filter((item) => item.id !== chat.id)]);
  }

  function openChat(chat: SavedChat) {
    if (loading) return;
    setActiveChatId(chat.id);
    setMessages(chat.messages);
    setThreadId(chat.threadId);
    setAssistantId(chat.assistantId);
    setInput("");
    setHistoryOpen(false);
  }

  function deleteChat(id: string) {
    if (loading) return;
    persistHistory(historyRef.current.filter((chat) => chat.id !== id));
    if (activeChatId === id) startNewConversation();
  }

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior:
        messages.length === 1 ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || loading || !historyReady) return;

    const chatId = activeChatId ?? crypto.randomUUID();
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: message }];
    const title = (nextMessages.find((item) => item.role === "user")?.content ?? message).slice(0, 80);
    setActiveChatId(chatId);
    setHistoryOpen(false);
    setMessages(nextMessages);
    saveChat({ id: chatId, title, messages: nextMessages, threadId, assistantId });
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

      const updatedMessages: ChatMessage[] = [
        ...nextMessages,
        { role: "assistant", content: response.reply },
      ];
      setMessages(updatedMessages);
      saveChat({
        id: chatId, title, messages: updatedMessages,
        threadId: response.thread_id, assistantId: response.assistant_id,
      });
    } catch (error) {
      console.error("Chat error:", error);

      const updatedMessages: ChatMessage[] = [
        ...nextMessages,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't connect to the AI assistant. Please try again.",
        },
      ];
      setMessages(updatedMessages);
      saveChat({ id: chatId, title, messages: updatedMessages, threadId, assistantId });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void sendMessage(input);
  }

  function startNewConversation() {
    if (loading) return;
    setActiveChatId(null);
    setThreadId(null);
    setAssistantId(null);
    setInput("");
    setHistoryOpen(false);
    setMessages([
      {
        role: "assistant",
        content: "New conversation started! What would you like to discuss?",
      },
    ]);
  }

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Bot className="text-indigo-600" size={24} />
          <div>
            <h2 className="font-semibold text-gray-900">SpendSense AI</h2>
            <p className="text-xs text-gray-500">
              Your personal financial assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setHistoryOpen(!historyOpen)}
          disabled={loading || !historyReady}
          aria-expanded={historyOpen}
          aria-controls="chat-history"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <History size={16} aria-hidden="true" />
          History
        </button>
        <button
          onClick={startNewConversation}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          New Chat
        </button>
        </div>
      </div>

      {storageError && (
        <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {storageError}
        </p>
      )}

      {historyOpen && (
        <section id="chat-history" aria-label="Chat history" className="max-h-56 shrink-0 overflow-y-auto border-b border-gray-200 bg-surface p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Previous chats</h3>
              <p className="mt-1 text-xs text-gray-500">Saved in this browser. Deleting removes the local copy.</p>
            </div>
            <button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close chat history" className="rounded-md p-1 text-gray-500 hover:bg-gray-100">
              <X size={16} />
            </button>
          </div>
          {savedChats.length === 0 ? (
            <p className="text-sm text-gray-500">Your conversations will appear here after you send a message.</p>
          ) : (
            <ul className="space-y-1">
              {savedChats.map((chat) => (
                <li key={chat.id} className={`flex items-center gap-2 rounded-lg ${chat.id === activeChatId ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                  <button type="button" onClick={() => openChat(chat)} aria-current={chat.id === activeChatId ? "true" : undefined} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm text-gray-800" title={chat.title}>
                    {chat.title}
                  </button>
                  <button type="button" onClick={() => deleteChat(chat.id)} aria-label={`Delete chat: ${chat.title}`} className="shrink-0 rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4"
      >
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
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                message.role === "user"
                  ? "whitespace-pre-wrap bg-indigo-600 text-white"
                  : "whitespace-normal border border-gray-200 bg-surface text-gray-800"
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

        {messages.length === 1 && !loading && (
          <div className="ml-7 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                disabled={!historyReady}
                onClick={() => void sendMessage(prompt.message)}
                className="rounded-xl border border-indigo-100 bg-surface px-3 py-2 text-left text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        )}

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
          disabled={loading || !historyReady || !input.trim()}
          className="rounded-xl bg-indigo-600 px-4 text-white hover:bg-indigo-700 disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
