/**
 * FindIt – Smart Lost and Found Chatbot
 * MCA Project Implementation
 * Core Engine: TF-IDF & Cosine Similarity NLP Matching with Anti-Fraud Security
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Chatbot } from './components/Chatbot';
import { Catalog } from './components/Catalog';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ProjectDocsModal } from './components/ProjectDocsModal';
import { ReportModal } from './components/ReportModal';
import { ClaimModal } from './components/ClaimModal';
import { MatchInspectorModal } from './components/MatchInspectorModal';
import { StorageService } from './services/storage';
import { NLPEngine } from './services/nlpEngine';
import { Item, NotificationItem, Claim, Statistics, MatchResult, ItemType } from './types';
import { GraduationCap, ShieldCheck, Lock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'catalog' | 'admin'>('chat');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('findit_admin_auth') === 'true';
  });
  
  // Data state
  const [items, setItems] = useState<Item[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<Statistics>({
    total_items: 0,
    total_lost: 0,
    total_found: 0,
    resolved_items: 0,
    total_claims: 0,
    resolution_rate: 0,
  });

  // Modal states
  const [adminAuthModalOpen, setAdminAuthModalOpen] = useState(false);
  const [projectDocsModalOpen, setProjectDocsModalOpen] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportDefaultType, setReportDefaultType] = useState<ItemType>('lost');

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimTargetItem, setClaimTargetItem] = useState<Item | null>(null);

  const [matchInspectorOpen, setMatchInspectorOpen] = useState(false);
  const [inspectedSourceItem, setInspectedSourceItem] = useState<Item | null>(null);
  const [inspectedMatches, setInspectedMatches] = useState<MatchResult[]>([]);

  // Toast / Banner notification for match
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);

  const refreshData = () => {
    const loadedItems = StorageService.getItems();
    const loadedNotifs = StorageService.getNotifications();
    const loadedClaims = StorageService.getClaims();
    const loadedStats = StorageService.getStats();

    setItems(loadedItems);
    setNotifications(loadedNotifs);
    setClaims(loadedClaims);
    setStats(loadedStats);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAdminAuthClick = () => {
    if (isAdminAuthenticated) {
      setActiveTab('admin');
    } else {
      setAdminAuthModalOpen(true);
    }
  };

  const handleAdminAuthenticated = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('findit_admin_auth', 'true');
    setAdminAuthModalOpen(false);
    setActiveTab('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('findit_admin_auth');
    if (activeTab === 'admin') {
      setActiveTab('chat');
    }
  };

  const handleOpenReportModal = (type: ItemType = 'lost') => {
    setReportDefaultType(type);
    setReportModalOpen(true);
  };

  const handleReportSubmit = (
    itemData: Omit<Item, 'id' | 'created_at' | 'status' | 'contact_info_masked'>
  ) => {
    const newItem = StorageService.addItem(itemData);
    
    // Run NLP matching against opposite pool
    const allItems = StorageService.getItems();
    const oppositePool = allItems.filter(i => i.item_type !== newItem.item_type && i.status === 'open');
    const matches = NLPEngine.findMatches(newItem, oppositePool, 0.38);

    if (matches.length > 0) {
      const topMatch = matches[0];
      StorageService.addNotification(
        newItem.id,
        topMatch.candidate.id,
        topMatch.similarity_score,
        `Match Alert (${topMatch.similarity_percentage}%): '${newItem.item_name}' matches '${topMatch.candidate.item_name}'`
      );

      setBannerAlert(`🎉 Potential match identified! '${newItem.item_name}' matches '${topMatch.candidate.item_name}' with ${topMatch.similarity_percentage}% similarity.`);
      setTimeout(() => setBannerAlert(null), 6000);

      // Open inspector modal directly to showcase match details
      setInspectedSourceItem(newItem);
      setInspectedMatches(matches);
      setMatchInspectorOpen(true);
    }

    refreshData();
  };

  const handleOpenClaimModal = (item: Item) => {
    setClaimTargetItem(item);
    setClaimModalOpen(true);
  };

  const handleClaimSubmit = (itemId: number, itemName: string, proof: string, contact: string) => {
    StorageService.addClaim(itemId, itemName, proof, contact);
    refreshData();
  };

  const handleInspectItemMatches = (item: Item, matches: MatchResult[]) => {
    setInspectedSourceItem(item);
    setInspectedMatches(matches);
    setMatchInspectorOpen(true);
  };

  const handleMarkNotificationsRead = () => {
    StorageService.markAllNotificationsRead();
    refreshData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminAuthClick={handleAdminAuthClick}
        onAdminLogout={handleAdminLogout}
        onOpenProjectDocs={() => setProjectDocsModalOpen(true)}
        notifications={notifications}
        onOpenReportModal={handleOpenReportModal}
        onMarkNotificationsRead={handleMarkNotificationsRead}
      />

      {/* Global Alert Toast */}
      {bannerAlert && (
        <div className="bg-emerald-900 border-b border-emerald-700/80 text-emerald-200 px-4 py-2.5 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="font-semibold">{bannerAlert}</span>
            <button
              onClick={() => setBannerAlert(null)}
              className="text-emerald-300 hover:text-white ml-4 font-bold text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 py-4 sm:py-6">
        {activeTab === 'chat' && (
          <Chatbot
            onOpenReportModal={handleOpenReportModal}
            onOpenClaimModal={handleOpenClaimModal}
            onSelectTab={(tab) => {
              if (tab === 'admin') {
                handleAdminAuthClick();
              } else {
                setActiveTab(tab);
              }
            }}
            onNewItemAdded={refreshData}
          />
        )}

        {activeTab === 'catalog' && (
          <Catalog
            items={items}
            onOpenReportModal={handleOpenReportModal}
            onOpenClaimModal={handleOpenClaimModal}
            onInspectItemMatches={handleInspectItemMatches}
          />
        )}

        {activeTab === 'admin' && (
          isAdminAuthenticated ? (
            <AdminDashboard
              items={items}
              claims={claims}
              stats={stats}
              onRefresh={refreshData}
              onInspectItemMatches={handleInspectItemMatches}
            />
          ) : (
            <div className="max-w-md mx-auto p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3 my-12">
              <Lock className="w-10 h-10 text-cyan-400 mx-auto" />
              <h2 className="text-base font-bold text-white">Administrator Access Required</h2>
              <p className="text-xs text-slate-400">
                You must sign in with your administrator security passcode to view this panel.
              </p>
              <button
                onClick={() => setAdminAuthModalOpen(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors mt-2"
              >
                Enter Admin Passcode
              </button>
            </div>
          )
        )}
      </main>

      {/* Modals */}
      <AdminAuthModal
        isOpen={adminAuthModalOpen}
        onClose={() => setAdminAuthModalOpen(false)}
        onAuthenticated={handleAdminAuthenticated}
      />

      <ProjectDocsModal
        isOpen={projectDocsModalOpen}
        onClose={() => setProjectDocsModalOpen(false)}
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        defaultType={reportDefaultType}
        onSubmit={handleReportSubmit}
      />

      <ClaimModal
        isOpen={claimModalOpen}
        onClose={() => {
          setClaimModalOpen(false);
          setClaimTargetItem(null);
        }}
        item={claimTargetItem}
        onSubmitClaim={handleClaimSubmit}
      />

      <MatchInspectorModal
        isOpen={matchInspectorOpen}
        onClose={() => {
          setMatchInspectorOpen(false);
          setInspectedSourceItem(null);
          setInspectedMatches([]);
        }}
        sourceItem={inspectedSourceItem}
        matches={inspectedMatches}
        onOpenClaimModal={handleOpenClaimModal}
      />

      {/* Clean Academic Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">FindIt</span>
            <span>· Campus Smart Lost & Found AI Assistant</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Discreet Project Documentation & Source Link for Evaluators */}
            <button 
              onClick={() => setProjectDocsModalOpen(true)} 
              className="text-cyan-400 hover:text-cyan-300 underline font-medium flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>MCA Project Docs & Python Code (.zip)</span>
            </button>
            
            <span aria-hidden="true" className="text-slate-700">·</span>

            {/* Admin Lock Link in Footer */}
            {!isAdminAuthenticated ? (
              <button
                onClick={handleAdminAuthClick}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <Lock className="w-3 h-3 text-cyan-400" />
                <span>Admin Login</span>
              </button>
            ) : (
              <button
                onClick={handleAdminLogout}
                className="text-rose-400 hover:text-rose-300"
              >
                Sign Out Admin
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}
