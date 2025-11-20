import React, { useState } from 'react';
import { ApiKeyManager } from './ApiKeyManager';
import { Bot, LayoutDashboard, Key, BarChart3, Settings, CreditCard, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DeveloperDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'settings'>('overview');

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-slate-800">
                    <Link to="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
                        <div className="flex items-center gap-3 px-2 mb-8">
                            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-900/20">
                                <Bot size={20} strokeWidth={2.5} />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-white">CharacterForge</span>
                        </div>
                    </Link>
                    <div className="mt-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Developer Console</div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'overview'
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20'
                            : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <LayoutDashboard size={18} />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('keys')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'keys'
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20'
                            : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Key size={18} />
                        API Keys
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings'
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20'
                            : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <Settings size={18} />
                        Settings
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Link to="/app" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                        <ExternalLink size={18} />
                        Back to App
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-5xl mx-auto">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <BarChart3 size={20} />
                                        </div>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12.5%</span>
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900 mb-1">1,248</div>
                                    <div className="text-sm text-slate-500">Total Generations</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                            <CreditCard size={20} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-full">Current</span>
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900 mb-1">$98.40</div>
                                    <div className="text-sm text-slate-500">Estimated Cost</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                            <Key size={20} />
                                        </div>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900 mb-1">3</div>
                                    <div className="text-sm text-slate-500">Active API Keys</div>
                                </div>
                            </div>

                            {/* Usage Graph (Mock) */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-6">Usage History</h3>
                                <div className="h-64 flex items-end gap-4">
                                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                                        <div key={i} className="flex-1 bg-brand-100 rounded-t-lg relative group hover:bg-brand-200 transition-colors" style={{ height: `${h}% ` }}>
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {h * 10} reqs
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-4 text-xs text-slate-400 font-medium uppercase tracking-wider">
                                    <span>Jan</span>
                                    <span>Feb</span>
                                    <span>Mar</span>
                                    <span>Apr</span>
                                    <span>May</span>
                                    <span>Jun</span>
                                    <span>Jul</span>
                                    <span>Aug</span>
                                    <span>Sep</span>
                                    <span>Oct</span>
                                    <span>Nov</span>
                                    <span>Dec</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'keys' && (
                        <div className="space-y-8">
                            <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <ApiKeyManager />
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-8">
                            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-slate-500">Developer settings coming soon...</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
