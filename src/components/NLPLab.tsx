import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  Calculator, 
  Layers, 
  BookOpen,
  Info
} from 'lucide-react';
import { NLPEngine } from '../services/nlpEngine';
import { MatchBreakdown } from '../types';

interface PresetExample {
  title: string;
  desc1: string;
  cat1: string;
  col1: string;
  desc2: string;
  cat2: string;
  col2: string;
}

const PRESETS: PresetExample[] = [
  {
    title: 'Blue Laptop Case (Synonyms & Attributes)',
    desc1: 'Dell Inspiron 15 inch navy blue metallic laptop with a GitHub sticker on lid left at library',
    cat1: 'Electronics',
    col1: 'Blue',
    desc2: 'Dark blue 15in laptop computer with code stickers found plugged into study desk',
    cat2: 'Electronics',
    col2: 'Blue',
  },
  {
    title: 'Wallet vs Billfold (Vocabulary Mismatch)',
    desc1: 'Brown leather Tommy Hilfiger bifold wallet containing college metro card and gym ID',
    cat1: 'Wallets & Bags',
    col1: 'Brown',
    desc2: 'Tan pocket billfold purse found on cafeteria dining chair with various plastic cards inside',
    cat2: 'Wallets & Bags',
    col2: 'Brown',
  },
  {
    title: 'Car Keys & Keychain (High Overlap)',
    desc1: 'Single electronic Toyota car key with red rubber casing and mini cartoon keychain',
    cat1: 'Keys',
    col1: 'Red',
    desc2: 'Vehicle smart remote keys found in parking bay with red cover and keychain character',
    cat2: 'Keys',
    col2: 'Red',
  },
  {
    title: 'Non-Match Negative Control',
    desc1: 'Purple titanium Apple Watch series 8 with magnetic green strap',
    cat1: 'Jewelry & Watches',
    col1: 'Purple',
    desc2: 'Stainless steel Hydro Flask water bottle 1 litre with dent on bottom',
    cat2: 'Other',
    col2: 'Silver / Grey',
  },
];

export const NLPLab: React.FC = () => {
  const [desc1, setDesc1] = useState(PRESETS[0].desc1);
  const [cat1, setCat1] = useState(PRESETS[0].cat1);
  const [col1, setCol1] = useState(PRESETS[0].col1);

  const [desc2, setDesc2] = useState(PRESETS[0].desc2);
  const [cat2, setCat2] = useState(PRESETS[0].cat2);
  const [col2, setCol2] = useState(PRESETS[0].col2);

  const [breakdown, setBreakdown] = useState<MatchBreakdown>(() =>
    NLPEngine.calculateBreakdown(PRESETS[0].desc1, PRESETS[0].desc2, PRESETS[0].cat1, PRESETS[0].cat2, PRESETS[0].col1, PRESETS[0].col2)
  );

  const handleCompute = () => {
    const res = NLPEngine.calculateBreakdown(desc1, desc2, cat1, cat2, col1, col2);
    setBreakdown(res);
  };

  const loadPreset = (p: PresetExample) => {
    setDesc1(p.desc1);
    setCat1(p.cat1);
    setCol1(p.col1);
    setDesc2(p.desc2);
    setCat2(p.cat2);
    setCol2(p.col2);
    const res = NLPEngine.calculateBreakdown(p.desc1, p.desc2, p.cat1, p.cat2, p.col1, p.col2);
    setBreakdown(res);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Cpu className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                NLP Matching Engine & Mathematical Inspector
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live laboratory demonstrating TF-IDF vectorization, Cosine Similarity, and synonym bridging used in FindIt.
            </p>
          </div>

          <button
            onClick={handleCompute}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 self-start md:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Recompute Vectors</span>
          </button>
        </div>

        {/* Preset Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] whitespace-nowrap">Load Preset Scenario:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(p)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 transition-colors whitespace-nowrap text-[11px]"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Comparison Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Document 1: Lost Item Description */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Document A: Lost Item Report
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Vector A</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Item Description Text</label>
            <textarea
              rows={3}
              value={desc1}
              onChange={(e) => setDesc1(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Category</label>
              <input
                type="text"
                value={cat1}
                onChange={(e) => setCat1(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Color</label>
              <input
                type="text"
                value={col1}
                onChange={(e) => setCol1(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
            <span className="text-slate-400 block mb-1">Tokenized Terms ({breakdown.tokens1.length}):</span>
            <div className="flex flex-wrap gap-1">
              {breakdown.tokens1.map((t, idx) => (
                <span key={idx} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Document 2: Found Item Description */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Document B: Found Item Report
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Vector B</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Item Description Text</label>
            <textarea
              rows={3}
              value={desc2}
              onChange={(e) => setDesc2(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Category</label>
              <input
                type="text"
                value={cat2}
                onChange={(e) => setCat2(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Color</label>
              <input
                type="text"
                value={col2}
                onChange={(e) => setCol2(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
            <span className="text-slate-400 block mb-1">Tokenized Terms ({breakdown.tokens2.length}):</span>
            <div className="flex flex-wrap gap-1">
              {breakdown.tokens2.map((t, idx) => (
                <span key={idx} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Similarity Calculation Results */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">Mathematical Similarity Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cosine of vector angle combined with semantic category and color boosting.
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {breakdown.percentage}%
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Composite Match Confidence</span>
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-500 ${
                breakdown.percentage >= 70 
                  ? 'bg-emerald-500' 
                  : breakdown.percentage >= 45 
                  ? 'bg-amber-500' 
                  : 'bg-rose-500'
              }`}
              style={{ width: `${breakdown.percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0% (Disjoint)</span>
            <span>35% Threshold</span>
            <span>70% High Match</span>
            <span>100% Identical</span>
          </div>
        </div>

        {/* 3-Factor Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
            <span className="text-[11px] text-slate-400 block font-medium">1. Text Cosine Similarity (65% Weight)</span>
            <div className="text-lg font-bold text-white font-mono">
              {(breakdown.text_cosine_similarity * 100).toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-400">
              Evaluates the geometric angle between TF-IDF sparse vectors.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
            <span className="text-[11px] text-slate-400 block font-medium">2. Category Compatibility (20% Weight)</span>
            <div className="text-lg font-bold text-white font-mono">
              {(breakdown.category_score * 100).toFixed(0)}%
            </div>
            <p className="text-[10px] text-slate-400">
              {breakdown.category_score === 1.0 ? 'Exact category match' : 'Different or partial category'}
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
            <span className="text-[11px] text-slate-400 block font-medium">3. Color Semantic Score (15% Weight)</span>
            <div className="text-lg font-bold text-white font-mono">
              {(breakdown.color_score * 100).toFixed(0)}%
            </div>
            <p className="text-[10px] text-slate-400">
              {breakdown.color_score >= 0.85 ? 'Color match / synonym equivalent' : 'Distinct colors'}
            </p>
          </div>

        </div>

        {/* Shared Term Weight Comparison Table */}
        <div className="pt-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Shared Terms & TF-IDF Weights (Vector Overlap)
          </h3>

          {breakdown.shared_terms.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              No overlapping terms or synonyms identified between Document A and Document B.
            </p>
          ) : (
            <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                    <th className="py-2.5 px-4 font-medium">Term / Syn</th>
                    <th className="py-2.5 px-4 font-medium">Doc A Weight</th>
                    <th className="py-2.5 px-4 font-medium">Doc B Weight</th>
                    <th className="py-2.5 px-4 font-medium">Vector Dot Product Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {breakdown.shared_terms.map((st) => (
                    <tr key={st.term} className="hover:bg-slate-900/50">
                      <td className="py-2 px-4 text-emerald-400 font-semibold">{st.term}</td>
                      <td className="py-2 px-4 text-slate-300">{st.weight1}</td>
                      <td className="py-2 px-4 text-slate-300">{st.weight2}</td>
                      <td className="py-2 px-4 text-cyan-400">
                        +{(st.weight1 * st.weight2).toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mathematical Formulas Panel */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mathematical Formulation for MCA Project Presentation</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400 pt-1 font-mono text-[11px]">
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-emerald-400 block font-bold mb-1">TF-IDF Equation:</span>
              <p>TF(t, d) = count(t, d) / total_words(d)</p>
              <p>IDF(t, D) = ln((1 + |D|) / (1 + df(t))) + 1</p>
              <p>W(t, d) = TF(t, d) × IDF(t, D)</p>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-cyan-400 block font-bold mb-1">Cosine Similarity Equation:</span>
              <p>cos(θ) = (A · B) / (||A|| × ||B||)</p>
              <p>cos(θ) = Σ(Ai × Bi) / (√(Σ Ai²) × √(Σ Bi²))</p>
              <p>Range: [0.0, 1.0] for non-negative word weights</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
