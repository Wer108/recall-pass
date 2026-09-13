import React, { useState } from "react";
import { TopicSection } from "../types";
import { CheckCircle2, Copy, Check, Bookmark, FileText } from "lucide-react";

interface NotesSectionProps {
  sections: TopicSection[];
  searchQuery?: string;
  isEditable?: boolean;
  onUpdateSection?: (index: number, updated: TopicSection) => void;
  onRemoveSection?: (index: number) => void;
  onAddSection?: () => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  sections,
  searchQuery = "",
  isEditable = false,
  onUpdateSection,
  onRemoveSection,
  onAddSection,
}) => {
  const [copiedSectionIndex, setCopiedSectionIndex] = useState<number | null>(null);

  const copySection = (index: number, section: TopicSection) => {
    const text = `${section.title}\n\n${section.bullets.map((b) => `• ${b}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedSectionIndex(index);
    setTimeout(() => setCopiedSectionIndex(null), 2000);
  };

  const filteredSections = sections.filter((sec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.bullets.some((b) => b.toLowerCase().includes(q))
    );
  });

  return (
    <section id="topic-notes-container" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#0F2540] text-white flex items-center justify-center shadow-xs">
            <FileText className="w-4 h-4 text-[#C98A2C]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0F2540] tracking-tight">
              Topic-Segmented Notes
            </h2>
            <p className="text-xs text-slate-500">
              High-yield, actionable bullet points broken down by session segments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{sections.length}</span>{" "}
          sections •{" "}
          <span className="font-semibold text-slate-700">
            {sections.reduce((acc, s) => acc + s.bullets.length, 0)}
          </span>{" "}
          actionable points
        </div>
      </div>

      {filteredSections.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-white border border-slate-200 text-slate-500">
          No topic sections match "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredSections.map((section, idx) => {
            const actualIndex = sections.findIndex((s) => s.id === section.id);
            return (
              <div
                key={section.id || idx}
                id={`note-card-${idx}`}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Header of the section card */}
                <div className="px-5 py-4 bg-[#0F2540]/[0.03] border-b border-slate-100 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#0F2540] text-[#C98A2C] font-semibold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    {isEditable && onUpdateSection ? (
                      <input
                        id={`edit-sec-title-${idx}`}
                        type="text"
                        value={section.title}
                        onChange={(e) =>
                          onUpdateSection(actualIndex, {
                            ...section,
                            title: e.target.value,
                          })
                        }
                        className="font-semibold text-base text-[#0F2540] bg-white border border-slate-300 rounded px-2.5 py-1 focus:outline-hidden focus:ring-2 focus:ring-[#0F2540] w-full"
                        placeholder="Section title (e.g. Core Architectural Concept)"
                      />
                    ) : (
                      <h3 className="font-semibold text-base text-[#0F2540]">
                        {section.title}
                      </h3>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isEditable && (
                      <button
                        id={`btn-copy-section-${idx}`}
                        onClick={() => copySection(idx, section)}
                        className="text-xs text-slate-500 hover:text-[#0F2540] flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-slate-200 transition-colors"
                        title="Copy section notes to clipboard"
                      >
                        {copiedSectionIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}

                    {isEditable && onRemoveSection && (
                      <button
                        id={`btn-remove-section-${idx}`}
                        onClick={() => onRemoveSection(actualIndex)}
                        className="text-xs text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50"
                      >
                        Remove Section
                      </button>
                    )}
                  </div>
                </div>

                {/* Bullets List */}
                <div className="p-5">
                  <ul className="space-y-3">
                    {section.bullets.map((bullet, bulletIdx) => (
                      <li
                        key={bulletIdx}
                        className="flex items-start gap-3 group text-slate-700 text-sm leading-relaxed"
                      >
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#C98A2C] shrink-0 group-hover:scale-125 transition-transform" />
                        {isEditable && onUpdateSection ? (
                          <div className="flex-1 flex items-start gap-2">
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => {
                                const newBullets = [...section.bullets];
                                newBullets[bulletIdx] = e.target.value;
                                onUpdateSection(actualIndex, {
                                  ...section,
                                  bullets: newBullets,
                                });
                              }}
                              className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0F2540]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newBullets = section.bullets.filter(
                                  (_, i) => i !== bulletIdx
                                );
                                onUpdateSection(actualIndex, {
                                  ...section,
                                  bullets: newBullets,
                                });
                              }}
                              className="text-xs text-rose-500 hover:text-rose-700 p-1"
                              title="Delete bullet"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="flex-1">{bullet}</span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Add bullet point in editable mode */}
                  {isEditable && onUpdateSection && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-start">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSection(actualIndex, {
                            ...section,
                            bullets: [...section.bullets, "New recall point"],
                          });
                        }}
                        className="text-xs font-medium text-[#0F2540] hover:text-[#C98A2C] flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        + Add Bullet Point
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add section button in editable mode */}
      {isEditable && onAddSection && (
        <div className="pt-2">
          <button
            id="btn-add-topic-section"
            type="button"
            onClick={onAddSection}
            className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-[#0F2540] rounded-xl text-sm font-semibold text-[#0F2540] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            + Add New Topic Section
          </button>
        </div>
      )}
    </section>
  );
};
