import { ExternalLink, BookOpen, FileText } from "lucide-react"

const posts = [
  {
    title: "Plexi AI Study Hub",
    description:
      "A general Introduction about what Plexi is and how it works.",
    url: "https://ko-fi.com/post/Setting-Up-Plexi-MCP-for-Claude-and-ChatGPT-X8X11X3IKZ",
    tag: "Blog",
    source: "Ko-fi",
  },
  {
    title: "How to use Plexi Assistant",
    description:
      "A complete guide on using the Plexi AI Assistant — setting up your provider, selecting study scope, asking questions, and getting the most out of your study materials.",
    url: "https://www.notion.so/lazyhuman/How-to-use-Plexi-Assistant-339e3502f091806b98e8d850706ebd47",
    tag: "Guide",
    source: "Notion",
  },
  {
    title: "Plexi Quick Start Guide",
    description:
      "A quick start guide to using Plexi - How to use Material Hub and Plexi Agent",
    url: "https://github.com/KunalGupta25/plexi/wiki/Quick-Start",
    tag: "Guide",
    source: "plexi/Github",
  },
  {
    title: "Plexi Wiki",
    description:
      "The complete guide to Plexi - How to use Material Hub, Plexi Agent, MCP, and more.",
    url: "https://github.com/KunalGupta25/plexi/wiki",
    tag: "Wiki",
    source: "plexi/Github",
  },
]

const tagStyles: Record<string, string> = {
  Blog: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Wiki: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  Guide: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

export default function BlogsPage() {
  return (
    <div className="min-h-screen px-4 py-12 pb-24 pt-14 md:min-h-screen md:pb-12 md:pt-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>Blog & Guides</span>
          </div>
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Learn &amp; Get the Most Out of Plexi
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Posts and guides I&apos;ve written to help you set up Plexi, understand how it works, and use it effectively.
          </p>
        </div>

        {/* Blog Cards */}
        <div className="space-y-4">
          {posts.map((post) => (
            <a
              key={post.url}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20 hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tagStyles[post.tag]}`}
                    >
                      {post.tag}
                    </span>
                    <span className="text-xs text-muted-foreground">{post.source}</span>
                  </div>
                  <h2 className="text-lg font-semibold leading-snug group-hover:underline group-hover:underline-offset-2">
                    {post.title}
                  </h2>
                </div>
                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{post.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
