"use client"

import { useState } from "react"
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
  AlertCircle,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {filename && (
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">{filename}</span>
          <CopyButton text={code} />
        </div>
      )}
      <div className={cn("relative", !filename && "flex items-start justify-between gap-2 p-4")}>
        <pre className={cn("overflow-x-auto font-mono text-sm", filename ? "p-4" : "flex-1 m-0")}>
          <code>{code}</code>
        </pre>
        {!filename && <CopyButton text={code} />}
      </div>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-muted-foreground">{children}</p>
    </div>
  )
}

function OptionBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
      {n}
    </span>
  )
}

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen px-4 py-12 pb-24 pt-14 md:min-h-screen md:pb-12 md:pt-12 lg:py-16">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Plug className="h-4 w-4" />
            <span>Integrations</span>
          </div>
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Use Plexi Anywhere
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Integrate Plexi with your favourite AI tools through the Model Context Protocol (MCP)
            and access your study materials from anywhere.
          </p>
        </div>

        {/* Integration Cards */}
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          {/* ChatGPT Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Plexi on ChatGPT</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Use Plexi as a custom GPT to access your study materials directly within ChatGPT. No setup needed — just open and chat.
            </p>
            <Button className="rounded-xl" asChild>
              <a href={CHATGPT_URL} target="_blank" rel="noopener noreferrer">
                Open in ChatGPT
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5" />
          </div>

          {/* Claude Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Claude MCP Integration</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Connect Plexi to Claude using the Model Context Protocol — via a custom connector, a one-click script, or manual config.
            </p>
            <Button variant="outline" className="rounded-xl" asChild>
              <a href="#claude-setup">
                View Setup Guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5" />
          </div>
        </div>

        {/* Claude Setup Guide */}
        <section id="claude-setup" className="scroll-mt-20 space-y-10">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-2xl font-bold">Claude Setup Guide</h2>
            </div>
            <p className="text-muted-foreground">
              The Claude connector uses MCP (Model Context Protocol). Remote MCP connectors and custom connectors are still in beta
              and not yet available to all users. Free tier users are also limited to one active custom connector at a time,
              so keep that in mind.
            </p>
          </div>

          {/* Option 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <OptionBadge n={1} />
              <h3 className="text-lg font-semibold">Option 1 — Custom Connector <span className="text-sm font-normal text-muted-foreground">(Beta)</span></h3>
            </div>
            <p className="text-sm text-muted-foreground">
              If you have access to Claude's custom connector feature, this is the most straightforward path — no scripts, no config file editing.
            </p>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">1.</span>
                Open Claude and navigate to the <span className="font-medium text-foreground">Connectors</span> tab, then click <span className="font-medium text-foreground">Add Custom Connector</span>.
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">2.</span>
                Enter a name (e.g. <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Plexi</code>) and paste the following as the <span className="font-medium text-foreground">Remote MCP Server URL</span>:
              </li>
            </ol>
            <CodeBlock code={MCP_URL} />
            <ol className="space-y-3 text-sm text-muted-foreground" start={3}>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">3.</span>
                Click <span className="font-medium text-foreground">Add</span> and you're done. Set tool permissions to <span className="font-medium text-foreground">Always Allow</span> for a smoother experience.
              </li>
            </ol>
            <Note>
              Custom connectors are currently in beta and may not be available to all Claude users yet.
            </Note>
          </div>

          <hr className="border-border" />

          {/* Option 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <OptionBadge n={2} />
              <h3 className="text-lg font-semibold">Option 2 — One-Click Configurator</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Options 2 and 3 require the <span className="font-medium text-foreground">Claude Desktop app</span> to be installed.{" "}
              <a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline underline-offset-2">
                Download it from claude.ai/download <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              Open your terminal and run the command for your operating system. This script automatically configures the Plexi MCP server in your Claude Desktop setup.
              Restart Claude Desktop after running it and the connector will be active.
            </p>

            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" /> Windows
                </p>
                <CodeBlock code={windowsScript} />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" /> macOS
                </p>
                <CodeBlock code={macScript} />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Option 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <OptionBadge n={3} />
              <h3 className="text-lg font-semibold">Option 3 — Manual Configuration</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              If you prefer to set it up manually, you'll need to edit the Claude Desktop config file directly.
              The easiest way to find it is through the app itself: open Claude Desktop, go to <span className="font-medium text-foreground">Settings</span>,
              and navigate to the <span className="font-medium text-foreground">Developer</span> tab.
              Under the <span className="font-medium text-foreground">Local MCP Servers</span> section, click <span className="font-medium text-foreground">Edit Config</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              Alternatively, you can open the file directly from its default location:
            </p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-medium text-muted-foreground shrink-0">Windows:</span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all">%APPDATA%\Claude\claude_desktop_config.json</code>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-medium text-muted-foreground shrink-0">macOS:</span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all">~/Library/Application Support/Claude/claude_desktop_config.json</code>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Inside the config, locate the <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">mcpServers</code> object and add the following entry:
            </p>
            <CodeBlock filename="claude_desktop_config.json" code={manualConfig} />
            <p className="text-sm text-muted-foreground">
              Save the file, then restart Claude Desktop. The Plexi MCP server should now appear in your active connectors.
            </p>
          </div>

          {/* Note footer */}
          <Note>
            Option 1 is the recommended path for the best experience across platforms. Options 2 and 3 require the Claude Desktop app.
          </Note>
        </section>
      </div>
    </div>
  )
}
