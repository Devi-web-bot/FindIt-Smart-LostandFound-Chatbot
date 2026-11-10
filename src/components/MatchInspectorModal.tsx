import React from 'react';
import { X, Sparkles, ArrowRight, Tag, Palette, MapPin, Calendar, CheckCircle2, Building2 } from 'lucide-react';
import { Item, MatchResult } from '../types';

interface MatchInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceItem: Item | null;
  matches: MatchResult[];
  onOpenClaimModal: (item: Item) => void;
}

export const MatchInspectorModal: React.FC<MatchInspectorModalProps> = ({
  isOpen,
  onClose,
  sourceItem,
  matches,
  onOpenClaimModal,
}) => {
  if (!isOpen || !sourceItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              NLP Match Results for &ldquo;{sourceItem.item_name}&rdquo;
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Source Item Card */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Source {sourceItem.item_type} Report #{sourceItem.id}
              </span>
              <span className="text-[10px] text-slate-400">{sourceItem.date_event}</span>
            </div>
            <h3 className="text-sm font-bold text-white">{sourceItem.item_name}</h3>
            <p className="text-slate-300">{sourceItem.description}</p>
            <div className="flex items-center gap-4 text-slate-400 pt-1 text-[11px]">
              <span>Category: <strong className="text-slate-200">{sourceItem.category}</strong></span>
              <span>Color: <strong className="text-slate-200">{sourceItem.colour}</strong></span>
              <span>Location: <strong className="text-slate-200">{sourceItem.location}</strong></span>
            </div>
          </div>

          {/* Matched Candidates List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Ranked Match Candidates ({matches.length})
              </span>
              <span className="text-[11px] text-slate-400">Threshold: ≥35%</span>
            </div>

            {matches.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No potential candidate matches found in the opposite pool exceeding the 35% similarity threshold.
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match.candidate.id}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl space-y-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{match.candidate.item_name}</h4>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          #{match.candidate.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{match.candidate.description}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-black text-emerald-400 font-mono">
                        {match.similarity_percentage}%
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Similarity</span>
                    </div>
                  </div>

                  {/* Factor Breakdown */}
                  <div className="p-2.5 bg-slate-900 rounded-lg grid grid-cols-3 gap-2 text-center text-[11px] border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block">Text Cosine</span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {(match.breakdown.text_cosine_similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Category Match</span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {match.breakdown.category_score === 1.0 ? '100%' : 'Partial'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Color Match</span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {match.breakdown.color_score >= 0.85 ? 'Matched' : 'Neutral'}
                      </span>
                    </div>
                  </div>

                  {/* Shared Tokens */}
                  {match.breakdown.shared_terms.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="text-slate-400 text-[11px]">Matched Keywords:</span>
                      {match.breakdown.shared_terms.map(st => (
                        <span
                          key={st.term}
                          className="px-1.5 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 rounded text-[10px] font-mono"
                        >
                          {st.term}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Physical custody point */}
                  {match.candidate.custody_location && (
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px] flex items-center gap-1.5 text-cyan-300">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span><strong>Safeguarded At:</strong> {match.candidate.custody_location}</span>
                    </div>
                  )}

                  {/* Footer & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <span>Location: <strong className="text-slate-300">{match.candidate.location}</strong></span>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenClaimModal(match.candidate);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span>Claim / Contact</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
