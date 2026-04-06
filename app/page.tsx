"use client";
import Image from "next/image";
import F1logo from "./assets/f1.png";
import { useChat } from "@ai-sdk/react";
import { UIMessage as Message } from "ai";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const { sendMessage, messages, status } = useChat();
  const [input, setInput] = useState("");
  const isLoading = status === "streaming" || status === "submitted";
  const noMessages = messages.length === 0;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
    setInput("");
  };

  const getMessageText = (message: Message) => {
    return message.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("") ?? "";
  };

  const suggestions = [
    "Who is the 2024 F1 World Champion?",
    "Tell me about Lewis Hamilton",
    "What are the F1 race results for 2024?",
    "History of female F1 drivers",
  ];

  return (
    <main className="flex flex-col h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="flex items-center justify-center gap-4 py-4 border-b border-[#e8002d]/40 bg-[#0f0f0f] shadow-lg shadow-[#e8002d]/10">
        <Image src={F1logo} alt="F1 Logo" width={80} />
        <div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-white">
            Race Intelligence
          </h1>
          <p className="text-xs text-[#e8002d] tracking-widest uppercase">
            Powered by AI · Formula 1 Expert
          </p>
        </div>
      </header>

      {/* Messages area */}
      <section className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {noMessages ? (
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-1">Welcome to the pits.</p>
              <p className="text-gray-500 text-sm">Ask me anything about Formula 1.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    sendMessage({ role: "user", parts: [{ type: "text", text: s }] });
                  }}
                  className="text-left px-4 py-3 rounded-xl border border-[#e8002d]/30 bg-[#1a1a1a] hover:bg-[#e8002d]/10 hover:border-[#e8002d] transition-all text-sm text-gray-300 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role !== "user" && (
                  <div className="w-8 h-8 rounded-full bg-[#e8002d] flex items-center justify-center text-xs font-bold mr-2 mt-1 shrink-0">
                    F1
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-[#e8002d] text-white rounded-tr-sm"
                      : "bg-[#1e1e1e] text-gray-100 border border-white/10 rounded-tl-sm"
                  }`}
                >
                  {getMessageText(message)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-[#e8002d] flex items-center justify-center text-xs font-bold mr-2 mt-1 shrink-0">
                  F1
                </div>
                <div className="bg-[#1e1e1e] border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-2 h-2 bg-[#e8002d] rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-[#e8002d] rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-[#e8002d] rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </section>

      {/* Input area */}
      <div className="border-t border-white/10 bg-[#0f0f0f] px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto flex items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me something about F1..."
            className="flex-1 bg-[#1a1a1a] border border-white/10 focus:border-[#e8002d] outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-[#e8002d] hover:bg-[#c5001f] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-sm font-semibold transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
