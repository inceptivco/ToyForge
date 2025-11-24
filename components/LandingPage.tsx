import React from 'react';
import { Bot, ArrowRight, Code, Zap, Layers, Shield, CheckCircle2 } from 'lucide-react';
import { ApiDemo } from './ApiDemo';
import { ComponentDemo } from './ComponentDemo';
import { Link } from 'react-router-dom';
import { getStorageUrl } from '../utils/storage';
import { SEOHead } from './SEOHead';

interface LandingPageProps {
    user?: any;
    onSignInClick?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user, onSignInClick }) => {
    return (
        <>
            <SEOHead 
                title="CharacterForge - AI Character & Avatar Generator for Apps, Games & Design"
                description="Generate production-ready 3D characters and avatars with AI. Perfect for game development, app design, and digital projects. React components, REST API, and transparent PNGs. Instant character generation in seconds."
                keywords="character generator, avatar generator, AI character creator, game characters, app avatars, 3D character generator, character API, avatar API, character assets, design characters, NPC generator, profile avatars"
                url="https://characterforge.app/"
            />
            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-brand-100 selection:text-brand-900">
            {/* Navigation */}
            <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white transform rotate-3 shadow-lg shadow-red-500/30">
                            <Bot size={20} strokeWidth={2.5} />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900">CharacterForge</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="hidden md:flex items-center gap-6">
                            <Link to="/developer/docs" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Documentation</Link>
                        </div>
                        <Link
                            to="/app"
                            className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            Launch App
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-32 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-100/50 rounded-full blur-3xl -z-10 opacity-60" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-4xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-medium mb-8 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            v1.0 Public API Now Available
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                            <span className="text-slate-900">Effortlessly integrate</span> <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-brand-500 to-purple-600">3D Avatars & Characters</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                            The AI-powered engine for generating consistent, production-ready 3D characters and avatars.
                            Perfect for game development, app design, and digital projects. Drop our React component into your app and start creating in minutes.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/app"
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-xl shadow-red-500/30"
                            >
                                Start Creating <ArrowRight size={20} />
                            </Link>
                            <Link
                                to="/developer"
                                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-lg transition-colors border-2 border-slate-200 hover:border-slate-300 shadow-sm"
                            >
                                View Documentation
                            </Link>
                        </div>
                    </div>

                    {/* Visual Hero Grid */}
                    <div className="mt-20 relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden pb-8">
                        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10" />
                        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10" />

                        <div className="flex gap-6 animate-[scroll_60s_linear_infinite] w-max px-4">
                            {[
                                // Set 1
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662605042_v71pmk.png'),
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662662948_nz2cs9.png'),
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662691341_bcn2xi.png'),
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662713279_vd5oh.png'),
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763658047143_6bv8f.png'),
                                // Set 2 (Duplicate for smooth loop)
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662605042_v71pmk.png'),
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662662948_nz2cs9.png'),
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662691341_bcn2xi.png'),
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662713279_vd5oh.png'),
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763658047143_6bv8f.png'),
                                // Set 3 (Extra buffer)
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662605042_v71pmk.png'),
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662662948_nz2cs9.png'),
                                getStorageUrl('04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662691341_bcn2xi.png'),
                            ].map((src, i) => (
                                <div key={i} className="w-64 h-64 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 flex items-center justify-center transform transition-transform hover:scale-105 duration-300">
                                    <img
                                        src={src}
                                        alt="AI-generated 3D character and avatar created with CharacterForge for games and apps"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-24">
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Instant Generation</h3>
                            <p className="text-slate-500 leading-relaxed">Create unique characters and avatars in seconds with our optimized AI pipeline. No 3D modeling or design skills required.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                                <Layers size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Production-Ready Assets</h3>
                            <p className="text-slate-500 leading-relaxed">Automated background removal delivers transparent PNGs perfect for games, apps, and design projects.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-6">
                                <Code size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Developer First</h3>
                            <p className="text-slate-500 leading-relaxed">Integrate character and avatar generation directly into your apps and games with our simple REST API or React SDK.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* React Component Section */}
            <section id="react" className="py-24 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Drop-in Character Forge Component Library</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Don't want to manage API calls? Use our pre-built React and React Native components for a seamless character generation integration experience.
                        </p>
                    </div>

                    <ComponentDemo />
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Character Generation Pricing</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Pay only for what you generate. No monthly fees, no hidden costs. Affordable character creation for developers and creators.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* App Pricing */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                                    <Bot size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">CharacterForge App</h3>
                            </div>
                            <div className="mb-6">
                                <div className="flex items-baseline">
                                    <span className="text-4xl font-bold text-slate-900">$0.15</span>
                                    <span className="text-slate-500 ml-2">/ generation</span>
                                </div>
                                <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
                                    <span className="text-xs font-semibold text-green-700">Save with Credit Packs:</span>
                                    <span className="text-lg font-bold text-green-600">$0.10</span>
                                    <span className="text-xs text-green-600">/ generation</span>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-slate-600">
                                    <CheckCircle2 size={18} className="text-green-500" />
                                    <span>Visual Character Creator</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-600">
                                    <CheckCircle2 size={18} className="text-green-500" />
                                    <span>Instant Downloads</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-600">
                                    <CheckCircle2 size={18} className="text-green-500" />
                                    <span>Personal Asset Gallery</span>
                                </li>
                            </ul>
                            <Link to="/app" className="block w-full py-3 px-6 bg-slate-900 text-white text-center font-bold rounded-xl hover:bg-slate-800 transition-colors">
                                Launch App
                            </Link>
                        </div>

                        {/* API Pricing */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                                DEVELOPER
                            </div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600">
                                    <Code size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">API & SDK</h3>
                            </div>
                            <div className="mb-6">
                                <div className="flex items-baseline">
                                    <span className="text-4xl font-bold text-slate-900">$0.10</span>
                                    <span className="text-slate-500 ml-2">/ generation</span>
                                </div>
                                <p className="text-sm text-brand-600 mt-2 font-medium">
                                    Flat rate for all API usage
                                </p>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-slate-600">
                                    <CheckCircle2 size={18} className="text-green-500" />
                                    <span>No minimum commitment</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-600">
                                    <CheckCircle2 size={18} className="text-green-500" />
                                    <span>Full API Access</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-600">
                                    <CheckCircle2 size={18} className="text-green-500" />
                                    <span>React & React Native SDKs</span>
                                </li>
                            </ul>
                            <Link to="/developer" className="block w-full py-3 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-center font-bold rounded-xl transition-all shadow-lg shadow-red-500/30">
                                Get API Keys
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            {/* API Section */}
            <section id="api" className="py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-brand-400 text-xs font-medium mb-6">
                                REST API
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Full Control for Developers</h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                Need more flexibility? Our CharacterForge REST API gives you granular control over character generation, caching, and asset management.
                            </p>

                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-brand-400 font-mono font-bold border border-slate-700">1</div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">Get your API Key</h4>
                                        <p className="text-slate-400 mt-1">Sign up and generate a secure API key from your dashboard.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-brand-400 font-mono font-bold border border-slate-700">2</div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">Make a Request</h4>
                                        <p className="text-slate-400 mt-1">Send a POST request with your character configuration.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-brand-400 font-mono font-bold border border-slate-700">3</div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">Receive Asset</h4>
                                        <p className="text-slate-400 mt-1">Get a hosted URL for your generated image, ready to use.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12">
                                <Link to="/developer" className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-2 group text-lg">
                                    Get API Key <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* API Demo Component */}
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 to-purple-500/20 rounded-3xl blur-xl pointer-events-none" />
                            <ApiDemo />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-white border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white">
                            <Bot size={14} strokeWidth={3} />
                        </div>
                        <span className="font-bold text-slate-900">CharacterForge</span>
                        <span className="text-slate-400 text-sm">© 2025</span>
                    </div>
                    <div className="flex gap-8 text-sm font-medium text-slate-500">
                        <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Twitter</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
        </>
    );
};
