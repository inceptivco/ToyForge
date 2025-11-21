import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Menu,
    X,
    ExternalLink,
    User, // Added User here
    CreditCard,
    ChevronUp,
    FileText,
    Bot
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { BillingView } from './BillingView';
import { SettingsView } from './SettingsView';
import { DocsView } from './DocsView';
import { DashboardOverview } from './DashboardOverview';
import { SignInModal } from './SignInModal';

export const DeveloperDashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Remove manual view state
    // const [view, setView] = useState<'dashboard' | 'billing' | 'settings' | 'docs'>('dashboard');

    useEffect(() => {
        // Check for success/canceled params
        const params = new URLSearchParams(location.search);
        if (params.get('success') === 'true') {
            // Show success message
            window.history.replaceState({}, '', location.pathname);
            // Force refresh user data
            checkUser();
            alert('Payment successful! Your credits have been updated.');
        } else if (params.get('canceled') === 'true') {
            window.history.replaceState({}, '', location.pathname);
        }
    }, [location]);

    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);
    const [apiCredits, setApiCredits] = useState<number | null>(null);
    const [user, setUser] = useState<any>(null);
    const [generationCount, setGenerationCount] = useState<number>(0);
    const [apiKeyCount, setApiKeyCount] = useState<number>(0);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const checkUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            setUser(user);

            // Only fetch user-specific data if logged in
            if (user) {
                // Fetch Profile (Credits)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('credits_balance, api_credits_balance')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setCredits(profile.credits_balance);
                    setApiCredits(profile.api_credits_balance);
                }

                // Fetch Generation Count
                const { count: genCount } = await supabase
                    .from('generations')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                setGenerationCount(genCount || 0);

                // Fetch API Keys
                const { data: keys, count: keyCount } = await supabase
                    .from('api_keys')
                    .select('*', { count: 'exact' })
                    .eq('user_id', user.id);

                setApiKeys(keys || []);
                setApiKeyCount(keyCount || 0);
            }
        } finally {
            setIsCheckingAuth(false);
        }
    };

    useEffect(() => {
        checkUser();
    }, []);

    // Route protection
    useEffect(() => {
        if (!isCheckingAuth && !user) {
            // If not on docs page, redirect to docs
            if (!location.pathname.includes('/developer/docs')) {
                navigate('/developer/docs');
            }
        }
    }, [user, isCheckingAuth, location.pathname, navigate]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const NavItem = ({ path, icon: Icon, label }: { path: string, icon: any, label: string }) => {
        // Check if active. For /developer, we want exact match or just /developer/
        // For others, we want startsWith
        const isActive = path === '/developer'
            ? location.pathname === '/developer' || location.pathname === '/developer/'
            : location.pathname.startsWith(path);

        return (
            <Link
                to={path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
            >
                <Icon size={20} />
                {label}
            </Link>
        );
    };

    // Show loading state only while checking auth
    if (isCheckingAuth) {
        return (
            <div className="flex h-screen bg-slate-50 items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out flex flex-col h-full
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                    <Link to="/" className="flex items-center gap-3 text-slate-900 font-bold text-xl tracking-tight hover:opacity-90 transition-opacity p-6 border-b border-slate-100">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white transform rotate-3 shadow-lg shadow-red-500/30">
                            <Bot size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className="block leading-none">CharacterForge</span>
                            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">Developer</span>
                        </div>
                    </Link>

                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {user && (
                            <>
                                <Link
                                    to="/developer"
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === '/developer'
                                        ? 'bg-brand-50 text-brand-700 font-medium shadow-sm ring-1 ring-brand-200'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <LayoutDashboard size={20} className={location.pathname === '/developer' ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} />
                                    Overview
                                </Link>
                                <Link
                                    to="/developer/billing"
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === '/developer/billing'
                                        ? 'bg-brand-50 text-brand-700 font-medium shadow-sm ring-1 ring-brand-200'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <CreditCard size={20} className={location.pathname === '/developer/billing' ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} />
                                    Billing & Usage
                                </Link>
                            </>
                        )}
                        <Link
                            to="/developer/docs"
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === '/developer/docs'
                                ? 'bg-brand-50 text-brand-700 font-medium shadow-sm ring-1 ring-brand-200'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <FileText size={20} className={location.pathname === '/developer/docs' ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} />
                            Documentation
                        </Link>
                        {user && (
                            <Link
                                to="/developer/settings"
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === '/developer/settings'
                                    ? 'bg-brand-50 text-brand-700 font-medium shadow-sm ring-1 ring-brand-200'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Settings size={20} className={location.pathname === '/developer/settings' ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} />
                                Settings
                            </Link>
                        )}
                    </nav>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            {user ? (
                                <>
                                    <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 text-left overflow-hidden">
                                            <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                                            <p className="text-xs text-slate-500 truncate">Free Plan</p>
                                        </div>
                                        <ChevronUp size={16} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showProfileMenu && (
                                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            <div className="p-1">
                                                <Link to="/app" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">
                                                    <ExternalLink size={16} />
                                                    Launch App
                                                </Link>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <LogOut size={16} />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsSignInOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    <User size={16} />
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    {/* Mobile Header */}
                    <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-orange-500 flex items-center justify-center">
                                <Bot className="text-white" size={18} />
                            </div>
                            <span className="font-bold text-slate-900">CharacterForge</span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                    </header>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto bg-slate-50">
                        <Routes>
                            <Route path="" element={
                                <DashboardOverview
                                    credits={credits}
                                    apiCredits={apiCredits}
                                    generationCount={generationCount}
                                    apiKeyCount={apiKeyCount}
                                    apiKeys={apiKeys}
                                    checkUser={checkUser}
                                />
                            } />
                            <Route path="billing" element={
                                <BillingView
                                    credits={credits}
                                    apiCredits={apiCredits}
                                    onPurchase={() => setIsPurchaseModalOpen(true)}
                                />
                            } />
                            <Route path="settings" element={<SettingsView user={user} />} />
                            <Route path="docs" element={<DocsView />} />
                        </Routes>
                    </div>
                </main>
            </div>

            <CreditPurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                type="api"
            />
            <SignInModal
                isOpen={isSignInOpen}
                onClose={() => setIsSignInOpen(false)}
                redirectUrl={window.location.href}
            />
        </>
    );
};
