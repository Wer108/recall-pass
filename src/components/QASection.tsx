import React from "react";
import { QAPair } from "../types";
import { HelpCircle, MessageSquareQuote, User, CheckCheck, Plus, Trash2 } from "lucide-react";

interface QASectionProps {
  qaList: QAPair[];
  searchQuery?: string;
  isEditable?: boolean;
  onUpdateQA?: (index: number, updated: QAPair) => void;
  onRemoveQA?: (index: number) => void;
  onAddQA?: () => void;
}

export const QASection: React.FC<QASectionProps> = ({
  qaList,
  searchQuery = "",
  isEditable = false,
  onUpdateQA,
  onRemoveQA,
  onAddQA,
}) => {
  const filteredQA = qaList.filter((qa) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      qa.question.toLowerCase().includes(q) ||
      qa.answer.toLowerCase().includes(q) ||
      (qa.askerContext && qa.askerContext.toLowerCase().includes(q))
    );
  });

  return (
    <section id="qa-notes-container" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#0F6E56]/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#0F6E56] text-white flex items-center justify-center shadow-xs">
            <MessageSquareQuote className="w-4 h-4 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#0F2540] tracking-tight">
                Live Audience & Speaker Q&A
              </h2>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EEF8F5] text-[#0F6E56] border border-[#0F6E56]/30">
                Verified Exchanges
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Only real exchanges that actually took place between attendees and the speaker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-[#0F6E56]">{qaList.length}</span>{" "}
          recorded exchange{qaList.length === 1 ? "" : "s"}
        </div>
      </div>

      {qaList.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-white border border-slate-200 text-slate-500">
          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <p className="font-medium text-slate-700">No audience Q&A detected in this session transcript.</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            RecallPass strictly extracts real audience exchanges present in the recording and does not synthesize fictional questions.
          </p>
        </div>
      ) : filteredQA.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-white border border-slate-200 text-slate-500">
          No Q&A exchanges match "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredQA.map((item, idx) => {
            const actualIndex = qaList.findIndex((q) => q.id === item.id);
            return (
              <div
                key={item.id || idx}
                id={`qa-card-${idx}`}
                className="bg-white rounded-xl border border-[#0F6E56]/25 shadow-xs hover:border-[#0F6E56]/50 transition-all overflow-hidden"
              >
                {/* Asker & Question Header */}
                <div className="p-4 sm:p-5 bg-[#EEF8F5] border-b border-[#0F6E56]/15">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-7 h-7 rounded-full bg-[#0F6E56] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold">Q{idx + 1}</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0F6E56] bg-white px-2 py-0.5 rounded border border-[#0F6E56]/20">
                            {item.askerContext || "Audience Member"}
                          </span>
                        </div>

                        {isEditable && onUpdateQA ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={item.askerContext || ""}
                              onChange={(e) =>
                                onUpdateQA(actualIndex, {
                                  ...item,
                                  askerContext: e.target.value,
                                })
                              }
                              placeholder="Audience member name (e.g. Sarah (Audience))"
                              className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded px-2.5 py-1"
                            />
                            <textarea
                              rows={2}
                              value={item.question}
                              onChange={(e) =>
                                onUpdateQA(actualIndex, {
                                  ...item,
                                  question: e.target.value,
                                })
                              }
                              placeholder="Audience question text..."
                              className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded p-2"
                            />
                          </div>
                        ) : (
                          <h3 className="text-base font-semibold text-[#0F2540] leading-snug">
                            "{item.question}"
                          </h3>
                        )}
                      </div>
                    </div>

                    {isEditable && onRemoveQA && (
                      <button
                        type="button"
                        onClick={() => onRemoveQA(actualIndex)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="Remove Q&A exchange"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Speaker's Answer */}
                <div className="p-4 sm:p-5 bg-white">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#0F2540] text-[#C98A2C] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold">A</span>
                    </div>

                    <div className="flex-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0F2540] mb-1">
                        Speaker Answer
                      </div>

                      {isEditable && onUpdateQA ? (
                        <textarea
                          rows={3}
                          value={item.answer}
                          onChange={(e) =>
                            onUpdateQA(actualIndex, {
                              ...item,
                              answer: e.target.value,
                            })
                          }
                          placeholder="Speaker answer text..."
                          className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#0F6E56]"
                        />
                      ) : (
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {item.answer}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Q&A exchange button in editable mode */}
      {isEditable && onAddQA && (
        <div className="pt-2">
          <button
            id="btn-add-qa-pair"
            type="button"
            onClick={onAddQA}
            className="w-full py-3 border-2 border-dashed border-[#0F6E56]/40 hover:border-[#0F6E56] rounded-xl text-sm font-semibold text-[#0F6E56] hover:bg-[#EEF8F5]/60 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Audience Q&A Exchange</span>
          </button>
        </div>
      )}
    </section>
  );
};
