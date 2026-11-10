import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RotateCcw, 
  Download, 
  Trash2, 
  Sparkles,
  ExternalLink,
  Lock,
  Mail,
  User,
  Layers,
  Check
} from 'lucide-react';
import { Item, Claim, Statistics, ItemStatus, MatchResult } from '../types';
import { StorageService } from '../services/storage';
import { NLPEngine } from '../services/nlpEngine';

interface AdminDashboardProps {
  items: Item[];
  claims: Claim[];
  stats: Statistics;
  onRefresh: () => void;
  onInspectItemMatches: (item: Item, matches: MatchResult[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  items,
  claims,
  stats,
  onRefresh,
  onInspectItemMatches,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'claims' | 'items' | 'matches' | 'tools'>('claims');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleClaimStatus = (claimId: number, status: 'approved' | 'rejected') => {
    StorageService.updateClaimStatus(claimId, status);
    onRefresh();
    showFeedback(`Claim #${claimId} has been ${status === 'approved' ? 'approved and resolved' : 'rejected'}.`);
  };

  const handleItemStatusChange = (itemId: number, newStatus: ItemStatus) => {
    StorageService.updateItemStatus(itemId, newStatus);
    onRefresh();
    showFeedback(`Item #${itemId} status changed to ${newStatus}.`);
  };

  const handleDeleteItem = (itemId: number) => {
    if (window.confirm(`Are you sure you want to delete report #${itemId}?`)) {
      StorageService.deleteItem(itemId);
      onRefresh();
      showFeedback(`Item #${itemId} deleted from registry.`);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset database to original sample lost & found items and claims?')) {
      StorageService.resetToDefault();
      onRefresh();
      showFeedback('Database successfully reset to initial seed state.');
    }
  };

  const handleExportJSON = () => {
    const data = {
      items: StorageService.getItems(),
      claims: StorageService.getClaims(),
      notifications: StorageService.getNotifications(),
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FindIt_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Database exported as JSON backup.');
  };

  const handleExportCSV = () => {
    const currentItems = StorageService.getItems();
    const header = ['ID', 'Type', 'Item Name', 'Category', 'Color', 'Location', 'Custody Pickup Desk', 'Date', 'Status'];
    const rows = currentItems.map(i => [
      i.id,
      i.item_type,
      `"${i.item_name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.colour}"`,
      `"${i.location.replace(/"/g, '""')}"`,
      `"${(i.custody_location || 'N/A').replace(/"/g, '""')}"`,
      i.date_event,
      i.status
    ]);
    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FindIt_Campus_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Campus Resolution Audit CSV exported successfully.');
  };

  // Compute top cross matches between lost and found items
  const crossMatches = React.useMemo(() => {
    const lostList = items.filter(i => i.item_type === 'lost' && i.status === 'open');
    const foundList = items.filter(i => i.item_type === 'found' && i.status === 'open');
    const pairs: { lost: Item; found: Item; score: number; percentage: number; breakdown: any }[] = [];

    for (const l of lostList) {
      for (const f of foundList) {
        const breakdown = NLPEngine.calculateBreakdown(
          `${l.item_name} ${l.description} ${l.location}`,
          `${f.item_name} ${f.description} ${f.location}`,
          l.category, f.category, l.colour, f.colour
        );
        if (breakdown.final_score >= 0.40) {
          pairs.push({
            lost: l,
            found: f,
            score: breakdown.final_score,
            percentage: breakdown.percentage,
            breakdown,
          });
        }
      }
    }

    pairs.sort((a, b) => b.score - a.score);
    return pairs;
  }, [items]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Admin Title & Feedback */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Administrator Control Center</h1>
              <span className="text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded">
                Verified Admin Session
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review ownership proofs, audit match algorithms, resolve reunited items, and manage privacy.
            </p>
          </div>
        </div>

        {actionMessage && (
          <div className="text-xs bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* Key Stats Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block font-medium">Total Reports</span>
          <div className="text-xl font-bold text-white mt-1 font-mono">{stats.total_items}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-rose-400 block font-medium">Lost Items</span>
          <div className="text-xl font-bold text-rose-300 mt-1 font-mono">{stats.total_lost}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-emerald-400 block font-medium">Found Items</span>
          <div className="text-xl font-bold text-emerald-300 mt-1 font-mono">{stats.total_found}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-cyan-400 block font-medium">AI Match Pairs</span>
          <div className="text-xl font-bold text-cyan-300 mt-1 font-mono">{crossMatches.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-amber-400 block font-medium">Claims Pending</span>
          <div className="text-xl font-bold text-amber-300 mt-1 font-mono">
            {claims.filter(c => c.status === 'pending').length}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-emerald-400 block font-medium">Resolution Rate</span>
          <div className="text-xl font-bold text-emerald-300 mt-1 font-mono">{stats.resolution_rate}%</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex items-center gap-1">
        <button
          onClick={() => setActiveAdminTab('claims')}
          className={`flex-1 text-xs py-2 px-3 rounded-lg font-medium transition-colors ${
            activeAdminTab === 'claims'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Ownership Claims Queue ({claims.filter(c => c.status === 'pending').length} Pending)
        </button>
        <button
          onClick={() => setActiveAdminTab('matches')}
          className={`flex-1 text-xs py-2 px-3 rounded-lg font-medium transition-colors ${
            activeAdminTab === 'matches'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          NLP Match Matrix ({crossMatches.length} Pairs)
        </button>
        <button
          onClick={() => setActiveAdminTab('items')}
          className={`flex-1 text-xs py-2 px-3 rounded-lg font-medium transition-colors ${
            activeAdminTab === 'items'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Item Registry Management ({items.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('tools')}
          className={`flex-1 text-xs py-2 px-3 rounded-lg font-medium transition-colors ${
            activeAdminTab === 'tools'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          System & Data Tools
        </button>
      </div>

      {/* TAB 1: CLAIMS QUEUE */}
      {activeAdminTab === 'claims' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Submitted Ownership Verification Requests</h2>
            <span className="text-xs text-slate-400">
              Admin verification required before claimant receives finder contact details.
            </span>
          </div>

          {claims.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
              No ownership claims currently submitted.
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => {
                const targetItem = items.find(i => i.id === claim.item_id);
                return (
                  <div
                    key={claim.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            Claim #{claim.id} for: {claim.item_name}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                            claim.status === 'approved'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                              : claim.status === 'rejected'
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                              : 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Target Item ID #{claim.item_id} · Submitted {new Date(claim.created_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Admin Decision Buttons */}
                      {claim.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleClaimStatus(claim.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Resolve</span>
                          </button>
                          <button
                            onClick={() => handleClaimStatus(claim.id, 'rejected')}
                            className="bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Anti-Fraud Proof Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Claimant's answer */}
                      <div className="p-3 bg-slate-950/80 rounded-lg border border-amber-900/40 space-y-1">
                        <span className="text-amber-400 text-[11px] font-bold block flex items-center gap-1">
                          <span>Claimant's Submitted Proof:</span>
                        </span>
                        <p className="text-slate-200">{claim.proof_description}</p>
                      </div>

                      {/* Finder's sealed secret */}
                      <div className="p-3 bg-slate-950/80 rounded-lg border border-cyan-900/40 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-400 text-[11px] font-bold block flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Finder's Sealed Secret (Admin Only):
                          </span>
                          {claim.proof_similarity_score !== undefined && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                              {Math.round(claim.proof_similarity_score * 100)}% Proof Match
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 italic">{claim.finder_sealed_detail || targetItem?.secret_verification_detail || 'No secret logged'}</p>
                      </div>
                    </div>

                    {/* Privacy Unlocked for Admin Only */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Claimant Contact (Admin Privileged):</span>
                        <span className="font-mono text-cyan-300 font-semibold">{claim.claimant_contact}</span>
                      </div>

                      {targetItem && (
                        <div className="text-[11px] text-slate-400">
                          Original Item Status: <span className="font-mono text-slate-300">{targetItem.status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NLP MATCH MATRIX */}
      {activeAdminTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">High-Confidence Cross-Category Match Pairs</h2>
              <p className="text-xs text-slate-400">
                Algorithmically connected lost reports and found items via TF-IDF cosine similarity.
              </p>
            </div>
          </div>

          {crossMatches.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
              No cross-matches above 40% similarity threshold found between currently open items.
            </div>
          ) : (
            <div className="space-y-3">
              {crossMatches.map((pair, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {pair.percentage}% Match
                      </span>
                      <span className="text-[11px] text-slate-400">· TF-IDF Cosine: {(pair.breakdown.text_cosine_similarity * 100).toFixed(0)}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const matches = NLPEngine.findMatches(pair.lost, [pair.found], 0.3);
                          onInspectItemMatches(pair.lost, matches);
                        }}
                        className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Inspect Match Breakdown</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Lost side */}
                    <div className="bg-slate-950/70 p-3 rounded-lg border border-rose-950/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-rose-400 uppercase">Lost Item Report #{pair.lost.id}</span>
                        <span className="text-[10px] text-slate-400">{pair.lost.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{pair.lost.item_name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{pair.lost.description}</p>
                      <div className="text-[10px] text-slate-400 mt-2">
                        Location: {pair.lost.location} · Color: {pair.lost.colour}
                      </div>
                    </div>

                    {/* Found side */}
                    <div className="bg-slate-950/70 p-3 rounded-lg border border-emerald-950/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-emerald-400 uppercase">Found Item Report #{pair.found.id}</span>
                        <span className="text-[10px] text-slate-400">{pair.found.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{pair.found.item_name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{pair.found.description}</p>
                      <div className="text-[10px] text-slate-400 mt-2">
                        Location: {pair.found.location} · Color: {pair.found.colour}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ITEM REGISTRY MANAGEMENT */}
      {activeAdminTab === 'items' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">All Registered Items ({items.length})</h2>
            <span className="text-xs text-slate-400">Modify statuses or delete invalid submissions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase bg-slate-950/50">
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Item Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Location</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono text-slate-400">#{item.id}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] font-semibold uppercase ${
                        item.item_type === 'lost' ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {item.item_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-white max-w-[200px] truncate">
                      {item.item_name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">{item.category}</td>
                    <td className="py-2.5 px-4 text-slate-400 max-w-[150px] truncate">{item.location}</td>
                    <td className="py-2.5 px-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleItemStatusChange(item.id, e.target.value as ItemStatus)}
                        aria-label={`Status for ${item.item_name}`}
                        className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="open">Open</option>
                        <option value="matched">Matched</option>
                        <option value="claimed">Claimed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM & DATA TOOLS */}
      {activeAdminTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-white">Database Backup & Export</h3>
            <p className="text-xs text-slate-400">
              Download the current state of all lost items, found items, claims, and notification history in structured JSON format.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportCSV}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export Audit Report (CSV)</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export JSON Backup</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-white">Reset Seed Database</h3>
            <p className="text-xs text-slate-400">
              Restore default demo dataset including campus laptops, wallets, car keys, and sunglasses to cleanly demonstrate matching in an MCA project presentation.
            </p>
            <button
              onClick={handleResetData}
              className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold px-4 py-2 rounded-lg border border-rose-800/60 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Reset Database to Default Samples</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
