"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [model, setModel] = useState("meta-llama/llama-3.3-70b-instruct");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, model }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "May error sa koneksyon." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">All-in-One AI Hub</h1>

      {/* Model Selector */}
      <div className="mb-4 w-full max-w-xl">
        <label className="block mb-1 text-sm text-gray-400">Pumili ng AI Model:</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
        >
          <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B</option>
          <option value="openai/gpt-4o-mini">ChatGPT (GPT-4o Mini)</option>
          <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku</option>
          <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option>
        </select>
      </div>

      {/* Chat Area */}
      <div className="flex-1 w-full max-w-xl bg-gray-800 rounded-lg p-4 overflow-y-auto mb-4 border border-gray-700 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-10">Magsimula sa pamamagitan ng pag-type ng mensahe sa ibaba.</p>
        )}
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${
              m.role === "user" ? "bg-blue-600 ml-auto max-w-[80%]" : "bg-gray-700 mr-auto max-w-[80%]"
            }`}
          >
            <p className="text-xs text-gray-300 font-semibold mb-1">
              {m.role === "user" ? "Ikaw" : "AI"}
            </p>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {loading && <p className="text-gray-400 italic">Nag-iisip ang AI...</p>}
      </div>

      {/* Input Box */}
      <div className="w-full max-w-xl flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Magtanong kahit ano..."
          className="flex-1 p-3 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-500 px-6 py-3 rounded font-semibold hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </main>
  );
}
