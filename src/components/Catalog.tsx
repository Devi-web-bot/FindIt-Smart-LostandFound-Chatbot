import React, { useState, useMemo } from 'react';
import { 
  Search, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Tag, 
  Palette, 
  Shield, 
  Sparkles, 
  Lock,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Eye,
  Info,
  Building2
} from 'lucide-react';
import { Item, ItemType, MatchResult } from '../types';
import { NLPEngine } from '../services/nlpEngine';

interface CatalogProps {
  items: Item[];
  onOpenReportModal: (type?: ItemType) => void;
  onOpenClaimModal: (item: Item) => void;
  onInspectItemMatches: (item: Item, matches: MatchResult[]) => void;
}

const CATEGORIES = [
  'All Categories',
  'Electronics & Gadgets',
  'Wallets, Bags & Purses',
  'Cards, IDs & Documents',
  'Keys & Vehicle Fobs',
  'Personal Accessories & Clothing',
  'Other'
];

export const Catalog: React.FC<CatalogProps> = ({
  items,
  onOpenReportModal,
  onOpenClaimModal,
  onInspectItemMatches,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAntiFraudNotice, setShowAntiFraudNotice] = useState(true);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedType !== 'all' && item.item_type !== selectedType) {
        return false;
      }
      if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const combined = `${item.item_name} ${item.description} ${item.location} ${item.colour} ${item.category}`.toLowerCase();
        if (!combined.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [items, searchQuery, selectedType, selectedCategory, selectedStatus]);

  const handleRunMatcher = (item: Item) => {
    const oppositePool = items.filter(i => i.item_type !== item.item_type);
    const matches = NLPEngine.findMatches(item, oppositePool, 0.35);
    onInspectItemMatches(item, matches);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Lost & Found Item Registry</h1>
            <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded">
              Anti-Fraud Redaction Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search reports or test TF-IDF & Cosine Similarity matches. Distinguishing secrets are sealed to stop impersonators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenReportModal('lost')}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Lost</span>
          </button>
          <button
            onClick={() => onOpenReportModal('found')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Found</span>
          </button>
        </div>
      </div>

      {/* Anti-Fraud Security Notice Banner */}
      {showAntiFraudNotice && (
        <div className="bg-slate-900/90 border border-cyan-800/40 p-4 rounded-xl flex items-start justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-300 block">
                🛡️ Fraud Prevention Mechanism in Place
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                To prevent random individuals from reading item specs and claiming items that do not belong to them, 
                <strong className="text-white"> distinguishing identification marks (stickers, wallpapers, serial fragments, internal cash/card contents) are redacted in public view</strong>. 
                When a claimant attempts to claim an item, they must pass a blind verification test describing these hidden details.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAntiFraudNotice(false)}
            className="text-slate-400 hover:text-white p-1 text-xs"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Keyword Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword (e.g. laptop, blue, library, wallet, keys)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by Category"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">Status: All</option>
              <option value="open">Status: Open</option>
              <option value="matched">Status: Matched</option>
              <option value="claimed">Status: Claimed</option>
              <option value="resolved">Status: Resolved</option>
            </select>
          </div>

        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedType('all')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                selectedType === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setSelectedType('lost')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                selectedType === 'lost'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Lost Items ({items.filter(i => i.item_type === 'lost').length})
            </button>
            <button
              onClick={() => setSelectedType('found')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                selectedType === 'found'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Found Items ({items.filter(i => i.item_type === 'found').length})
            </button>
          </div>

          <span className="text-xs text-slate-400">
            Showing {filteredItems.length} of {items.length} records
          </span>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No items match your filter criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Try adjusting your search terms, changing the category, or report a new lost or found item.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All Categories');
              setSelectedType('all');
              setSelectedStatus('all');
            }}
            className="mt-4 text-xs text-emerald-400 hover:text-emerald-300 underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isFound = item.item_type === 'found';
            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all shadow-sm"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isFound ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {item.item_type} #{item.id}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mt-1 line-clamp-1">{item.item_name}</h3>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize ${
                      item.status === 'resolved'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                        : item.status === 'claimed'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                        : item.status === 'matched'
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Public Description */}
                  <p className="text-xs text-slate-300 line-clamp-2 mb-2.5">
                    {item.description}
                  </p>

                  {/* Anti-Fraud Sealed Proof Box */}
                  {isFound ? (
                    <div className="mb-3 p-2 bg-slate-950 border border-cyan-900/40 rounded-lg text-[11px] flex items-center gap-2 text-cyan-300">
                      <Lock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span className="leading-tight">
                        <strong>Distinctive Proof Hidden:</strong> Sealed to stop false claimants. You must verify ownership to claim.
                      </span>
                    </div>
                  ) : (
                    <div className="mb-3 p-2 bg-slate-950 border border-slate-800 rounded-lg text-[11px] flex items-center gap-2 text-slate-400">
                      <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Lost report registered with protected verification details.</span>
                    </div>
                  )}

                  {/* Attributes */}
                  <div className="space-y-1.5 text-xs text-slate-400 mb-4 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Tag className="w-3.5 h-3.5" /> Category:
                      </span>
                      <span className="text-slate-300">{item.category}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Palette className="w-3.5 h-3.5" /> Color:
                      </span>
                      <span className="text-slate-300">{item.colour || 'Not specified'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" /> Found Near:
                      </span>
                      <span className="text-slate-300 truncate max-w-[160px] text-right">{item.location}</span>
                    </div>

                    {item.custody_location && (
                      <div className="flex items-center justify-between bg-cyan-950/40 p-1.5 rounded border border-cyan-800/40 text-[11px] text-cyan-300">
                        <span className="flex items-center gap-1 font-semibold text-cyan-400">
                          <Building2 className="w-3 h-3" /> Pickup Desk:
                        </span>
                        <span className="truncate max-w-[170px] font-medium text-right">{item.custody_location}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" /> Date:
                      </span>
                      <span className="text-slate-300">{item.date_event}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Shield className="w-3 h-3 text-cyan-400" /> Owner Contact:
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {item.contact_info_masked || 'Protected'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleRunMatcher(item)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Run Matcher</span>
                  </button>

                  <button
                    onClick={() => onOpenClaimModal(item)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <span>{isFound ? 'Verify & Claim' : 'Claim Match'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
