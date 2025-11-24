import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { logger } from '../utils/logger';
import { Loader2, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const billingLogger = logger.child('Billing');

interface BillingViewProps {
    user: { id: string; email?: string } | null;
}

export const BillingView: React.FC<BillingViewProps> = ({ user }) => {
    const location = useLocation();
    const [credits, setCredits] = useState<number | null>(null);
    const [apiCredits, setApiCredits] = useState<number | null>(null);
    const [usageData, setUsageData] = useState<{ date: string; credits: number; breakdown: Record<string, number> }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) {
            billingLogger.warn('No user provided, cannot fetch data');
            return;
        }

        billingLogger.debug('Fetching data', { userId: user.id });
        setLoading(true);
        try {
            // Fetch Profile (Credits)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('credits_balance, api_credits_balance')
                .eq('id', user.id)
                .single();

            if (profileError) {
                billingLogger.error('Error fetching profile', profileError);
                return;
            }

            billingLogger.debug('Profile data received', { hasProfile: !!profile });

            if (profile) {
                const apiCreds = profile.api_credits_balance ?? 0;
                const appCreds = profile.credits_balance ?? 0;
                billingLogger.debug('Setting credits', { apiCredits: apiCreds, appCredits: appCreds });
                setCredits(appCreds);
                setApiCredits(apiCreds);
            } else {
                billingLogger.warn('No profile data found');
                setCredits(0);
                setApiCredits(0);
            }

            // Fetch Usage History (Generations) - only API usage, not app usage
            const { data: generations, error: genError } = await supabase
                .from('generations')
                .select(`
                    created_at, 
                    cost_in_credits, 
                    api_key_id,
                    api_keys:api_key_id (
                        id,
                        label,
                        key_hash
                    )
                `)
                .eq('user_id', user.id)
                .not('api_key_id', 'is', null) // Only show API usage, not app usage
                .order('created_at', { ascending: false })
                .limit(100); // Get recent 100 API generations
            
            if (genError) {
                billingLogger.error('Error fetching generations', genError);
            }

            if (generations) {
                // Group by date and API key (only API usage now)
                type GroupedUsage = Record<string, Record<string, number>>;
                const grouped = generations.reduce((acc: GroupedUsage, curr) => {
                    const date = new Date(curr.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const apiKeyId = curr.api_key_id as string;
                    const apiKeyData = curr.api_keys as { id: string; label: string; key_hash: string } | null;
                    const apiKeyLabel = apiKeyData?.label || `API Key ${apiKeyId.substring(0, 8)}`;

                    if (!acc[date]) acc[date] = {};
                    if (!acc[date][apiKeyLabel]) acc[date][apiKeyLabel] = 0;
                    acc[date][apiKeyLabel] += (curr.cost_in_credits || 1);
                    return acc;
                }, {} as GroupedUsage);

                // Convert to chart data format - sum all API keys per date for the main chart
                const chartData = Object.keys(grouped).map(date => {
                    const dateData = grouped[date];
                    const totalCredits = Object.values(dateData).reduce((sum, val) => sum + val, 0);
                    return {
                        date,
                        credits: totalCredits,
                        breakdown: dateData // Store breakdown for detailed view if needed
                    };
                }).slice(-7); // Last 7 days with activity

                setUsageData(chartData);
            }

        } catch (error) {
            billingLogger.error('Error fetching billing data', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial fetch when component mounts or user changes
    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [user?.id, fetchData]); // Include fetchData in dependencies

    // Refresh data periodically to catch updates (only when user exists)
    useEffect(() => {
        if (!user) return;
        
        const interval = setInterval(() => {
            fetchData();
        }, 30000); // Refresh every 30 seconds (reduced frequency to avoid excessive refreshes)
        
        return () => clearInterval(interval);
    }, [user?.id, fetchData]); // Include fetchData in dependencies

    // Handle success/canceled params from Stripe redirect
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('success') === 'true') {
            // Clean up URL first
            window.history.replaceState({}, '', location.pathname);
            
            // Refresh data with retry mechanism - webhook may take a moment to process
            if (user) {
                let retries = 0;
                const maxRetries = 5;
                const retryDelay = 2000; // 2 seconds between retries
                
                const fetchWithRetry = async () => {
                    await fetchData();
                    
                    // Wait a moment for webhook to process
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Check if credits were updated
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('api_credits_balance')
                        .eq('id', user.id)
                        .single();
                    
                    retries++;
                    
                    // If still 0 and we haven't exceeded retries, try again
                    if (profile && profile.api_credits_balance === 0 && retries < maxRetries) {
                        setTimeout(fetchWithRetry, retryDelay);
                    }
                };
                
                // Initial fetch with delay to allow webhook to process
                setTimeout(fetchWithRetry, 2000);
            }
        } else if (params.get('canceled') === 'true') {
            window.history.replaceState({}, '', location.pathname);
        }
    }, [location, user, fetchData]);

    // Estimated Value Calculation (assuming ~$0.10 per credit for display)
    const estimatedValue = (apiCredits !== null && apiCredits > 0)
        ? (apiCredits * 0.10).toFixed(2)
        : (credits !== null && credits > 0)
        ? (credits * 0.15).toFixed(2)
        : '0.00';

    // Debug logging
    if (apiCredits === null && credits === null) {
        billingLogger.debug('State values are null', { userId: user?.id });
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-600" size={32} /></div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Billing & Usage</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Pricing Info */}
                <div className="md:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Pricing & Credits</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-2">API Usage</h3>
                            <p className="text-slate-600 mb-2">
                                The CharacterForge API uses a simple flat-rate pricing model.
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-slate-900">$0.10</span>
                                <span className="text-slate-500">/ generation</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-2">Credit System</h3>
                            <p className="text-slate-600 mb-2">
                                Purchase credits to use for both API calls and App generations.
                            </p>
                            <ul className="text-sm text-slate-500 list-disc list-inside">
                                <li>Minimum purchase: $5.00</li>
                                <li>Credits never expire</li>
                                <li>One simple balance for everything</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CreditCard size={120} />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-lg font-medium text-slate-400 mb-1">Pay as you go</h2>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-sm text-slate-400">Credit balance</span>
                            <span className="text-5xl font-bold text-white">${estimatedValue}</span>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsPurchaseModalOpen(true)}
                                className="bg-white text-slate-900 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                            >
                                Add to credit balance
                            </button>
                        </div>

                        <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex gap-3 items-start justify-between">
                            <div className="flex gap-3">
                                <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="text-sm font-medium text-white mb-1">Auto recharge</p>
                                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                                        Automatically top up your balance when it falls below $0.
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" disabled />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Usage Chart */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <TrendingUp size={20} className="text-brand-600" />
                            Usage History
                        </h2>
                        <span className="text-sm text-slate-500">Last 7 active days</span>
                    </div>

                    <div className="h-64 w-full min-h-[256px]">
                        {usageData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                                <BarChart data={usageData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="credits" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <TrendingUp size={48} className="mb-4 opacity-20" />
                                <p>No usage data available yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CreditPurchaseModal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} type="api" />
        </div>
    );
};
