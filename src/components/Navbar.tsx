import React, { useState } from 'react';
import { useApp, UserRole } from '../context/AppContext';
import { 
  FileText, 
  MessageSquare, 
  CreditCard, 
  BarChart3, 
  Shield, 
  ChevronDown, 
  Sparkles,
  Layers,
  Check
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    workspaces, 
    activeWorkspace, 
    setActiveWorkspace, 
    userRole, 
    setUserRole, 
    activeTab, 
    setActiveTab 
  } = useApp();

  const [isWsOpen, setIsWsOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  const roles: { role: UserRole; label: string; desc: string; color: string }[] = [
    { role: 'owner', label: 'Owner', desc: 'Full administrative controls & billing access', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { role: 'editor', label: 'Editor', desc: 'Upload documents & run full AI chat queries', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    { role: 'viewer', label: 'Viewer', desc: 'Read-only access (Upload/Delete controls disabled)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Left: Brand + Workspace Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">NovaRAG</span>
              <span className="ml-1.5 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-400 border border-brand-500/20">
                Hybrid RAG v2
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Workspace Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsWsOpen(!isWsOpen)}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-800 hover:border-slate-700 transition"
            >
              <Layers className="h-3.5 w-3.5 text-brand-400" />
              <span>{activeWorkspace?.name || 'Select workspace'}</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] uppercase font-bold text-slate-400">
                {activeWorkspace?.tier || 'free'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
            </button>

            {isWsOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase text-slate-400">Switch Workspace</div>
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setIsWsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-left transition ${
                      ws.id === activeWorkspace?.id ? 'bg-brand-600/20 text-brand-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div>{ws.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">slug: {ws.slug}</div>
                    </div>
                    {ws.id === activeWorkspace?.id && <Check className="h-3.5 w-3.5 text-brand-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800/80">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              activeTab === 'chat' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Hybrid Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              activeTab === 'documents' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Documents</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              activeTab === 'billing' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Billing</span>
          </button>

          <button
            onClick={() => setActiveTab('eval')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              activeTab === 'eval' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>RAG Eval</span>
          </button>
        </nav>

        {/* Right: RBAC Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleOpen(!isRoleOpen)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-800 hover:border-slate-700"
          >
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            <span className="capitalize">{userRole} Role</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {isRoleOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 p-2.5 shadow-2xl z-50">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase text-slate-400">Test RBAC Middleware Permissions</div>
              <div className="mt-1 space-y-1">
                {roles.map(r => (
                  <button
                    key={r.role}
                    onClick={() => {
                      setUserRole(r.role);
                      setIsRoleOpen(false);
                    }}
                    className={`flex w-full items-start justify-between rounded-lg p-2 text-left transition border ${r.color} ${
                      userRole === r.role ? 'ring-1 ring-purple-400' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs capitalize">{r.label}</div>
                      <div className="text-[10px] text-slate-300 font-normal leading-snug">{r.desc}</div>
                    </div>
                    {userRole === r.role && <Check className="h-4 w-4 text-purple-300 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
