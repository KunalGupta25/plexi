import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useSettings, PROVIDERS } from "../hooks/useSettings";

const Layout: React.FC = () => {
  const location = useLocation();
  const { settings, saveSettings, isSettingsOpen, setIsSettingsOpen } =
    useSettings();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("plexi_theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("plexi_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  const [providerId, setProviderId] = useState(settings.providerId);
  const [model, setModel] = useState(settings.model);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [remember, setRemember] = useState(settings.remember);

  useEffect(() => {
    if (isSettingsOpen) {
      setProviderId(settings.providerId);
      setModel(settings.model);
      setApiKey(settings.apiKey);
      setRemember(settings.remember);
    }
  }, [isSettingsOpen, settings]);

  const handleProviderChange = (newProviderId: string) => {
    setProviderId(newProviderId);
    const provider = PROVIDERS.find((p) => p.id === newProviderId);
    if (provider) setModel(provider.defaultModel);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings({ providerId, apiKey, model, remember });
    setIsSettingsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen flex flex-col font-body">
      {/* Desktop Navbar */}
      <header className="hidden md:block print:hidden fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
        <nav className="flex justify-between items-center h-16 px-8 max-w-full mx-auto">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-2xl font-bold text-primary font-headline tracking-tight"
            >
              Plexi Hub
            </Link>
            <div className="flex items-center gap-6 font-headline text-sm tracking-tight">
              <Link
                to="/hub"
                className={
                  isActive("/hub")
                    ? "text-primary font-bold border-b-2 border-primary pb-1 transition-colors duration-200 ease-in-out scale-95 active:opacity-80"
                    : "text-on-surface-variant hover:text-primary transition-colors duration-200 ease-in-out scale-95 active:opacity-80"
                }
              >
                Materials
              </Link>
              <Link
                to="/assistant"
                className={
                  isActive("/assistant")
                    ? "text-primary font-bold border-b-2 border-primary pb-1 transition-colors duration-200 ease-in-out scale-95 active:opacity-80"
                    : "text-on-surface-variant hover:text-primary transition-colors duration-200 ease-in-out scale-95 active:opacity-80"
                }
              >
                Chat
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors duration-200 ease-in-out scale-95 active:opacity-80 flex items-center justify-center"
              aria-label="Toggle Theme"
            >
              <span className="material-symbols-outlined">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors duration-200 ease-in-out scale-95 active:opacity-80 flex items-center justify-center"
              aria-label="Global Settings"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Top Header */}
      <header className="md:hidden print:hidden fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 h-14 flex items-center px-4">
        <Link
          to="/"
          className="text-xl font-bold text-primary font-headline tracking-tight"
        >
          Plexi Hub
        </Link>
      </header>

      {/* Mobile Floating Navbar */}
      <nav className="md:hidden print:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] z-50 bg-surface-container-highest/80 backdrop-blur-xl border border-outline-variant/30 rounded-2xl shadow-2xl px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center transition-colors ${isActive("/") ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[22px]">home</span>
            <span className="text-[10px] font-bold mt-1">Home</span>
          </Link>
          <Link
            to="/hub"
            className={`flex flex-col items-center justify-center transition-colors ${isActive("/hub") ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[22px]">
              menu_book
            </span>
            <span className="text-[10px] font-bold mt-1">Materials</span>
          </Link>
          <Link
            to="/assistant"
            className={`flex flex-col items-center justify-center transition-colors ${isActive("/assistant") ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[22px]">forum</span>
            <span className="text-[10px] font-bold mt-1">Chat</span>
          </Link>
        </div>
        <div className="w-px h-8 bg-outline-variant/30 mx-2"></div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors flex items-center justify-center"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors flex items-center justify-center"
            aria-label="Global Settings"
          >
            <span className="material-symbols-outlined text-[20px]">
              settings
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow pt-20 md:pt-24 pb-28 md:pb-16 px-4 md:px-8 w-full mx-auto max-w-[1600px] flex flex-col relative">
        <Outlet />
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-surface-container-lowest rounded-xl p-6 md:p-10 shadow-2xl overflow-hidden relative max-w-2xl w-full">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-outline hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center mb-8">
              <span className="text-secondary font-label uppercase tracking-widest text-xs mb-2 block">
                Settings
              </span>
              <h2 className="text-3xl font-extrabold text-primary tracking-tight leading-tight">
                Assistant Configuration
              </h2>
              <p className="text-on-surface-variant max-w-md mx-auto leading-relaxed mt-2 text-sm">
                Configure your AI provider and API key. This is stored locally.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-secondary font-label mb-2">
                    Provider
                  </label>
                  <select
                    className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-lg border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={providerId}
                    onChange={(e) => handleProviderChange(e.target.value)}
                  >
                    {PROVIDERS.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-secondary font-label mb-2">
                    Model
                  </label>
                  <div className="relative group">
                    <select
                      className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-lg border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none pr-10"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    >
                      {PROVIDERS.find((p) => p.id === providerId)?.models.map(
                        (m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ),
                      )}
                      <option value="custom">Custom...</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none group-focus-within:text-primary transition-colors">
                      unfold_more
                    </span>
                  </div>
                </div>
              </div>

              {model === "custom" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold uppercase tracking-widest text-secondary font-label mb-2">
                    Custom Model ID
                  </label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-lg border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. gpt-4-0613"
                    autoFocus
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        setModel(e.target.value.trim());
                      }
                    }}
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-secondary font-label">
                    API Key
                  </label>
                  {PROVIDERS.find((p) => p.id === providerId) && (
                    <a
                      href={
                        PROVIDERS.find((p) => p.id === providerId)?.dashboardUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-tighter"
                    >
                      Get Key
                      <span className="material-symbols-outlined text-[12px]">
                        open_in_new
                      </span>
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full bg-surface-container-high text-on-surface pl-10 pr-4 py-3 rounded-lg border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    key
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-outline text-primary focus:ring-primary/20 bg-surface-container-high transition-colors"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Remember on this device
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-outline-variant/30">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 rounded-full text-sm font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    save
                  </span>{" "}
                  Save Settings
                </button>
                <div className="text-xs text-outline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    shield
                  </span>{" "}
                  Local-only
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
