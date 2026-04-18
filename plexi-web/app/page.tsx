import Link from "next/link"
import { ArrowRight, BookOpen, Brain, Zap, FileText, Sparkles, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col pb-20 pt-14 md:min-h-screen md:pb-0 md:pt-0">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center lg:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Learning Platform</span>
          </div>
          
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your Study Material,{" "}
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Supercharged by AI
            </span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground lg:text-xl">
            Access all your notes, presentations, and syllabi in one place. 
            Let AI help you understand, summarize, and master your study materials.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base">
              <Link href="/materials">
                Browse Materials
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-8 text-base">
              <Link href="/ai">
                Configure AI
                <Bot className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-secondary/30 px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to excel
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Plexi combines intelligent document management with AI-powered study assistance.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Material Hub"
              description="Organize and access all your study materials by semester, subject, and type. View PDFs directly in the browser."
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="AI Study Assistant"
              description="Ask questions about your materials. Get answers with direct citations to your notes and documents."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="RAG-Powered Search"
              description="Our AI understands context from your documents, providing accurate and relevant responses."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Multiple Formats"
              description="Support for notes, presentations, syllabi, and more. Everything in one unified interface."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Smart Summaries"
              description="Get instant summaries of complex topics. Understand key concepts faster than ever."
            />
            <FeatureCard
              icon={<Bot className="h-6 w-6" />}
              title="MCP Integration"
              description="Use Plexi with ChatGPT, Claude, and other AI tools through Model Context Protocol."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to supercharge your studies?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Start browsing your materials or set up the AI assistant to get personalized help.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-xl px-8">
              <Link href="/materials">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="h-12 rounded-xl px-8">
              <Link href="/integrations">
                View Integrations
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Plexi</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your AI-powered study companion
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent/50">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
