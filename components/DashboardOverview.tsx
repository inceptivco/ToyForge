import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, FileText, Key, AlertTriangle } from 'lucide-react';
import { ApiKeyManager } from './ApiKeyManager';

interface DashboardOverviewProps {
    apiCredits: number | null;
    generationCount: number;
    apiKeyCount: number;
    apiKeys: any[];
    checkUser: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    apiCredits,
    generationCount,
    apiKeyCount,
    apiKeys,
    checkUser
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
                        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">API</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-1">{generationCount}</div>
                    <div className="text-sm font-medium text-slate-500">API Generations</div>
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
            <div className="mb-12">
                <ApiKeyManager onKeysChange={checkUser} />
            </div>
        </div>
    );
};
