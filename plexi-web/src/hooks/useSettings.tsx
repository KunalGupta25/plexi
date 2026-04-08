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
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    dashboardUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-70b-versatile",
    models: [
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "llama3-70b-8192",
      "llama3-8b-8192",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
    dashboardUrl: "https://console.groq.com/keys",
  },
  {
    id: "anthropic",
    name: "Anthropic (OpenAI API)",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-sonnet-20240620",
    models: [
      "claude-3-5-sonnet-20240620",
      "claude-3-opus-20240229",
      "claude-3-haiku-20240307",
    ],
    dashboardUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "meta-llama/llama-3.1-405b",
    models: [
      "meta-llama/llama-3.1-405b",
      "meta-llama/llama-3.1-70b",
      "google/gemini-pro-1.5",
      "anthropic/claude-3.5-sonnet",
      "mistralai/mistral-large",
    ],
    dashboardUrl: "https://openrouter.ai/keys",
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
      "open-mixtral-8x22b",
    ],
    dashboardUrl: "https://console.mistral.ai/api-keys/",
  },
  {
    id: "gemini",
    name: "Gemini (OpenAI API)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-1.5-pro",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
    dashboardUrl: "https://aistudio.google.com/app/apikey",
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
