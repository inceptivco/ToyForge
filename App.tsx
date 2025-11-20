import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ConfigPanel } from './components/ConfigPanel';
import { ImageDisplay } from './components/ImageDisplay';
import { AuthModal } from './components/AuthModal';
import { CreditPurchaseModal } from './components/CreditPurchaseModal';
import { CharacterConfig } from './types';
import {
  DEFAULT_CONFIG,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  CLOTHING_ITEMS,
  CLOTHING_COLORS,
  ACCESSORIES,
  EYE_COLORS
} from './constants';
import { generateCharacterPipeline } from './services/geminiService';
import { supabase } from './services/supabase';
import { ApiKeyManager } from './components/ApiKeyManager';
import { LandingPage } from './components/LandingPage';
import { DeveloperDashboard } from './components/DeveloperDashboard';
import { Bot, Download, AlertCircle, User, Coins, LogOut, Plus, Key, X, ThumbsUp, ThumbsDown, LayoutDashboard } from 'lucide-react';

const MainApp: React.FC = () => {
  const [config, setConfig] = useState<CharacterConfig>(DEFAULT_CONFIG);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Auth & Credits State
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // Randomization Logic
  const randomItem = <T extends { id: string }>(arr: T[]): string => arr[Math.floor(Math.random() * arr.length)].id;

  const handleRandomize = () => {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const validHair = HAIR_STYLES.filter(h => !h.gender || h.gender === gender);
    const validClothes = CLOTHING_ITEMS.filter(c => !c.gender || c.gender === gender);

    setConfig({
      gender,
      skinToneId: randomItem(SKIN_TONES),
      hairStyleId: randomItem(validHair),
      hairColorId: randomItem(HAIR_COLORS),
      clothingId: randomItem(validClothes),
      clothingColorId: randomItem(CLOTHING_COLORS),
      accessoryId: randomItem(ACCESSORIES),
      eyeColorId: randomItem(EYE_COLORS),
    });
  };

  // Initial Load & Auth Check
  useEffect(() => {
    // Randomize on Load
    handleRandomize();

    // Check Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCredits(session.user.id);
      setIsAuthLoading(false);
    });

    // Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCredits(session.user.id);
      else setCredits(null);
    });

    // Check for success/cancel query params from Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      setStatusMessage("Payment successful! Credits added.");
      setTimeout(() => setStatusMessage(""), 5000);
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => subscription.unsubscribe();
  }, []);

  const fetchCredits = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    if (data) setCredits(data.credits_balance);
  };

  const handleGenerate = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (credits !== null && credits < 1) {
      setError("Insufficient credits. Please purchase more to continue.");
      setIsPurchaseModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setStatusMessage("Initializing...");

    try {
      const imageUrl = await generateCharacterPipeline(config, (status) => {
        setStatusMessage(status);
      });
      setGeneratedImage(imageUrl);
      // Refresh credits after generation
      fetchCredits(user.id);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Insufficient Credits') || err.status === 402) {
        setError("Insufficient credits. Please purchase more to continue.");
        setIsPurchaseModalOpen(true);
      } else {
        setError(err.message || "Failed to generate image. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `toy - forge - character - ${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <CreditPurchaseModal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} />



      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 transform rotate-3">
              <Bot size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-none">
                Character<span className="text-brand-500">Forge</span>
              </h1>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">3D Character Generator</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 text-sm font-medium">
                  <Coins size={16} className="text-amber-500" />
                  <span>{credits !== null ? credits : '-'} Credits</span>
                  <button
                    onClick={() => setIsPurchaseModalOpen(true)}
                    className="ml-2 p-1 bg-amber-200 hover:bg-amber-300 rounded-full text-amber-800 transition-colors"
                    title="Buy Credits"
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>
                <div className="h-6 w-px bg-slate-200 mx-2" />
                <Link
                  to="/developer"
                  className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors text-sm font-medium"
                  title="Developer Console"
                >
                  <LayoutDashboard size={16} />
                  <span className="hidden sm:inline">Dev Console</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
              >
                <User size={18} />
                Sign In
              </button>
            )}

            {generatedImage && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-md"
              >
                <Download size={16} />
                Save Character
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Panel: Configuration */}
          <div className="lg:col-span-4 flex flex-col">
            <ConfigPanel
              config={config}
              onChange={setConfig}
              onGenerate={handleGenerate}
              onRandomize={handleRandomize}
              isGenerating={isLoading}
            />
            {!user && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                  <User size={14} />
                </div>
                <div>
                  <p className="font-semibold">Sign in to generate</p>
                  <p className="opacity-80 mt-1">Create an account to get 3 free credits and start creating your toys.</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Preview */}
          <div className="lg:col-span-8 flex flex-col sticky top-24 h-[calc(100vh-8rem)]">
            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 overflow-hidden relative flex flex-col">
              {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium border border-red-100 flex items-center gap-2 shadow-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              {/* Pass the specific status message to the display */}
              <ImageDisplay imageUrl={generatedImage} isLoading={isLoading} />

              {isLoading && (
                <div className="absolute bottom-8 left-0 right-0 text-center z-20">
                  <span className="inline-block px-4 py-1.5 bg-white/80 backdrop-blur rounded-full text-sm font-medium text-brand-600 shadow-sm border border-brand-100 animate-pulse">
                    {statusMessage}
                  </span>
                </div>
              )}
            </div>

            {/* Feedback Actions */}
            <div className="flex justify-center gap-4 mt-4">
              <button className="p-3 bg-white rounded-full text-slate-400 hover:text-green-500 hover:bg-green-50 border border-slate-200 shadow-sm transition-all hover:scale-110">
                <ThumbsUp size={20} />
              </button>
              <button
                onClick={handleGenerate}
                className="p-3 bg-white rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 shadow-sm transition-all hover:scale-110"
                title="Regenerate"
              >
                <ThumbsDown size={20} />
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<MainApp />} />
        <Route path="/developer" element={<DeveloperDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
