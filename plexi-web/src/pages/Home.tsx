import React from "react";
import { Link } from "react-router-dom";
import { SEO } from "../components/SEO";

const Home: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-24 md:gap-32 pt-12 pb-24">
      <SEO
        title="Plexi | Study with Focus"
        description="Real materials. Real context. No generic AI noise. Plexi turns messy study material into a clean revision workflow."
      />

      {/* Hero Section */}
      <section className="relative px-6 flex flex-col items-center text-center max-w-5xl mx-auto">
        <div className="absolute -top-24 -z-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high text-primary text-xs font-bold uppercase tracking-widest mb-8 border border-primary/10 animate-fade-in-up">
          <span className="material-symbols-outlined text-[16px]">
            verified
          </span>
          The Study Interface
        </div>

        <h1 className="text-5xl md:text-8xl font-black font-headline tracking-tighter text-on-surface mb-8 leading-[0.9] animate-fade-in-up delay-100">
          Study with <span className="text-primary">Focus.</span>
        </h1>

        <p className="text-text-muted text-lg md:text-2xl max-w-2xl font-light leading-relaxed mb-12 animate-fade-in-up delay-200">
          Real materials. Real context. No generic AI noise. Plexi turns messy
          notes into a clean, AI-grounded revision workflow.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center animate-fade-in-up delay-300">
          <Link
            to="/assistant"
            className="px-10 py-5 rounded-full text-lg font-bold bg-primary text-on-primary shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all flex items-center gap-3"
          >
            Start Learning Now
            <span className="material-symbols-outlined text-[20px]">
              arrow_forward
            </span>
          </Link>
          <Link
            to="/hub"
            className="px-10 py-5 rounded-full text-lg font-bold text-on-surface hover:bg-surface-container-high transition-all border border-border/50"
          >
            Explore Materials
          </Link>
        </div>

        {/* Subtle Social Proof */}
        <div className="mt-20 flex flex-col items-center gap-6 animate-fade-in-up delay-500">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">
            Trusted by students from
          </span>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-40 grayscale contrast-125">
            <span className="text-xl font-black font-headline tracking-tighter">
              Parul University
            </span>
            <span className="text-xl font-black font-headline tracking-tighter">
              Computer Science
            </span>
            <span className="text-xl font-black font-headline tracking-tighter">
              Engineering
            </span>
          </div>
        </div>
      </section>

      {/* The "No More Boxes" Feature Section */}
      <section className="px-6 max-w-7xl mx-auto w-full animate-fade-in-up delay-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
          <div className="flex flex-col gap-6 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">target</span>
            </div>
            <h3 className="text-2xl font-bold font-headline text-on-surface tracking-tight">
              Scope the context
            </h3>
            <p className="text-text-muted leading-relaxed">
              Lock into specific semesters and subjects. No more irrelevant
              answers from general LLMs.
            </p>
          </div>
          <div className="flex flex-col gap-6 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">
                auto_stories
              </span>
            </div>
            <h3 className="text-2xl font-bold font-headline text-on-surface tracking-tight">
              Ground the knowledge
            </h3>
            <p className="text-text-muted leading-relaxed">
              Your materials are the source of truth. Plexi reads your notes
              before it speaks.
            </p>
          </div>
          <div className="flex flex-col gap-6 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">bolt</span>
            </div>
            <h3 className="text-2xl font-bold font-headline text-on-surface tracking-tight">
              Revise with speed
            </h3>
            <p className="text-text-muted leading-relaxed">
              Summaries, viva prep, and quick fact lookup. Built for the night
              before exams.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Break / Quote */}
      <section className="bg-surface-container-low/50 py-24 px-6 border-y border-border/30 animate-fade-in-up">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter text-on-surface mb-8 italic">
            "It's like having the smartest student in the class explain their
            notes to you, instantly."
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-primary"></div>
            <span className="text-sm font-bold uppercase tracking-widest text-primary">
              Revision Reimagined
            </span>
            <div className="h-px w-12 bg-primary"></div>
          </div>
        </div>
      </section>

      {/* Blogs & Resources */}
      <section className="px-6 max-w-7xl mx-auto w-full animate-fade-in-up">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div className="max-w-xl">
            <h2 className="text-4xl font-black font-headline tracking-tighter text-on-surface mb-4">
              Latest Insights
            </h2>
            <p className="text-text-muted font-light">
              Guides, updates, and deep dives into making Plexi work for your
              study routine.
            </p>
          </div>
          <a
            href="https://ko-fi.com/lazy_human"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-bold hover:underline flex items-center gap-2"
          >
            Support Development{" "}
            <span className="material-symbols-outlined text-sm">
              open_in_new
            </span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <a
            href="https://ko-fi.com/post/Setting-Up-Plexi-MCP-for-Claude-and-ChatGPT-X8X11X3IKZ"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-6 p-8 rounded-3xl bg-surface-container-lowest border border-border/30 hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 animate-scale-up delay-100"
          >
            <div className="text-primary font-bold text-xs uppercase tracking-[0.2em]">
              Article
            </div>
            <h3 className="text-xl font-bold font-headline text-on-surface group-hover:text-primary transition-colors leading-snug">
              A Smarter Way to Study Without Wrestling the Internet
            </h3>
            <span className="material-symbols-outlined text-text-muted group-hover:translate-x-2 transition-transform self-end">
              arrow_right_alt
            </span>
          </a>
          <a
            href="https://lazyhuman.notion.site/Setting-Up-Plexi-MCP-for-Claude-and-ChatGPT-336e3502f0918090b69fdbed148e8e55"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-6 p-8 rounded-3xl bg-surface-container-lowest border border-border/30 hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 animate-scale-up delay-200"
          >
            <div className="text-primary font-bold text-xs uppercase tracking-[0.2em]">
              Guide
            </div>
            <h3 className="text-xl font-bold font-headline text-on-surface group-hover:text-primary transition-colors leading-snug">
              Setting Up Plexi MCP for Claude and ChatGPT
            </h3>
            <span className="material-symbols-outlined text-text-muted group-hover:translate-x-2 transition-transform self-end">
              arrow_right_alt
            </span>
          </a>
          <a
            href="https://lazyhuman.notion.site/How-to-use-Plexi-Assistant-339e3502f091806b98e8d850706ebd47"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-6 p-8 rounded-3xl bg-surface-container-lowest border border-border/30 hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 animate-scale-up delay-300"
          >
            <div className="text-primary font-bold text-xs uppercase tracking-[0.2em]">
              Tutorial
            </div>
            <h3 className="text-xl font-bold font-headline text-on-surface group-hover:text-primary transition-colors leading-snug">
              Mastering the Plexi Assistant Workflow
            </h3>
            <span className="material-symbols-outlined text-text-muted group-hover:translate-x-2 transition-transform self-end">
              arrow_right_alt
            </span>
          </a>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 mb-12 animate-scale-up delay-500">
        <div className="max-w-7xl mx-auto rounded-[3rem] bg-primary p-12 md:p-24 text-center flex flex-col items-center gap-8 relative overflow-hidden shadow-2xl shadow-primary/40 transition-colors duration-500">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-32 -mb-32 blur-[100px] pointer-events-none"></div>

          <h2 className="text-4xl md:text-7xl font-black font-headline tracking-tighter text-white max-w-4xl relative z-10 leading-[0.9]">
            Stop searching. Start understanding.
          </h2>
          <p className="text-white/80 text-lg md:text-xl max-w-xl font-light relative z-10">
            Join thousands of students who have reclaimed their study time from
            generic search results.
          </p>
          <Link
            to="/assistant"
            className="px-12 py-6 rounded-full text-xl font-bold bg-white text-primary shadow-xl hover:scale-105 hover:shadow-white/20 transition-all relative z-10"
          >
            Launch Assistant
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
