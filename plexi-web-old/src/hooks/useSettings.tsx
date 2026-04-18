import { createContext, useContext, useState, ReactNode } from "react";

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  dashboardUrl: string;
}

export const PROVIDERS: Provider[] = [
  {
    id: "gemini",
    name: "Gemini (Google)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.5-flash",
    models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"],
    dashboardUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "qwen/qwen3-32b",
      "gemma2-9b-it",
    ],
    dashboardUrl: "https://console.groq.com/keys",
  },
  {
    id: "mistral",
    name: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-large-latest",
    models: [
      "mistral-large-latest",
      "mistral-medium-latest",
      "mistral-small-latest",
      "codestral-latest",
    ],
    dashboardUrl: "https://console.mistral.ai/api-keys/",
  },
  {
    id: "openrouter",
    name: "OpenRouter (Free)",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "deepseek/deepseek-chat-v3-0324:free",
    models: [
      "deepseek/deepseek-chat-v3-0324:free",
      "google/gemma-3-27b-it:free",
      "qwen/qwen3-32b:free",
      "nvidia/llama-3.1-nemotron-70b-instruct:free",
      "mistralai/mistral-small-3.1-24b-instruct:free",
    ],
    dashboardUrl: "https://openrouter.ai/keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4.6",
    models: [
      "claude-sonnet-4.6",
      "claude-opus-4.6",
      "claude-haiku-4.5",
    ],
    dashboardUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-5.4",
    models: ["gpt-5.4", "gpt-5.4-mini", "gpt-5.3"],
    dashboardUrl: "https://platform.openai.com/api-keys",
  },
];

export interface Settings {
  providerId: string;
  apiKey: string;
  model: string;
  remember: boolean;
}

const STORAGE_KEY = "plexi_settings";

interface SettingsContextType {
  settings: Settings;
  saveSettings: (newSettings: Settings) => void;
  clearSettings: () => void;
  currentProvider: Provider;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return {
      providerId: PROVIDERS[0].id,
      apiKey: "",
      model: PROVIDERS[0].defaultModel,
      remember: true,
    };
  });

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    if (newSettings.remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearSettings = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings({
      providerId: PROVIDERS[0].id,
      apiKey: "",
      model: PROVIDERS[0].defaultModel,
      remember: true,
    });
  };

  const currentProvider =
    PROVIDERS.find((p) => p.id === settings.providerId) || PROVIDERS[0];

  return (
    <SettingsContext.Provider
      value={{
        settings,
        saveSettings,
        clearSettings,
        currentProvider,
        isSettingsOpen,
        setIsSettingsOpen,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return { ...context, PROVIDERS };
}
