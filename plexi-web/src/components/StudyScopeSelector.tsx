import { useState } from "react";

interface StudyScopeSelectorProps {
  semesters: string[];
  subjects: string[];
  selectedSemester: string;
  onSelectSemester: (semester: string) => void;
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
  onConfirm: () => void;
}

// A small helper to cycle through icons for subjects since we only have string names
const SUBJECT_ICONS = [
  "biotech",
  "functions",
  "architecture",
  "psychology",
  "code_blocks",
  "menu_book",
  "science",
  "calculate",
  "data_object",
  "terminal",
];

const getIconForIndex = (index: number) =>
  SUBJECT_ICONS[index % SUBJECT_ICONS.length];

export default function StudyScopeSelector({
  semesters,
  subjects,
  selectedSemester,
  onSelectSemester,
  selectedSubject,
  onSelectSubject,
  onConfirm,
}: StudyScopeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubjects = subjects.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full h-full flex flex-col bg-surface text-on-surface overflow-hidden relative">
      <main className="flex-1 px-4 sm:px-6 md:px-10 py-4 sm:py-6 lg:py-8 w-full flex flex-col min-h-0">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-4 md:mb-6 gap-4 md:gap-6 shrink-0 pr-8 md:pr-12">
          <div className="max-w-2xl">
            <span className="label-md uppercase tracking-widest text-secondary font-semibold text-[10px] mb-2 block">
              Academic Curator
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-on-surface tracking-tight leading-none font-headline">
              Define Your <span className="text-primary">Scope</span>
            </h1>
            <p className="mt-2 text-on-surface-variant text-sm max-w-md leading-relaxed">
              Select your current academic focus to tailor the AI's knowledge
              base to your specific curriculum and goals.
            </p>
          </div>
          <div className="flex-shrink-0 hidden md:block">
            <div className="bg-surface-container-low p-4 rounded-xl border-l-4 border-primary">
              <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1">
                Session Info
              </p>
              <p className="text-on-surface font-bold text-xs">
                Plexi AI Assistant
              </p>
            </div>
          </div>
        </header>

        {/* Selection Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0 overflow-y-auto lg:overflow-visible">
          {/* Step 1: Semester Selection (Left Column) */}
          <section className="lg:col-span-4 flex flex-col space-y-3 lg:min-h-0 lg:h-full">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2 font-headline shrink-0">
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px]">
                1
              </span>
              Choose Semester
            </h2>
            <div className="flex-1 space-y-2 p-1 -m-1 lg:overflow-y-auto pr-3 pb-4 custom-scrollbar lg:min-h-0">
              {semesters.map((sem) => {
                const isActive = selectedSemester === sem;
                return (
                  <button
                    key={sem}
                    onClick={() => {
                      onSelectSemester(sem);
                      onSelectSubject(""); // Reset subject when semester changes
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between group border-2 ${
                      isActive
                        ? "bg-surface-container-lowest border-primary shadow-sm"
                        : "bg-surface-container-low border-transparent hover:bg-surface-container-high"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${
                          isActive ? "text-primary" : "text-secondary"
                        }`}
                      >
                        {isActive ? "Selected" : "Available"}
                      </p>
                      <p className="text-base font-bold text-on-surface">
                        {sem}
                      </p>
                    </div>
                    <span
                      className={`material-symbols-outlined text-[20px] transition-all ${
                        isActive
                          ? "text-primary opacity-100"
                          : "opacity-0 group-hover:opacity-40"
                      }`}
                      style={
                        isActive ? { fontVariationSettings: "'FILL' 1" } : {}
                      }
                    >
                      {isActive ? "check_circle" : "arrow_forward"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2: Subject Selection (Right Column) */}
          <section className="lg:col-span-8 flex flex-col space-y-3 lg:min-h-0 lg:h-full mt-4 lg:mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2 font-headline">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-colors ${
                    selectedSemester
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-highest text-on-surface"
                  }`}
                >
                  2
                </span>
                Select Subject
              </h2>
              <div className="relative w-full sm:w-56">
                <input
                  className="w-full bg-surface-container-high border-none rounded-full pl-4 pr-9 py-2 text-xs focus:ring-2 focus:ring-primary transition-all outline-none text-on-surface placeholder:text-outline"
                  placeholder="Search subjects..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!selectedSemester}
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                  search
                </span>
              </div>
            </div>

            <div className="flex-1 lg:overflow-y-auto p-1 -m-1 pr-3 pb-4 custom-scrollbar lg:min-h-0">
              {!selectedSemester ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-surface-container-lowest/50 rounded-2xl border-2 border-dashed border-outline-variant/30">
                  <span className="material-symbols-outlined text-4xl text-outline/40 mb-3">
                    school
                  </span>
                  <p className="text-on-surface-variant font-medium text-sm">
                    Select a semester first to view available subjects.
                  </p>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <p className="text-on-surface-variant font-medium text-sm">
                    No subjects found matching "{searchQuery}".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-1 pb-2">
                  {filteredSubjects.map((sub, idx) => {
                    const isActive = selectedSubject === sub;
                    return (
                      <div
                        key={sub}
                        onClick={() => onSelectSubject(sub)}
                        className={`group relative overflow-hidden rounded-xl p-4 transition-all cursor-pointer ring-2 ${
                          isActive
                            ? "bg-primary-fixed/20 ring-primary shadow-md"
                            : "bg-surface-container-lowest ring-transparent hover:ring-primary-fixed hover:shadow-xl hover:shadow-primary/5"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${
                            isActive
                              ? "bg-primary text-on-primary"
                              : "bg-primary-fixed text-primary"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {getIconForIndex(idx)}
                          </span>
                        </div>
                        <h3
                          className="text-sm font-bold text-on-surface leading-tight mb-1 truncate"
                          title={sub}
                        >
                          {sub}
                        </h3>
                        <p className="text-[10px] text-secondary font-medium uppercase tracking-tighter truncate opacity-80">
                          {selectedSemester}
                        </p>

                        {isActive && (
                          <span
                            className="material-symbols-outlined text-[18px] absolute top-3 right-3 text-primary"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Call to Action */}
        <div className="mt-3 lg:mt-5 pt-3 lg:pt-5 border-t border-outline-variant/20 flex flex-col items-center shrink-0">
          <button
            onClick={onConfirm}
            disabled={!selectedSemester || !selectedSubject}
            className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
              selectedSemester && selectedSubject
                ? "bg-primary text-on-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 active:opacity-80 cursor-pointer"
                : "bg-surface-container-highest text-outline cursor-not-allowed"
            }`}
          >
            Start Chatting
            <span className="material-symbols-outlined text-[18px]">
              {selectedSemester && selectedSubject ? "bolt" : "lock"}
            </span>
          </button>

          <div className="mt-3 h-5 flex items-center justify-center">
            {selectedSemester && selectedSubject ? (
              <p className="text-[11px] text-secondary font-medium animate-pulse">
                Ready to connect to{" "}
                <span className="font-bold text-on-surface">
                  {selectedSubject}
                </span>
              </p>
            ) : (
              <p className="text-[11px] text-outline font-medium">
                Please select both a semester and a subject to continue
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
