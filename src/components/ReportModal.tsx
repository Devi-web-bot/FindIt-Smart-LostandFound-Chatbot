import React, { useState } from 'react';
import { X, PlusCircle, ShieldCheck, Tag, Palette, MapPin, Calendar, AlertCircle, Lock } from 'lucide-react';
import { Item, ItemType } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ItemType;
  onSubmit: (itemData: Omit<Item, 'id' | 'created_at' | 'status' | 'contact_info_masked'>) => void;
}

const CATEGORIES = [
  'Electronics & Gadgets',
  'Wallets, Bags & Purses',
  'Cards, IDs & Documents',
  'Keys & Vehicle Fobs',
  'Personal Accessories & Clothing',
  'Other'
];

const COLORS = [
  'Blue',
  'Black',
  'Red',
  'Brown',
  'Silver / Grey',
  'White',
  'Green',
  'Yellow',
  'Gold',
  'Other'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'lost',
  onSubmit,
}) => {
  const [itemType, setItemType] = useState<ItemType>(defaultType);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [customCategory, setCustomCategory] = useState('');
  const [colour, setColour] = useState('Blue');
  const [customColour, setCustomColour] = useState('');
  const [description, setDescription] = useState('');
  const [secretDetail, setSecretDetail] = useState('');
  const [location, setLocation] = useState('');
  const [custodyLocation, setCustodyLocation] = useState('');
  const [dateEvent, setDateEvent] = useState(new Date().toISOString().split('T')[0]);
  const [contactInfo, setContactInfo] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('Please provide the item name.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a general description.');
      return;
    }
    if (!secretDetail.trim()) {
      setError('Please specify at least one secret verification detail (sticker, password, scratch, wallet content) to protect against false claims.');
      return;
    }
    if (!location.trim()) {
      setError('Please specify the location.');
      return;
    }
    if (!contactInfo.trim()) {
      setError('Please enter your contact information (email or phone).');
      return;
    }

    const finalCategory = category === 'Other' && customCategory.trim() ? customCategory.trim() : category;
    const finalColour = colour === 'Other' && customColour.trim() ? customColour.trim() : colour;

    onSubmit({
      item_name: itemName.trim(),
      category: finalCategory,
      colour: finalColour,
      description: description.trim(),
      secret_verification_detail: secretDetail.trim(),
      date_event: dateEvent,
      location: location.trim(),
      custody_location: itemType === 'found' ? (custodyLocation.trim() || 'Deposited at Security Booth Gate 1') : undefined,
      item_type: itemType,
      contact_info: contactInfo.trim(),
      reported_by: reportedBy.trim() || 'Anonymous User',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">
              Report an Item to Registry
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="text-slate-400 block mb-1.5 font-medium">Report Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setItemType('lost')}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  itemType === 'lost'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                I Lost Something
              </button>
              <button
                type="button"
                onClick={() => setItemType('found')}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  itemType === 'found'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                I Found Something
              </button>
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="text-slate-300 block mb-1 font-medium">Item Name & Brand *</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Navy Blue Dell Inspiron 15, Brown Tommy Hilfiger Wallet"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category & Color with "Other" options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {category === 'Other' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Type custom category..."
                  className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500"
                />
              )}
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Primary Color</label>
              <select
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {COLORS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {colour === 'Other' && (
                <input
                  type="text"
                  value={customColour}
                  onChange={(e) => setCustomColour(e.target.value)}
                  placeholder="Type custom color..."
                  className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500"
                />
              )}
            </div>
          </div>

          {/* General Description */}
          <div>
            <label className="text-slate-300 block mb-1 font-medium">
              Public Description (Visible in Catalog) *
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="General description without giving away secret proof: e.g. 15in laptop found plugged into study desk..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Secret Verification Detail (Anti-Fraud) */}
          <div className="p-3 bg-slate-950/80 border border-cyan-800/50 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Anti-Fraud Secret Verification Detail *</span>
            </div>
            <p className="text-[11px] text-slate-400">
              ⚠️ <strong>This detail is strictly sealed and hidden from public search</strong>. Anyone claiming the item must describe this to prove ownership.
            </p>
            <textarea
              rows={2}
              value={secretDetail}
              onChange={(e) => setSecretDetail(e.target.value)}
              placeholder="e.g. GitHub Octocat sticker holding a coffee mug on top lid, lockscreen wallpaper of a dog, student ID number 2024-MCA-08..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Location & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Found Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Central Library Floor 2"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Date *</label>
              <input
                type="date"
                value={dateEvent}
                onChange={(e) => setDateEvent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Custody / Drop-off location for found items */}
          {itemType === 'found' && (
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl space-y-1.5">
              <label className="text-cyan-300 block font-semibold">
                📍 Physical Custody / Pickup Desk Location
              </label>
              <p className="text-[11px] text-slate-400">
                Where did you deposit the item for safekeeping so the owner can collect it?
              </p>
              <input
                type="text"
                value={custodyLocation}
                onChange={(e) => setCustodyLocation(e.target.value)}
                placeholder="e.g. Central Library Circulation Desk, Campus Security Booth Gate 1..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* Contact Information & Privacy */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Contact Privacy Protection</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Contact information is masked (e.g. al***@domain.com) and only shared once an admin approves verified ownership.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-slate-400 block mb-1">Your Name</label>
                <input
                  type="text"
                  value={reportedBy}
                  onChange={(e) => setReportedBy(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Contact Email / Phone *</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="alex@university.edu"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              Submit & Run NLP Matcher
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
