import React, { useState } from 'react';
import { 
  Bot, 
  Search, 
  Lock, 
  ShieldCheck, 
  GraduationCap, 
  Bell, 
  PlusCircle, 
  Check,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { NotificationItem } from '../types';

interface HeaderProps {
  activeTab: 'chat' | 'catalog' | 'admin';
  setActiveTab: (tab: 'chat' | 'catalog' | 'admin') => void;
  isAdminAuthenticated: boolean;
  onAdminAuthClick: () => void;
  onAdminLogout: () => void;
  onOpenProjectDocs: () => void;
  notifications: NotificationItem[];
  onOpenReportModal: (type?: 'lost' | 'found') => void;
  onMarkNotificationsRead: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAdminAuthenticated,
  onAdminAuthClick,
  onAdminLogout,
  onOpenProjectDocs,
  notifications,
  onOpenReportModal,
  onMarkNotificationsRead,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('chat')} 
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white">FindIt</span>
                  <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Campus AI</span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">Smart Lost & Found Assistant</p>
              </div>
            </button>
          </div>

          {/* Primary Clean Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'chat'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Chatbot</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'catalog'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Catalog & Search</span>
            </button>

            {/* If Admin is logged in, show Admin Dashboard in active tabs */}
            {isAdminAuthenticated && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === 'admin'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-cyan-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </button>
            )}
          </nav>

          {/* Quick Actions & Admin Lock Portal */}
          <div className="flex items-center gap-2">
            
            {/* Quick Report Button */}
            <button
              onClick={() => onOpenReportModal()}
              className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2 px-3.5 rounded-lg transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Item</span>
            </button>

            {/* Admin Lock / Access Control */}
            {isAdminAuthenticated ? (
              <div className="flex items-center gap-1 bg-cyan-950/60 border border-cyan-800/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('admin')}
                  className="text-[11px] text-cyan-300 hover:text-white px-2 py-1 flex items-center gap-1 font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden md:inline">Admin Active</span>
                </button>
                <button
                  onClick={onAdminLogout}
                  className="text-slate-400 hover:text-rose-400 p-1"
                  title="Log out of Admin"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onAdminAuthClick}
                className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                title="Admin Login Barrier"
              >
                <Lock className="w-3 h-3 text-cyan-400" />
                <span className="hidden md:inline">Admin Portal</span>
              </button>
            )}

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  if (!showNotifMenu && unreadCount > 0) {
                    onMarkNotificationsRead();
                  }
                }}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      Match Notifications ({notifications.length})
                    </span>
                    <button
                      onClick={() => {
                        onMarkNotificationsRead();
                        setShowNotifMenu(false);
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Dismiss all
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No active match notifications.</p>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-lg text-xs border ${
                            n.is_read
                              ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                              : 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-emerald-400">
                              {Math.round(n.score * 100)}% Match Identified
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="line-clamp-2">{n.message}</p>
                          <button
                            onClick={() => {
                              setShowNotifMenu(false);
                              setActiveTab('catalog');
                            }}
                            className="mt-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <span>Inspect candidate in catalog</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </header>
  );
};
