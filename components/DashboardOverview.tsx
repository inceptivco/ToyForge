import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, FileText, Key, AlertTriangle, X } from 'lucide-react';

interface DashboardOverviewProps {
    apiCredits: number | null;
    generationCount: number;
    apiKeyCount: number;
    apiKeys: any[];
    onCreateKey: () => void; // Placeholder for now as the original didn't have implementation in renderContent
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    apiCredits,
    generationCount,
    apiKeyCount,
    apiKeys,
    onCreateKey
}) => {
    return (
        <div className="max-w-5xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Overview</h1>
                    <p className="text-slate-500 mt-1">Manage your API keys and usage</p>
                </div>
            </div>

            {/* Low Credits Warning */}
            {apiCredits !== null && apiCredits <= 0 && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="text-sm font-bold text-red-900">API Credits Depleted</h3>
                        <p className="text-sm text-red-700 mt-1">
                            Your API keys are currently inactive because you have 0 credits.
                            Please <Link to="/developer/billing" className="underline font-medium hover:text-red-900">top up your balance</Link> to resume usage.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <LayoutDashboard size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">Balance</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-1">{apiCredits !== null ? apiCredits : '-'}</div>
                    <div className="text-sm font-medium text-slate-500">Available API Credits</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <FileText size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">Total</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-1">{generationCount}</div>
                    <div className="text-sm font-medium text-slate-500">Generations Created</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Key size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">Active</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-1">{apiKeyCount}</div>
                    <div className="text-sm font-medium text-slate-500">API Keys</div>
                </div>
            </div>

            {/* API Keys Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-12">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">API Keys</h2>
                    <button
                        onClick={onCreateKey}
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        Create New Key
                    </button>
                </div>
                <div className="p-6">
                    {apiKeys.length > 0 ? (
                        <div className="space-y-4">
                            {apiKeys.map((key) => (
                                <div key={key.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
                                            <Key size={20} />
                                        </div>
                                        <div>
                                            <div className="font-mono text-sm font-medium text-slate-900">{key.label || 'Unnamed Key'}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">Created on {new Date(key.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-500">
                                            {key.key_hash.substring(0, 8)}...
                                        </code>
                                        <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <Key size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No API keys found. Create one to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
