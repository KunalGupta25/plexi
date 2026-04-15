import React, { useEffect, useMemo, useRef, useState } from "react";
import { useManifest } from "../hooks/useManifest";
import { useSettings, PROVIDERS } from "../hooks/useSettings";
import { api, Message } from "../api/client";
import { marked } from "marked";
import DOMPurify from "dompurify";
import StudyScopeSelector from "../components/StudyScopeSelector";
import { SEO } from "../components/SEO";

const renderMarkdown = (content: string) =>
  DOMPurify.sanitize(marked.parse(content) as string);

const SCOPE_STORAGE_KEY = "plexi_scope";
const PROMPT_SUGGESTIONS = [
  "Explain the core concepts of this subject",
  "Summarize Unit 1 for me",
  "Give me common exam questions",
  "Define the key terminology",
];

interface StoredScope {
  semester: string;
  subject: string;
}

const Assistant: React.FC = () => {
  const { semesters, getSubjects } = useManifest();
  const { settings, currentProvider, setIsSettingsOpen, isSettingsOpen } =
    useSettings();

  const [bootstrapped, setBootstrapped] = useState(false);
  const [showScopePrompt, setShowScopePrompt] = useState(false);
  const hasPromptedForSettings = useRef(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [retrievedContext, setRetrievedContext] = useState<
    Array<{ filename: string | null }>
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const apiKey = settings.apiKey;
  const providerId = settings.providerId;
  const model = settings.model;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatLoading]);

  // Restore scope from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(SCOPE_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as StoredScope;
      if (saved.semester) setSemester(saved.semester);
      if (saved.subject) setSubject(saved.subject);
    } catch (e) {
      // ignore
    }
  }, []);

  // Save scope to localStorage
  useEffect(() => {
    if (semester && subject)
      localStorage.setItem(
        SCOPE_STORAGE_KEY,
        JSON.stringify({ semester, subject }),
      );
  }, [semester, subject]);

  // Bootstrap logic
  useEffect(() => {
    if (isSettingsOpen) return;
    if (!settings.apiKey) {
      if (!hasPromptedForSettings.current) {
        setIsSettingsOpen(true);
        hasPromptedForSettings.current = true;
      }
      return;
    }
    if (!semester || !subject || messages.length === 0) {
      setShowScopePrompt(true);
      setBootstrapped(true);
      return;
    }
    setBootstrapped(true);
    setShowScopePrompt(false);
  }, [
    settings.apiKey,
    semester,
    subject,
    isSettingsOpen,
    setIsSettingsOpen,
    messages.length,
  ]);

  const activeProvider = useMemo(
    () =>
      PROVIDERS.find((provider) => provider.id === providerId) ||
      currentProvider,
    [providerId, currentProvider],
  );
  const subjects = getSubjects(semester);

  const buildSystemPrompt = (
    context: string,
  ) => `You are Plexi, a friendly and knowledgeable AI study assistant for computer science students at Parul University. You help students understand their course materials for **${subject}** (${semester}).

### BEHAVIOR RULES:
1. **Greetings & Small Talk**: If the student greets you (e.g., "hi", "hello", "hey"), respond warmly and briefly. Introduce yourself and offer to help with their ${subject} studies. Keep it short and natural.
2. **Vague or Ambiguous Questions**: If the student asks something unclear (e.g., "explain the core concepts", "tell me everything", "what's important"), don't guess — ask a clarifying follow-up question. For example: "Sure! Which specific topic in ${subject} would you like me to explain? For instance, I can cover [list 2-3 key topics from the context]."
3. **Specific Study Questions**: Answer thoroughly using the study materials below.

### ANSWER RULES:
1. **Groundedness**: Your answer MUST be based on the "STUDY MATERIALS CONTEXT" below. Do not use outside knowledge if the information is available in the context.
2. **Context Absence**: If the "STUDY MATERIALS CONTEXT" does not contain the answer, you must clearly state: "I couldn't find this specific information in your ${subject} study materials. Based on general knowledge..." and then answer.
3. **Citation**: Whenever you use information from the context, mention the source file (e.g., "From [filename]: ...").
4. **No Hallucinations**: Do not invent facts. If the context is ambiguous, state that clearly.
5. **Tone**: Be professional but approachable. Use Markdown for structured output (bullet points, bold text, code blocks, tables).
6. **Subject Awareness**: You are currently helping with **${subject}** from **${semester}**. Frame your answers in this context.

--- STUDY MATERIALS CONTEXT ---
${context || "No specific study materials were found for this query."}

---
Respond to the student's message using the rules above.`;

  const isStreaming = useRef(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bootstrapped) {
      if (!settings.apiKey) setIsSettingsOpen(true);
      else if (!semester || !subject) setShowScopePrompt(true);
      return;
    }
    if (!input.trim() || chatLoading) return;

    const userMsg = input.trim();
    const userMessage: Message = { role: "user", content: userMsg };
    const nextMessages = [...messages, userMessage];
    setInput("");
    setMessages(nextMessages);
    setChatLoading(true);
    setError(null);
    setCacheNotice(null);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      const retrieveResult = await api.retrieve({
        query: userMsg,
        semester,
        subject,
      });
      setRetrievedContext(retrieveResult.chunks);
      const systemPrompt = buildSystemPrompt(retrieveResult.context_formatted);
      const chatMessages: Message[] = [
        { role: "system", content: systemPrompt },
        ...nextMessages.slice(-10),
      ];
      const cacheKey = `${semester}::${subject}`;

      const streamingMessages = [
        ...nextMessages,
        { role: "assistant" as const, content: "" },
      ];
      setMessages(streamingMessages);
      isStreaming.current = true;

      const { cached: answerCached } = await api.chatStream(
        {
          endpoint: activeProvider.baseUrl,
          apiKey: apiKey.trim(),
          model: model.trim(),
          messages: chatMessages,
          cacheKey,
        },
        (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + token,
              };
            }
            return updated;
          });
        },
      );

      isStreaming.current = false;

      const notices: string[] = [];
      if (retrieveResult.cached) notices.push("materials");
      if (answerCached) notices.push("answer");
      setCacheNotice(
        notices.length ? `Served from cache: ${notices.join(" + ")}` : null,
      );
    } catch (sendError) {
      isStreaming.current = false;
      setError(
        sendError instanceof Error
          ? sendError.message
          : "An unexpected error occurred.",
      );
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const resetSession = () => {
    localStorage.removeItem(SCOPE_STORAGE_KEY);
    setSemester("");
    setSubject("");
    setMessages([]);
    setRetrievedContext([]);
    setCacheNotice(null);
  };

  return (
    <div className="w-full flex flex-col flex-1 overflow-hidden pt-16">
      <SEO
        title="Plexi | AI Assistant"
        description="Interact with your course materials through an AI-powered study assistant. Get precise answers based on your notes and syllabus."
      />

      {/* Scope Selector Modal */}
      {showScopePrompt && (
        <div className="absolute inset-0 z-50 bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-4xl h-full md:h-auto max-h-[95vh] md:max-h-[80vh] bg-surface shadow-2xl rounded-3xl border border-outline-variant/20 overflow-hidden flex flex-col relative">
            <button
              onClick={() => setShowScopePrompt(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <StudyScopeSelector
              semesters={semesters}
              subjects={subjects}
              selectedSemester={semester}
              onSelectSemester={setSemester}
              selectedSubject={subject}
              onSelectSubject={setSubject}
              onConfirm={() => setShowScopePrompt(false)}
            />
          </div>
        </div>
      )}

      {/* Sidebar Overlay (drawer) */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={() => setShowSidebar(false)}
        />
      )}
      <div
        className={`fixed right-0 top-0 h-full w-[320px] z-40 bg-surface-container-lowest dark:bg-surface-container border-l border-outline-variant/30 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out print:hidden ${
          showSidebar ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <h3 className="font-headline font-bold text-lg text-on-surface">Session Info</h3>
          <button
            onClick={() => setShowSidebar(false)}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 no-scrollbar">
          {/* Intelligence Setup */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-secondary font-label mb-4">
              Intelligence Setup
            </div>
            <div className="flex flex-col gap-3">
              <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-primary">hub</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Provider</span>
                  <span className="text-sm font-bold text-on-surface truncate">{activeProvider.name}</span>
                </div>
              </div>
              <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">memory</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Model</span>
                  <span className="text-sm font-bold text-on-surface truncate">{model}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Scope */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-secondary font-label mb-4">
              Current Scope
            </div>
            <ul className="space-y-4">
              <li className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">Semester</span>
                <span className="font-bold text-on-surface">{semester || "—"}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">Subject</span>
                <span className="font-bold text-on-surface truncate max-w-[160px]" title={subject}>
                  {subject || "—"}
                </span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">Messages</span>
                <span className="font-bold text-on-surface px-2.5 py-0.5 bg-primary/10 text-primary rounded-md">
                  {messages.length}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar actions */}
        <div className="p-6 border-t border-outline-variant/20 flex flex-col gap-3">
          <button
            onClick={() => window.print()}
            disabled={messages.length === 0}
            className="w-full px-4 py-3 rounded-xl border border-outline-variant/20 bg-surface-container text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Save as PDF
          </button>
          <button
            onClick={() => { resetSession(); setShowSidebar(false); }}
            className="w-full px-4 py-3 rounded-xl border border-outline-variant/20 bg-surface-container text-error font-bold text-sm hover:bg-error/5 hover:border-error/20 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Clear Session
          </button>
        </div>
      </div>

      {/* ── Chat Header ── */}
      <header className="px-4 md:px-6 py-3 border-b border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container z-10 flex items-center justify-between gap-4 shrink-0 print:hidden">
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          {/* Scope selectors */}
          <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant/20 overflow-hidden shrink-0">
            <select
              className="bg-transparent text-sm font-bold text-on-surface py-2 pl-3 pr-7 outline-none border-none appearance-none cursor-pointer"
              value={semester}
              onChange={(e) => { setSemester(e.target.value); setSubject(""); }}
            >
              <option value="" disabled>Semester</option>
              {semesters.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <div className="w-px h-5 bg-outline-variant/40" />
            <select
              className="bg-transparent text-sm font-bold text-on-surface py-2 pl-3 pr-7 outline-none border-none appearance-none cursor-pointer"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!semester}
            >
              <option value="" disabled>Subject</option>
              {subjects.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>

          {/* Cache notice */}
          {cacheNotice && (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-tertiary-fixed text-on-tertiary-fixed shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              {cacheNotice}
            </span>
          )}
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowScopePrompt(true)}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            title="Change study scope"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
          <button
            onClick={() => window.print()}
            disabled={messages.length === 0}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Save as PDF"
          >
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            title="Session info"
          >
            <span className="material-symbols-outlined text-[20px]">info</span>
          </button>
        </div>
      </header>

      {/* ── Chat Feed ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-background print:overflow-visible print:h-auto"
      >
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-2 print:max-w-none">

          {/* ── Empty / Welcome State ── */}
          {!settings.apiKey ? (
            <div className="flex flex-col items-center justify-center text-center min-h-[60vh] max-w-md mx-auto gap-6">
              <div className="w-20 h-20 bg-error/10 rounded-[2rem] flex items-center justify-center shadow-inner border border-error/20">
                <span className="material-symbols-outlined text-4xl text-error">key_off</span>
              </div>
              <div>
                <h2 className="text-3xl font-black font-headline text-on-surface mb-3 tracking-tight">API Key Required</h2>
                <p className="text-on-surface-variant text-base leading-relaxed">
                  Configure your AI provider and API key in Settings to start chatting with Plexi.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">settings</span>
                  Open Settings
                </button>
                <a
                  href="https://chatgpt.com/g/g-69caa671910481919ce71d19952e34e5-plexi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-surface-container border border-outline-variant/30 text-on-surface rounded-full font-bold hover:bg-surface-container-high transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">smart_toy</span>
                  Use Plexi in ChatGPT
                </a>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center min-h-[60vh] max-w-lg mx-auto gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-4xl text-primary">robot_2</span>
              </div>
              <div>
                <h2 className="text-3xl font-black font-headline text-on-surface mb-3 tracking-tight">
                  {subject ? `Ask about ${subject}` : "Your AI Study Assistant"}
                </h2>
                <p className="text-on-surface-variant text-base leading-relaxed">
                  {subject
                    ? `I'll scan your ${subject} course materials and give you precise, grounded answers.`
                    : "Select your semester and subject above, then ask me anything."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {PROMPT_SUGGESTIONS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high hover:border-primary/30 transition-all text-sm font-medium text-on-surface-variant text-left flex items-center justify-between group"
                  >
                    {prompt}
                    <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary shrink-0 ml-2">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>

              <div className="w-full bg-surface-container p-4 rounded-xl border border-dashed border-outline-variant/30 text-left flex flex-col gap-2">
                <div className="flex items-center gap-2 text-on-surface-variant font-bold text-sm">
                  <span className="material-symbols-outlined text-[18px]">extension</span>
                  Want to use Plexi with Claude or ChatGPT desktop?
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Plexi can run as an MCP Server, letting you use your study materials in any AI client.
                </p>
                <a
                  href="https://ko-fi.com/post/Setting-Up-Plexi-MCP-for-Claude-and-ChatGPT-X8X11X3IKZ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors self-start mt-1"
                >
                  Setup Guide
                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </a>
              </div>
            </div>
          ) : (
            /* ── Message List ── */
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-4 px-2 py-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-surface-container/50"
                      : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    message.role === "user"
                      ? "bg-primary/20"
                      : "bg-primary/10 border border-primary/20"
                  }`}>
                    <span className={`material-symbols-outlined text-[18px] ${
                      message.role === "user" ? "text-primary" : "text-primary"
                    }`}>
                      {message.role === "user" ? "person" : "robot_2"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Role label */}
                    <div className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2 font-label">
                      {message.role === "user" ? "You" : "Plexi"}
                    </div>

                    {/* Message body */}
                    <div
                      className={`prose prose-base max-w-none leading-relaxed break-words text-[15px] ${
                        message.role === "user"
                          ? "prose-p:text-on-surface prose-headings:text-on-surface prose-strong:text-on-surface prose-li:text-on-surface text-on-surface"
                          : "dark:prose-invert prose-code:bg-surface-container prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-container prose-pre:text-on-surface prose-a:text-primary prose-headings:text-on-surface text-on-surface"
                      }`}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                    />

                    {/* Streaming cursor */}
                    {message.role === "assistant" &&
                      index === messages.length - 1 &&
                      chatLoading && (
                        <span className="inline-block w-2 h-4 ml-1 bg-primary rounded-sm animate-pulse align-middle" />
                      )}

                    {/* Sources for last assistant message */}
                    {message.role === "assistant" &&
                      index === messages.length - 1 &&
                      retrievedContext.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-outline-variant/20">
                          <span className="text-xs font-bold uppercase tracking-widest text-secondary font-label mb-3 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">library_books</span>
                            Sources Checked
                          </span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Array.from(
                              new Set(
                                retrievedContext
                                  .map((chunk) => chunk.filename)
                                  .filter(Boolean),
                              ),
                            ).map((filename) => (
                              <span
                                key={filename}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant/20 truncate max-w-[220px] flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[14px] opacity-70">draft</span>
                                {filename}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── Loading (pre-streaming) ── */}
          {chatLoading && !isStreaming.current && (
            <div className="flex gap-4 px-2 py-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px] text-primary">robot_2</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2 font-label">Plexi</div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-primary text-[20px]">progress_activity</span>
                  <span className="text-sm font-medium">Scanning study materials...</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="mx-auto bg-error/10 text-error px-5 py-3 rounded-xl flex items-center gap-3 border border-error/20 max-w-lg mt-2">
              <span className="material-symbols-outlined text-[20px] shrink-0">warning</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="bg-background px-4 md:px-6 pb-4 pt-3 shrink-0 print:hidden">
        <form
          onSubmit={handleSendMessage}
          className="max-w-3xl mx-auto flex items-end gap-3 bg-surface-container-lowest dark:bg-surface-container rounded-2xl border border-outline-variant/30 shadow-lg focus-within:border-primary/50 focus-within:shadow-primary/10 focus-within:shadow-xl transition-all px-4 py-3"
        >
          <textarea
            ref={inputRef}
            rows={1}
            className="flex-1 bg-transparent text-on-surface outline-none text-[15px] font-medium placeholder:text-outline/50 resize-none overflow-hidden leading-relaxed"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              !settings.apiKey
                ? "API key required..."
                : !bootstrapped
                  ? "Configuring assistant..."
                  : subject
                    ? `Ask about ${subject}...`
                    : "Select a semester and subject first..."
            }
            disabled={!settings.apiKey || !bootstrapped || chatLoading || !subject}
            style={{ minHeight: "28px", maxHeight: "160px" }}
          />
          <button
            type="submit"
            disabled={!bootstrapped || !input.trim() || chatLoading || !subject}
            className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-hover active:scale-90 transition-all shrink-0 self-end"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
        <p className="text-center text-[11px] text-outline/50 mt-2">
          Enter to send · Shift+Enter for newline · Plexi may make mistakes
        </p>
      </div>
    </div>
  );
};

export default Assistant;
