"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Save,
  Trash2,
  ExternalLink,
  FileText,
  Globe,
  History,
  Layout,
  Settings,
  ArrowLeft,
  ChevronRight,
  Eye,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownEditor } from "@/components/markdown-editor";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import {
  getAdminBlogs,
  saveAdminBlog,
  deleteAdminBlog,
  Blog,
  publishReleaseNote,
  getLatestReleaseNote
} from "@/lib/admin-store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [editingBlog, setEditingBlog] = useState<Partial<Blog> | null>(null);
  const [releaseNote, setReleaseNote] = useState("");
  const [releaseButtonText, setReleaseButtonText] = useState("");
  const [releaseButtonUrl, setReleaseButtonUrl] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const refreshBlogs = async () => {
    setLoading(true);
    const data = await getAdminBlogs();
    setBlogs(data);
    setLoading(false);
  };

  useEffect(() => {
    const auth = sessionStorage.getItem("plexi_admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshBlogs();
      const fetchRelease = async () => {
        const latest = await getLatestReleaseNote();
        if (latest) setReleaseNote(latest.content);
      };
      fetchRelease();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("plexi_admin_auth", "true");
        toast.success("Welcome back, Admin!");
      } else {
        toast.error(data.error || "Incorrect password");
      }
    } catch (err) {
      toast.error("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-card p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-2">Please enter the master password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Master Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl text-center text-lg tracking-widest"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold">
              Enter Dashboard
            </Button>
          </form>

          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="w-full rounded-xl text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Site
          </Button>
        </div>
      </div>
    );
  }

  const handleSaveBlog = async () => {
    if (!editingBlog?.title || !editingBlog?.tag || !editingBlog?.source) {
      toast.error("Please fill in title, tag, and source");
      return;
    }

    try {
      const blogToSave = {
        ...editingBlog,
        id: editingBlog.id || Date.now().toString(),
        isInternal: editingBlog.isInternal || false,
        publishedAt: editingBlog.publishedAt || Date.now(),
      } as Blog;

      await saveAdminBlog(blogToSave);
      await refreshBlogs();
      setEditingBlog(null);
      toast.success("Blog saved to MongoDB");
    } catch (e) {
      toast.error("Failed to save blog");
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      try {
        await deleteAdminBlog(id);
        await refreshBlogs();
        toast.success("Blog deleted from MongoDB");
      } catch (e) {
        toast.error("Failed to delete blog");
      }
    }
  };

  const handlePublishReleaseNote = async () => {
    if (!releaseNote) {
      toast.error("Release note content cannot be empty");
      return;
    }
    try {
      await publishReleaseNote(releaseNote, releaseButtonText, releaseButtonUrl);
      toast.success("Release notes published to MongoDB!");
    } catch (e) {
      toast.error("Failed to publish release notes");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-10 px-4 md:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-secondary">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Manage blogs and release notes</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="blogs" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="blogs" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-card">
              <FileText className="h-4 w-4" /> Blogs
            </TabsTrigger>
            <TabsTrigger value="release" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-card">
              <History className="h-4 w-4" /> Release Notes
            </TabsTrigger>
          </TabsList>

          {/* Blogs Tab */}
          <TabsContent value="blogs" className="space-y-6">
            {!editingBlog ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Existing Blogs</h2>
                  <Button onClick={() => setEditingBlog({ isInternal: false, tag: "Blog", source: "Plexi" })} className="gap-2 rounded-xl">
                    <Plus className="h-4 w-4" /> Add Blog
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {blogs.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                      No custom blogs yet.
                    </div>
                  )}
                  {blogs.map((blog) => (
                    <div key={blog._id || blog.id} className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                          {blog.tag}
                        </span>
                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button variant="ghost" size="icon" onClick={() => setEditingBlog(blog)} className="h-8 w-8 rounded-lg">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteBlog((blog._id || blog.id) as string)} className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="mb-2 font-semibold line-clamp-1">{blog.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{blog.description}</p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                        <span className="text-[10px] text-muted-foreground uppercase">{blog.source}</span>
                        {blog.isInternal ? (
                          <span className="text-[10px] font-medium text-emerald-500">Internal</span>
                        ) : (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{editingBlog.id ? "Edit Blog" : "Create New Blog"}</h2>
                  <Button variant="ghost" onClick={() => setEditingBlog(null)} className="rounded-lg">Cancel</Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={editingBlog.title || ""}
                        onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                        placeholder="Blog Title"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tag</label>
                        <Input
                          value={editingBlog.tag || ""}
                          onChange={(e) => setEditingBlog({ ...editingBlog, tag: e.target.value })}
                          placeholder="Blog, Guide, Wiki..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Source</label>
                        <Input
                          value={editingBlog.source || ""}
                          onChange={(e) => setEditingBlog({ ...editingBlog, source: e.target.value })}
                          placeholder="Medium, Notion, GitHub..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={editingBlog.description || ""}
                        onChange={(e) => setEditingBlog({ ...editingBlog, description: e.target.value })}
                        placeholder="Short summary..."
                        className="h-20"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="isInternal"
                        checked={editingBlog.isInternal || false}
                        onChange={(e) => setEditingBlog({ ...editingBlog, isInternal: e.target.checked })}
                        className="h-4 w-4 rounded border-border"
                      />
                      <label htmlFor="isInternal" className="text-sm font-medium">Internal Blog (Markdown)</label>
                    </div>

                    {!editingBlog.isInternal ? (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <label className="text-sm font-medium">External URL</label>
                        <Input
                          value={editingBlog.url || ""}
                          onChange={(e) => setEditingBlog({ ...editingBlog, url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    ) : null}

                    <Button onClick={handleSaveBlog} className="w-full gap-2 rounded-xl h-12 mt-4">
                      <Save className="h-4 w-4" /> Save Blog
                    </Button>
                  </div>

                  {editingBlog.isInternal && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Content (Markdown)</label>
                        <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)} className="h-8 gap-2">
                          {previewMode ? <FileText className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {previewMode ? "Editor" : "Preview"}
                        </Button>
                      </div>
                      {previewMode ? (
                        <div className="prose prose-sm dark:prose-invert h-[400px] overflow-y-auto rounded-xl border border-border bg-muted/30 p-4">
                          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{editingBlog.content || "_No content yet_"}</ReactMarkdown>
                        </div>
                      ) : (
                        <MarkdownEditor
                          value={editingBlog.content || ""}
                          onChange={(content) => setEditingBlog({ ...editingBlog, content })}
                          className="h-[400px] font-mono text-sm leading-relaxed"
                          onSave={handleSaveBlog}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Release Notes Tab */}
          <TabsContent value="release" className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Release Notes</h2>
                <p className="text-sm text-muted-foreground">Publish a new update notification for all users.</p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Action Button Text</label>
                      <Input
                        value={releaseButtonText}
                        onChange={(e) => setReleaseButtonText(e.target.value)}
                        placeholder="e.g. Read Detailed Notes"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Action Button URL</label>
                      <Input
                        value={releaseButtonUrl}
                        onChange={(e) => setReleaseButtonUrl(e.target.value)}
                        placeholder="https://..."
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Content Editor</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Ctrl+S to save | Paste images</span>
                      </div>
                    </div>
                    <MarkdownEditor
                      value={releaseNote}
                      onChange={setReleaseNote}
                      className="h-[400px] font-mono text-sm"
                      onSave={handlePublishReleaseNote}
                    />
                    <Button onClick={handlePublishReleaseNote} className="w-full gap-2 rounded-xl h-12">
                      <Globe className="h-4 w-4" /> Publish to All Users
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Live Preview</label>
                  <div className="h-[460px] overflow-y-auto rounded-2xl border border-border bg-muted/10 p-6">
                    {releaseNote ? (
                      <div className="prose prose-sm dark:prose-invert">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary uppercase">
                          Latest Update
                        </div>
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{releaseNote}</ReactMarkdown>
                        {releaseButtonText && (
                          <div className="mt-8">
                            <Button className="rounded-xl px-8" variant="outline" disabled>
                              {releaseButtonText}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground italic text-sm">
                        No content to preview
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
