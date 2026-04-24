"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, ArrowLeft, Loader2, EyeOff, Eye, ExternalLink, Trash2 } from "lucide-react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useManifest, useSemesters, type AIConfig } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

// Types
interface LocalAIConfig extends AIConfig {
  rememberDevice: boolean;
  providerId?: string;
}

// Provider configurations (Same as AI page)
const providers = [
  {
    id: "gemini",
    name: "Google Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai",
    models: [
      "gemini-2.5-pro-preview-05-06",
      "gemini-2.5-flash-preview-04-17",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
    ],
    requiresApiKey: true,
    apiKeyUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "openai",
    name: "OpenAI",
    endpoint: "https://api.openai.com/v1",
    models: [
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4.1-nano",
      "gpt-4o",
      "gpt-4o-mini",
    ],
    requiresApiKey: true,
    apiKeyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    endpoint: "https://api.anthropic.com/v1",
    models: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
    ],
    requiresApiKey: true,
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "groq",
    name: "Groq",
    endpoint: "https://api.groq.com/openai/v1",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "llama3-70b-8192",
      "gemma2-9b-it",
    ],
    requiresApiKey: true,
    apiKeyUrl: "https://console.groq.com/keys",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    endpoint: "https://api.mistral.ai/v1",
    models: [
      "mistral-large-latest",
      "mistral-small-latest",
      "codestral-latest",
      "open-mistral-nemo",
    ],
    requiresApiKey: true,
    apiKeyUrl: "https://console.mistral.ai/api-keys",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1",
    models: [
      "google/gemini-2.5-pro-exp-03-25:free",
      "google/gemini-2.0-flash-exp:free",
      "deepseek/deepseek-r1:free",
      "deepseek/deepseek-chat-v3-0324:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "qwen/qwen3-235b-a22b:free",
      "mistralai/mistral-7b-instruct:free",
    ],
    requiresApiKey: true,
    apiKeyUrl: "https://openrouter.ai/settings/keys",
  },
  {
    id: "custom",
    name: "Custom / Local",
    endpoint: "",
    models: [],
    requiresApiKey: false,
  },
];

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { data: manifest, isLoading: manifestLoading } = useManifest();
  const semesters = useSemesters(manifest);

  const [userName, setUserName] = useState("");
  const [defaultSemester, setDefaultSemester] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  
  const [aiConfig, setAIConfig] = useState<LocalAIConfig>({
    endpoint: "",
    model: "",
    apiKey: "",
    rememberDevice: true,
    providerId: "",
  });

  const selectedProvider = providers.find((p) => p.id === aiConfig.providerId);

  useEffect(() => {
    // Load existing settings
    const savedName = localStorage.getItem("plexi-user-name");
    if (savedName) setUserName(savedName);

    const savedSemester = localStorage.getItem("plexi-user-semester");
    if (savedSemester) setDefaultSemester(savedSemester);

    const savedAi = localStorage.getItem("plexi-ai-config");
    if (savedAi) {
      try {
        const parsed = JSON.parse(savedAi);
        setAIConfig((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (provider) {
      setAIConfig((prev) => ({
        ...prev,
        providerId,
        endpoint: provider.endpoint,
        model: "",
      }));
    }
  };

  const handleForgetMe = () => {
    localStorage.removeItem("plexi-user-name");
    localStorage.removeItem("plexi-user-semester");
    localStorage.removeItem("plexi-ai-config");
    localStorage.removeItem("plexi_recent_files");
    
    setUserName("");
    setDefaultSemester("");
    setAIConfig({
      endpoint: "",
      model: "",
      apiKey: "",
      rememberDevice: true,
      providerId: "",
    });
    toast.success("All settings and recent history cleared.");
    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };

  const handleSave = () => {
    if (saveBtnRef.current) {
      gsap.fromTo(
        saveBtnRef.current,
        { scale: 0.9 },
        { scale: 1, duration: 0.3, ease: "back.out(1.7)" }
      );
    }

    // Save User Name
    if (userName.trim()) {
      localStorage.setItem("plexi-user-name", userName.trim());
    } else {
      localStorage.removeItem("plexi-user-name");
    }

    // Save Semester
    if (defaultSemester) {
      localStorage.setItem("plexi-user-semester", defaultSemester);
    } else {
      localStorage.removeItem("plexi-user-semester");
    }

    // Save AI Config
    const isCustom = aiConfig.providerId === "custom";
    const requiresApiKey = selectedProvider?.requiresApiKey ?? true;
    const isAiValid =
      aiConfig.endpoint &&
      aiConfig.model &&
      (isCustom || !requiresApiKey || aiConfig.apiKey);

    if (isAiValid && aiConfig.rememberDevice) {
      localStorage.setItem("plexi-ai-config", JSON.stringify(aiConfig));
    } else if (!aiConfig.rememberDevice) {
      localStorage.removeItem("plexi-ai-config");
    }

    toast.success("Settings saved successfully");
    window.dispatchEvent(new Event("storage")); // Trigger updates
  };

  return (
    <main className="min-h-screen bg-background px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between md:mb-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 shrink-0 rounded-full bg-secondary">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Settings
              </h1>
              <p className="mt-1 text-sm text-muted-foreground md:text-base">
                Manage your profile and AI configurations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              onClick={handleForgetMe}
              className="gap-2 rounded-xl h-10 px-4"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Forget me</span>
            </Button>
            <Button
              ref={saveBtnRef}
              onClick={handleSave}
              className="gap-2 rounded-xl h-10 px-6"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </header>

        <div className="grid gap-8">
          {/* Profile Section */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              General
            </h2>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="text-sm font-medium">Display Name</label>
                  <p className="text-xs text-muted-foreground">
                    This name will be displayed on your dashboard.
                  </p>
                </div>
                <Input
                  type="text"
                  placeholder="Student"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="rounded-xl w-full sm:max-w-xs"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="text-sm font-medium">Default Semester</label>
                  <p className="text-xs text-muted-foreground">
                    Auto-selects this semester in the Materials and AI chat.
                  </p>
                </div>
                <Select
                  value={defaultSemester}
                  onValueChange={setDefaultSemester}
                  disabled={manifestLoading}
                >
                  <SelectTrigger className="rounded-xl w-full sm:max-w-xs">
                    <SelectValue placeholder={manifestLoading ? "Loading..." : "Select default semester"} />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* AI Settings Section */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              AI Configuration
            </h2>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="text-sm font-medium">Provider</label>
                  <p className="text-xs text-muted-foreground">Select AI provider to use</p>
                </div>
                <Select
                  value={aiConfig.providerId}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger className="rounded-xl w-full sm:max-w-xs">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {aiConfig.providerId === "custom" && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <label className="text-sm font-medium">API Endpoint</label>
                    <p className="text-xs text-muted-foreground">
                      OpenAI-compatible API endpoint
                    </p>
                  </div>
                  <Input
                    type="text"
                    placeholder="http://localhost:11434/v1"
                    value={aiConfig.endpoint}
                    onChange={(e) =>
                      setAIConfig({ ...aiConfig, endpoint: e.target.value })
                    }
                    className="rounded-xl w-full sm:max-w-xs"
                  />
                </div>
              )}

              {aiConfig.providerId && aiConfig.providerId !== "custom" && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <label className="text-sm font-medium">Model</label>
                    <p className="text-xs text-muted-foreground">Select the language model</p>
                  </div>
                  <Select
                    value={aiConfig.model}
                    onValueChange={(value) =>
                      setAIConfig({ ...aiConfig, model: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl w-full sm:max-w-xs">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProvider?.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {aiConfig.providerId === "custom" && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <label className="text-sm font-medium">Model Name</label>
                    <p className="text-xs text-muted-foreground">llama3.2, mistral, gpt-4, etc.</p>
                  </div>
                  <Input
                    type="text"
                    placeholder="llama3.2, mistral, gpt-4, etc."
                    value={aiConfig.model}
                    onChange={(e) =>
                      setAIConfig({ ...aiConfig, model: e.target.value })
                    }
                    className="rounded-xl w-full sm:max-w-xs"
                  />
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="text-sm font-medium">
                    API Key
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {selectedProvider?.apiKeyUrl ? (
                      <a
                        href={selectedProvider.apiKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 underline underline-offset-2"
                      >
                        Get API key <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      "Your secret API key"
                    )}
                  </p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder={
                      aiConfig.providerId === "custom"
                        ? "Optional for local models"
                        : "sk-..."
                    }
                    value={aiConfig.apiKey}
                    onChange={(e) =>
                      setAIConfig({ ...aiConfig, apiKey: e.target.value })
                    }
                    className="rounded-xl pr-10 w-full"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Checkbox
                  id="remember"
                  checked={aiConfig.rememberDevice}
                  onCheckedChange={(checked) =>
                    setAIConfig({
                      ...aiConfig,
                      rememberDevice: checked as boolean,
                    })
                  }
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Remember on this device
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
