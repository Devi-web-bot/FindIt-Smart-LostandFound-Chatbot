import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, CheckCircle2, Lock, ShieldAlert } from 'lucide-react';
import { Item } from '../types';

interface ClaimModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitClaim: (itemId: number, itemName: string, proof: string, contact: string) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  item,
  isOpen,
  onClose,
  onSubmitClaim,
}) => {
  const [proof, setProof] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proof.trim() || proof.trim().length < 10) {
      setError('Please provide specific proof of ownership (at least 10 characters) such as unique stickers, password, internal contents, or serial number.');
      return;
    }
    if (!contact.trim()) {
      setError('Please provide your contact email or phone number.');
      return;
    }

    onSubmitClaim(item.id, item.item_name, proof.trim(), contact.trim());
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setProof('');
      setContact('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">
              Anti-Fraud Ownership Verification
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Proof Submitted for Review</h3>
            <p className="text-xs text-slate-300">
              Your proof of ownership has been cross-referenced with the finder's sealed secret and queued for Admin verification.
            </p>
            <p className="text-[11px] text-slate-500">
              Finder contact info will be released once the admin verifies matching proof.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {error && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Item Summary */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Claiming Item #{item.id}</span>
              <h3 className="text-xs font-bold text-white">{item.item_name}</h3>
              <p className="text-[11px] text-slate-400">
                {item.category} · Found at {item.location} on {item.date_event}
              </p>
            </div>

            {/* Anti-Fraud Notice */}
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-[11px] text-cyan-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Why is verification required?</span>
              </div>
              <p className="text-slate-300">
                To prevent unauthorized users from claiming found belongings, distinguishing details were redacted in the catalog. You must describe features that only the authentic owner knows.
              </p>
            </div>

            {/* Ownership Proof Field */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">
                Describe Secret Identifying Features *
              </label>
              <textarea
                rows={4}
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="Describe details not shown publicly: exact stickers, wallpaper photo, screen password, serial number, cards inside wallet, or keychain figurine..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Contact Details */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">
                Your Contact Email or Phone *
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. yourname@university.edu or +1-555-0192"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                Submit Ownership Proof
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
