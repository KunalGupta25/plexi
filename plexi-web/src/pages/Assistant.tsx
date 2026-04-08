import React, { useEffect, useMemo, useRef, useState } from "react";
import { useManifest } from "../hooks/useManifest";
import { useSettings, PROVIDERS } from "../hooks/useSettings";
import { api, Message } from "../api/client";
import { marked } from "marked";
import StudyScopeSelector from "../components/StudyScopeSelector";
import { SEO } from "../components/SEO";

const renderMarkdown = (content: string) =>
  marked.parse(content.replace(/</g, "&lt;").replace(/>/g, "&gt;")) as string;

const SCOPE_STORAGE_KEY = "plexi_scope";
const PROMPT_SUGGESTIONS = [
  "Explain the core concepts",
  "Summarize Unit 1",
  "Provide common exam questions",
  "Define key terminology",
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

  const apiKey = settings.apiKey;
  const providerId = settings.providerId;
  const model = settings.model;

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatLoading]);

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

  useEffect(() => {
    if (semester && subject)
      localStorage.setItem(
        SCOPE_STORAGE_KEY,
        JSON.stringify({ semester, subject }),
      );
  }, [semester, subject]);

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
  ) => `You are Plexi, an AI study assistant for Parul University computer science students.
Answer questions clearly and concisely using the provided context.
If the context is not relevant, say that you are using general knowledge and mention that the answer was not found in the loaded study materials.
Use Markdown for formatting.

--- CONTEXT ---
${context}`;

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
      const chatResult = await api.chat({
        endpoint: activeProvider.baseUrl,
        apiKey: apiKey.trim(),
        model: model.trim(),
        messages: chatMessages,
        cacheKey,
      });
      const notices: string[] = [];
      if (retrieveResult.cached) notices.push("materials");
      if (chatResult.cached) notices.push("answer");
      setCacheNotice(
        notices.length ? `Served from cache: ${notices.join(" + ")}` : null,
      );
      setMessages([
        ...nextMessages,
        { role: "assistant", content: chatResult.answer },
      ]);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "An unexpected error occurred.",
      );
    } finally {
      setChatLoading(false);
    }
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
    <div className="w-full h-[calc(100vh-8rem)] bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex overflow-hidden relative print:h-auto print:overflow-visible print:border-none print:shadow-none">
      <SEO 
        title="Plexi | AI Assistant"
        description="Interact with your course materials through an AI-powered study assistant. Get precise answers based on your notes and syllabus."
      />
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

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Chat Header */}
        <header className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-md z-10 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3 flex-1 overflow-x-auto no-scrollbar">
            <div className="flex items-center shrink-0 bg-surface-container p-0.5 rounded-lg border border-outline-variant/20">
              <select
                className="bg-transparent text-sm font-bold text-on-surface py-2 pl-4 pr-8 outline-none border-none appearance-none cursor-pointer relative hover:bg-surface-variant transition-colors rounded-l-md"
                value={semester}
                onChange={(e) => {
                  setSemester(e.target.value);
                  setSubject("");
                }}
              >
                <option value="" disabled>
                  Semester
                </option>
                {semesters.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <div className="w-px h-6 bg-outline-variant/40"></div>
              <select
                className="bg-transparent text-sm font-bold text-on-surface py-2 pl-4 pr-8 outline-none border-none appearance-none cursor-pointer hover:bg-surface-variant transition-colors rounded-r-md"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!semester}
              >
                <option value="" disabled>
                  Subject
                </option>
                {subjects.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {cacheNotice && (
              <span className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-tertiary-fixed text-on-tertiary-fixed shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">
                  bolt
                </span>
                {cacheNotice}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => window.print()}
              disabled={messages.length === 0}
              className="p-2 rounded-full text-outline hover:bg-surface-container-high transition-colors lg:hidden flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save as PDF"
            >
              <span className="material-symbols-outlined">picture_as_pdf</span>
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-full text-outline hover:bg-surface-container-high transition-colors lg:hidden flex items-center justify-center"
            >
              <span className="material-symbols-outlined">
                {showSidebar ? "close" : "info"}
              </span>
            </button>
          </div>
        </header>

        {/* Chat Feed */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 pb-4 print:overflow-visible print:h-auto"
        >
          {!settings.apiKey ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto opacity-80 mt-12">
              <div className="w-20 h-20 bg-error-container/40 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-error/10">
                <span className="material-symbols-outlined text-4xl text-error">
                  key_off
                </span>
              </div>
              <h2 className="text-3xl font-black font-headline text-on-surface mb-4 tracking-tight">
                API Key Required
              </h2>
              <p className="text-on-surface-variant text-base mb-8 leading-relaxed">
                Please configure your AI provider and API key in the settings to
                start chatting with Plexi.
              </p>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined">settings</span>
                Open Settings
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto opacity-80 mt-12">
              <div className="w-20 h-20 bg-primary-fixed/40 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-primary/10">
                <span className="material-symbols-outlined text-4xl text-primary">
                  forum
                </span>
              </div>
              <h2 className="text-3xl font-black font-headline text-on-surface mb-4 tracking-tight">
                Your AI Study Assistant
              </h2>
              <p className="text-on-surface-variant text-base mb-8 leading-relaxed">
                Select your scope above, and ask anything. Plexi will securely
                scan the actual course materials and construct precise, grounded
                answers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
                {PROMPT_SUGGESTIONS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/30 transition-all text-sm font-medium text-on-surface-variant text-left flex items-center justify-between group shadow-sm"
                  >
                    {prompt}
                    <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>

              <div className="w-full bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20 text-left flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-2 text-primary font-bold font-headline mb-1">
                  <span className="material-symbols-outlined">extension</span>
                  Want to use Plexi with ChatGPT or Claude?
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Plexi can run as an MCP (Model Context Protocol) Server,
                  allowing you to seamlessly integrate your study materials with
                  your favorite AI desktop clients.
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <a
                    href="https://ko-fi.com/post/Setting-Up-Plexi-MCP-for-Claude-and-ChatGPT-X8X11X3IKZ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Read the Setup Guide
                    <span className="material-symbols-outlined text-[14px]">
                      open_in_new
                    </span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] md:max-w-[75%] ${
                    message.role === "user"
                      ? "self-end items-end"
                      : "self-start items-start"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 mb-1.5 px-1 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <span className="material-symbols-outlined text-[14px] text-outline">
                      {message.role === "user" ? "person" : "robot_2"}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-outline font-label">
                      {message.role === "user" ? "You" : "Plexi"}
                    </span>
                  </div>
                  <div
                    className={`p-5 rounded-2xl shadow-sm text-[15px] leading-relaxed break-words ${
                      message.role === "user"
                        ? "bg-primary text-on-primary rounded-tr-sm"
                        : "bg-surface-container-low text-on-surface border border-outline-variant/20 rounded-tl-sm"
                    }`}
                  >
                    <div
                      className={`prose prose-sm max-w-none prose-p:my-2 prose-a:text-primary-container prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded ${
                        message.role === "user"
                          ? "prose-p:text-on-primary prose-headings:text-on-primary prose-strong:text-on-primary prose-li:text-on-primary"
                          : "dark:prose-invert prose-code:bg-surface-container-highest prose-pre:bg-surface-container-highest prose-pre:text-on-surface"
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(message.content),
                      }}
                    />

                    {/* Render Context References for the last AI message */}
                    {message.role === "assistant" &&
                      index === messages.length - 1 &&
                      retrievedContext.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-outline-variant/30">
                          <span className="text-xs font-bold uppercase tracking-widest text-secondary font-label mb-3 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">
                              library_books
                            </span>
                            Sources Checked
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(
                              new Set(
                                retrievedContext
                                  .map((chunk) => chunk.filename)
                                  .filter(Boolean),
                              ),
                            ).map((filename) => (
                              <span
                                key={filename}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant/20 truncate max-w-[200px] flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[14px] opacity-70">
                                  draft
                                </span>
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

          {chatLoading && (
            <div className="self-start flex flex-col items-start max-w-[85%]">
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="material-symbols-outlined text-[14px] text-outline">
                  robot_2
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-outline font-label">
                  Plexi
                </span>
              </div>
              <div className="p-5 rounded-2xl rounded-tl-sm bg-surface-container-low text-on-surface border border-outline-variant/20 shadow-sm flex items-center gap-3">
                <span className="material-symbols-outlined animate-spin text-primary">
                  progress_activity
                </span>
                <span className="text-sm font-medium text-secondary">
                  Analyzing course materials...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto bg-error-container text-on-error-container px-5 py-3 rounded-xl flex items-center gap-3 shadow-sm border border-error/20 max-w-lg mt-4">
              <span className="material-symbols-outlined text-[20px]">
                warning
              </span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="w-full p-4 md:p-6 bg-surface-container-lowest border-t border-outline-variant/20 z-10 shrink-0 print:hidden">
          <form
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative flex items-center shadow-sm rounded-full bg-surface-container-high border border-outline-variant/30 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 transition-all"
          >
            <input
              type="text"
              className="w-full bg-transparent text-on-surface pl-6 pr-14 py-4 md:py-5 outline-none text-sm md:text-base font-medium placeholder:text-outline/60"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                !settings.apiKey
                  ? "API key required..."
                  : !bootstrapped
                    ? "Configuring Assistant..."
                    : subject
                      ? `Ask about ${subject}...`
                      : "Select a semester and subject first..."
              }
              disabled={
                !settings.apiKey || !bootstrapped || chatLoading || !subject
              }
            />
            <button
              type="submit"
              disabled={
                !bootstrapped || !input.trim() || chatLoading || !subject
              }
              className="absolute right-2 md:right-2 w-10 h-10 md:w-12 md:h-12 bg-transparent text-on-surface-variant hover:text-on-surface rounded-full flex items-center justify-center disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">
                send
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar (Settings Info) */}
      <div
        className={`${
          showSidebar ? "flex" : "hidden"
        } lg:flex w-full absolute inset-0 bg-surface-container-lowest z-20 lg:relative lg:w-[320px] lg:bg-surface-container-low border-l border-outline-variant/30 flex-col overflow-y-auto no-scrollbar transition-all print:hidden`}
      >
        <div className="p-6 flex flex-col gap-10">
          <div className="flex items-center justify-between lg:hidden">
            <h3 className="font-headline font-bold text-lg text-on-surface">
              Session Info
            </h3>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-secondary font-label mb-4">
              Intelligence Setup
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-primary-fixed/50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    hub
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Provider
                  </span>
                  <span className="text-sm font-bold text-on-surface truncate">
                    {activeProvider.name}
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                    memory
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Model
                  </span>
                  <span className="text-sm font-bold text-on-surface truncate">
                    {model}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-outline-variant/30 w-full hidden"></div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-secondary font-label mb-4">
              Current Scope
            </div>
            <ul className="space-y-4">
              <li className="flex justify-between items-center text-sm">
                <span className="text-secondary font-medium">Semester</span>
                <span className="font-bold text-on-surface">
                  {semester || "—"}
                </span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-secondary font-medium">Subject</span>
                <span
                  className="font-bold text-on-surface truncate max-w-[150px]"
                  title={subject}
                >
                  {subject || "—"}
                </span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="text-secondary font-medium">Messages</span>
                <span className="font-bold text-on-surface px-2.5 py-0.5 bg-secondary-container text-primary rounded-md">
                  {messages.length}
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-auto pt-8 pb-4 flex flex-col gap-3">
            <button
              onClick={() => window.print()}
              disabled={messages.length === 0}
              className="w-full px-4 py-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-primary font-bold text-sm hover:bg-primary-container hover:border-primary/20 hover:text-on-primary-container transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                picture_as_pdf
              </span>
              Save as PDF
            </button>
            <button
              onClick={() => {
                resetSession();
                setShowSidebar(false);
              }}
              className="w-full px-4 py-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-error font-bold text-sm hover:bg-error-container hover:border-error/20 hover:text-on-error-container transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                delete
              </span>
              Clear Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
