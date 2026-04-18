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
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const mcpConfig = `{
  "mcpServers": {
    "plexi": {
      "command": "npx",
      "args": [
        "-y",
        "@plexi/mcp-server"
      ],
      "env": {
        "PLEXI_API_KEY": "your-api-key-here"
      }
    }
  }
}`

const steps = [
  {
    step: 1,
    title: "Install Claude Desktop",
    description: "Download and install Claude Desktop from Anthropic's website if you haven't already.",
  },
  {
    step: 2,
    title: "Open Configuration",
    description: "Navigate to Claude Desktop settings and find the MCP configuration section.",
  },
  {
    step: 3,
    title: "Add Plexi Server",
    description: "Copy the configuration below and add it to your Claude Desktop config file.",
  },
  {
    step: 4,
    title: "Restart Claude",
    description: "Restart Claude Desktop to load the new MCP server configuration.",
  },
]

export default function IntegrationsPage() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mcpConfig)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen px-4 py-12 pb-24 pt-14 md:min-h-screen md:pb-12 md:pt-12 lg:py-16">
      <div className="mx-auto max-w-4xl">
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
            Integrate Plexi with your favorite AI tools through the Model Context Protocol (MCP) 
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
              Use Plexi as a custom GPT to access your study materials directly within ChatGPT.
            </p>
            <Button className="rounded-xl">
              Open in ChatGPT
              <ExternalLink className="ml-2 h-4 w-4" />
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
              Connect Plexi to Claude Desktop using the Model Context Protocol for seamless access.
            </p>
            <Button variant="outline" className="rounded-xl" asChild>
              <a href="#mcp-setup">
                View Setup Guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5" />
          </div>
        </div>

        {/* MCP Setup Guide */}
        <section id="mcp-setup" className="scroll-mt-20">
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-2xl font-bold">Claude/MCP Integration</h2>
            </div>
            <p className="text-muted-foreground">
              Follow these steps to connect Plexi with Claude Desktop using the Model Context Protocol.
            </p>
          </div>

          {/* Steps */}
          <div className="mb-8 space-y-4">
            {steps.map((item, index) => (
              <div
                key={item.step}
                className="flex gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Code Block */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
              <span className="text-sm font-medium">claude_desktop_config.json</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 rounded-lg"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto p-4">
              <code className="font-mono text-sm">{mcpConfig}</code>
            </pre>
          </div>

          {/* Additional Info */}
          <div className="mt-8 rounded-xl border border-border bg-secondary/30 p-6">
            <h3 className="mb-2 font-semibold">Need Help?</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              If you're having trouble setting up the integration, check out our documentation 
              or reach out to our support team.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="rounded-xl">
                View Documentation
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl">
                Contact Support
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
