import { createContext, useContext, useState, ReactNode } from "react";

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
}

export const PROVIDERS: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-70b-versatile",
  },
  {
    id: "anthropic",
    name: "Anthropic (OpenAI API)",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-sonnet-20240620",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "meta-llama/llama-3.1-405b",
  },
  {
    id: "mistral",
    name: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-large-latest",
  },
  {
    id: "gemini",
    name: "Gemini (OpenAI API)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-1.5-pro",
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
