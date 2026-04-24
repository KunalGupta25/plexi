"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  Code2,
  Plug,
  ArrowRight,
  Terminal,
  Info,
  ArrowLeft,
  Monitor,
  Wrench,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const MCP_URL = "https://plexi-mcp.vercel.app/api/mcp"
const CHATGPT_URL = "https://chatgpt.com/g/g-69caa671910481919ce71d19952e34e5-plexi"

const manualConfig = `"plexi": {
  "command": "npx",
  "args": [
    "-y",
    "mcp-remote",
    "${MCP_URL}"
  ]
}`

const windowsScript = `irm ${MCP_URL.replace("/api/mcp", "/setup/getclaude.js")} | node --input-type=module`
const macScript = `curl -s ${MCP_URL.replace("/api/mcp", "/setup/getclaude.js")} | node --input-type=module`

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 rounded-lg shrink-0">
      {copied ? (
        <><Check className="mr-1.5 h-3.5 w-3.5" />Copied</>
      ) : (
        <><Copy className="mr-1.5 h-3.5 w-3.5" />{label}</>
      )}
    </Button>
  )
}

function CodeBlock({ filename, code }: { filename?: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-black/5 dark:bg-black/20">
      {filename && (
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">{filename}</span>
          <CopyButton text={code} />
        </div>
      )}
      <div className={cn("relative", !filename && "flex items-start justify-between gap-2 p-4")}>
        <pre className={cn("overflow-x-auto font-mono text-sm", filename ? "p-4" : "flex-1 m-0")}>
          <code className="text-primary">{code}</code>
        </pre>
        {!filename && <CopyButton text={code} />}
      </div>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="text-primary/80">{children}</div>
    </div>
  )
}

export default function IntegrationsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col">
        
        {/* Header Navigation */}
        <header className="mb-10 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="h-10 w-10 shrink-0 rounded-full bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Integrations
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Access Plexi from your favourite AI tools
            </p>
          </div>
        </header>

        {/* Hero Section */}
        <div className="mb-12 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Model Context Protocol (MCP)</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
              Use Plexi Anywhere
            </h2>
            <p className="text-lg text-muted-foreground">
              Integrate Plexi with ChatGPT or Claude and access your study materials directly within your conversation flow.
            </p>
          </div>
        </div>

        {/* Integration Cards */}
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          {/* ChatGPT Card */}
          <div className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
            <div>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#10a37f]/10 text-[#10a37f]">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Plexi on ChatGPT</h3>
              <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
                Use Plexi as a custom GPT. Zero setup needed — just open and start chatting with your materials.
              </p>
            </div>
            <Button className="w-full rounded-xl" asChild>
              <a href={CHATGPT_URL} target="_blank" rel="noopener noreferrer">
                Open in ChatGPT
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Claude Card */}
          <div className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
            <div>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plug className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Claude Integration</h3>
              <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
                Connect Plexi to Claude Desktop or web via MCP server. Choose between three easy setup options.
              </p>
            </div>
            <Button variant="secondary" className="w-full rounded-xl" asChild>
              <a href="#claude-setup">
                View Setup Guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Claude Setup Guide */}
        <section id="claude-setup" className="scroll-mt-20">
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Claude Setup Guide</h2>
            </div>
            <p className="text-muted-foreground">
              Configure Plexi as an MCP tool in Claude to allow the AI to search your study materials.
            </p>
          </div>

          <Tabs defaultValue="connector" className="w-full">
            <TabsList className="mb-8 grid w-full grid-cols-3 rounded-2xl p-1 h-auto bg-muted/50">
              <TabsTrigger value="connector" className="rounded-xl py-3 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Custom Connector</span>
                <span className="sm:hidden">Simple</span>
              </TabsTrigger>
              <TabsTrigger value="script" className="rounded-xl py-3 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Terminal className="h-4 w-4" />
                <span className="hidden sm:inline">One-Click Script</span>
                <span className="sm:hidden">Script</span>
              </TabsTrigger>
              <TabsTrigger value="manual" className="rounded-xl py-3 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Manual Config</span>
                <span className="sm:hidden">Manual</span>
              </TabsTrigger>
            </TabsList>

            {/* Option 1: Connector */}
            <TabsContent value="connector" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 focus-visible:outline-none">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Option 1: Custom Connector <span className="ml-2 text-sm font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">Recommended</span></h3>
                </div>
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  Best for Claude.ai web users. This method requires no local setup and works directly through the Claude interface.
                </p>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">1</div>
                    <p>Open Claude and go to <span className="font-medium text-foreground">Connectors</span> tab under settings.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">2</div>
                    <p>Click <span className="font-medium text-foreground">Add Custom Connector</span> and enter <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">Plexi</code> as the name.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">3</div>
                    <div className="flex-1 space-y-3">
                      <p>Paste the following as the <span className="font-medium text-foreground">Remote MCP Server URL</span>:</p>
                      <CodeBlock code={MCP_URL} />
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <Note>
                    Custom connectors are currently in beta. Free tier users are limited to one active custom connector.
                  </Note>
                </div>
              </div>
            </TabsContent>

            {/* Option 2: Script */}
            <TabsContent value="script" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 focus-visible:outline-none">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Option 2: One-Click Script</h3>
                </div>
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  Best for users of the <span className="font-medium text-foreground">Claude Desktop app</span>. This script automatically updates your configuration file.
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Monitor className="h-3.5 w-3.5" /> Windows
                    </p>
                    <CodeBlock code={windowsScript} />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Monitor className="h-3.5 w-3.5" /> macOS
                    </p>
                    <CodeBlock code={macScript} />
                  </div>
                </div>
                
                <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <p>Restart Claude Desktop after running the command to apply changes.</p>
                </div>
              </div>
            </TabsContent>

            {/* Option 3: Manual */}
            <TabsContent value="manual" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 focus-visible:outline-none">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Option 3: Manual Configuration</h3>
                </div>
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  For advanced users. Edit your <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">claude_desktop_config.json</code> manually.
                </p>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" /> Config File Location
                    </p>
                    <ul className="grid gap-2 text-sm sm:grid-cols-2">
                      <li className="rounded-xl border border-border bg-muted/30 p-3">
                        <span className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Windows</span>
                        <code className="block break-all font-mono text-xs">%APPDATA%\Claude\claude_desktop_config.json</code>
                      </li>
                      <li className="rounded-xl border border-border bg-muted/30 p-3">
                        <span className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">macOS</span>
                        <code className="block break-all font-mono text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Add this entry to <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">mcpServers</code>:</p>
                    <CodeBlock filename="claude_desktop_config.json" code={manualConfig} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>Need help? Check our <a href="/blogs" className="underline underline-offset-4">Guide to MCP</a> or contact support.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
