import React from "react";
import { Link } from "react-router-dom";
import { SEO } from "../components/SEO";

const Home: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto py-4 md:py-8 flex flex-col gap-8 md:gap-12">
      <SEO 
        title="Plexi | Home"
        description="Study with real materials, not generic answers. Plexi turns messy study material into a clean revision workflow."
      />
      <section className="bg-surface-container-lowest rounded-3xl md:rounded-[2rem] p-6 md:p-16 shadow-[0_12px_40px_rgba(25,28,29,0.06)] relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-fixed/30 rounded-full blur-[80px]"></div>
        <div className="relative z-10">
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-surface-container-high text-on-surface-variant font-label">
              Parul University | CS
            </div>
            <div className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-surface-container-high text-on-surface-variant font-label">
              RAG + BYOM
            </div>
          </div>

          <div className="text-secondary font-label uppercase tracking-widest text-xs mb-4 block font-bold">
            Study interface, not a generic chatbot
          </div>

          <h1 className="text-display-lg text-4xl md:text-6xl font-black font-headline tracking-tight text-primary mb-6 max-w-4xl leading-tight">
            Plexi turns messy study material into a clean revision workflow.
          </h1>

          <p className="text-on-surface-variant max-w-3xl text-lg md:text-xl font-light leading-relaxed mb-10">
            Browse actual notes, open files without leaving the app, and ask
            focused questions against the right subject context. The visual
            language is sharper, but the real value is speed: less hunting, less
            tab chaos, better revision sessions.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <span className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-fixed/50 text-primary font-medium text-sm font-label border border-primary/10">
              <span className="material-symbols-outlined text-[18px]">
                bolt
              </span>
              Fast retrieval
            </span>
            <span className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-fixed/50 text-primary font-medium text-sm font-label border border-primary/10">
              <span className="material-symbols-outlined text-[18px]">
                local_library
              </span>
              Scoped material hub
            </span>
            <span className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-fixed/50 text-primary font-medium text-sm font-label border border-primary/10">
              <span className="material-symbols-outlined text-[18px]">
                psychology
              </span>
              AI grounded in notes
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/assistant"
              className="px-8 py-4 rounded-full text-base font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-[20px]">
                auto_awesome
              </span>
              Open Assistant
            </Link>
            <Link
              to="/hub"
              className="px-8 py-4 rounded-full text-base font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all flex items-center justify-center gap-3 border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[20px]">
                menu_book
              </span>
              Explore Materials
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 md:gap-8">
        <div className="flex flex-col gap-6 md:gap-8">
          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-secondary font-label mb-6">
              How Plexi Works
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <article className="flex flex-col gap-2">
                <div className="text-primary text-xs font-bold uppercase tracking-widest font-label mb-1">
                  01
                </div>
                <div className="text-xl font-bold font-headline text-on-surface">
                  Choose a course
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Lock into one semester and subject so browsing and chat stay
                  focused.
                </p>
              </article>
              <article className="flex flex-col gap-2">
                <div className="text-primary text-xs font-bold uppercase tracking-widest font-label mb-1">
                  02
                </div>
                <div className="text-xl font-bold font-headline text-on-surface">
                  Open the material
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Preview PDFs, inspect notes, and jump into the exact file that
                  matters.
                </p>
              </article>
              <article className="flex flex-col gap-2">
                <div className="text-primary text-xs font-bold uppercase tracking-widest font-label mb-1">
                  03
                </div>
                <div className="text-xl font-bold font-headline text-on-surface">
                  Ask with context
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Plexi retrieves relevant chunks before calling your configured
                  model.
                </p>
              </article>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-secondary font-label mb-6">
              Why This Feels Better
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <article className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20">
                <h3 className="font-bold font-headline text-lg mb-2 text-on-surface">
                  Built for revision, not prompting theatre
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  The interface keeps the scope visible so you know what Plexi
                  is reading from and why the answer is relevant.
                </p>
              </article>
              <article className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20">
                <h3 className="font-bold font-headline text-lg mb-2 text-on-surface">
                  Designed around fewer clicks
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Pick a course, open a file, ask a question. The app now reads
                  more like a focused workspace than a demo page.
                </p>
              </article>
            </div>
          </div>

          {/* Blogs Section */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-secondary font-label mb-6">
              Latest Blogs
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <a
                href="https://ko-fi.com/post/Setting-Up-Plexi-MCP-for-Claude-and-ChatGPT-X8X11X3IKZ"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface-container-low p-4 md:p-6 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors flex flex-row md:flex-col items-center md:items-start gap-4 group"
              >
                <div className="w-12 h-12 md:w-10 md:h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">
                    article
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold font-headline text-base md:text-lg mb-1 text-on-surface line-clamp-2 md:line-clamp-3 group-hover:text-primary transition-colors">
                    Plexi: A Smarter Way to Study Without Wrestling the Internet
                  </h3>
                </div>
              </a>

              <a
                href="https://lazyhuman.notion.site/Setting-Up-Plexi-MCP-for-Claude-and-ChatGPT-336e3502f0918090b69fdbed148e8e55?source=copy_link"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface-container-low p-4 md:p-6 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors flex flex-row md:flex-col items-center md:items-start gap-4 group"
              >
                <div className="w-12 h-12 md:w-10 md:h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">
                    article
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold font-headline text-base md:text-lg mb-1 text-on-surface line-clamp-2 md:line-clamp-3 group-hover:text-primary transition-colors">
                    Setting Up Plexi MCP for Claude and ChatGPT
                  </h3>
                </div>
              </a>

              <a
                href="https://lazyhuman.notion.site/How-to-use-Plexi-Assistant-339e3502f091806b98e8d850706ebd47?source=copy_link"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface-container-low p-4 md:p-6 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors flex flex-row md:flex-col items-center md:items-start gap-4 group"
              >
                <div className="w-12 h-12 md:w-10 md:h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">
                    article
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold font-headline text-base md:text-lg mb-1 text-on-surface line-clamp-2 md:line-clamp-3 group-hover:text-primary transition-colors">
                    How to use Plexi Assistant
                  </h3>
                </div>
              </a>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6 md:gap-8">
          <section className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-secondary font-label mb-4">
              What You Can Do
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container font-label">
                Summaries
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container font-label">
                Viva prep
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container font-label">
                Exam topics
              </span>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Move from raw files to explainers, revision prompts, and quick
              fact lookup without losing the source context.
            </p>
          </section>

          <section className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-secondary font-label mb-4">
              Contribute
            </div>
            <h3 className="font-bold font-headline text-lg mb-2 text-on-surface">
              Share materials that actually help
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              Plexi gets better when the study library gets cleaner. Notes,
              slides, and useful resources all improve the downstream answers.
            </p>
            <div className="h-px bg-outline-variant/30 w-full mb-6"></div>
            <a
              href="https://github.com/KunalGupta25/plexi-materials"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-6 py-3 rounded-full text-sm font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2 border border-outline-variant/30 group"
            >
              <span className="material-symbols-outlined text-[18px]">
                code
              </span>
              Open Materials Repo
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </a>
          </section>
        </aside>
      </section>
    </div>
  );
};

export default Home;
