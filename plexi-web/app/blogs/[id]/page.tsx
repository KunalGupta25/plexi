"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Blog, getAdminBlogs } from "@/lib/admin-store";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InternalBlogPage() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      const blogs = await getAdminBlogs();
      const found = blogs.find((b) => (b._id === params.id || b.id === params.id));
      if (found && found.isInternal) {
        setBlog(found);
      }
    };
    fetchBlog();
  }, [params.id]);

  if (!blog) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Blog post not found.</p>
        <Button variant="outline" onClick={() => router.push("/blogs")}>Go back</Button>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-background pb-24 pt-10 px-4 md:px-8">
      <div className="mx-auto max-w-3xl">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/blogs")}
          className="mb-8 gap-2 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blogs
        </Button>

        <header className="mb-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              {blog.tag}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(blog.publishedAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {blog.source}
            </div>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            {blog.title}
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            {blog.description}
          </p>
        </header>

        <hr className="mb-12 border-border" />

        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-code:text-primary">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{blog.content || ""}</ReactMarkdown>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Plexi Hub</p>
          <div className="flex gap-4">
            <Tag className="h-4 w-4" />
            <span>{blog.tag}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
