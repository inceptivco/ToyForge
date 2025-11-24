// Force update: 2025-11-20T14:24:00
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { Bot, Sparkles, LogOut, LayoutDashboard, User, ChevronDown } from 'lucide-react';
import { ConfigPanel } from './components/ConfigPanel';
import { CharacterForgeEmbed } from './components/CharacterForgeEmbed';
import { LandingPage } from './components/LandingPage';
import { DeveloperDashboard } from './components/DeveloperDashboard';
import { CreditPurchaseModal } from './components/CreditPurchaseModal';
import { SignInModal } from './components/SignInModal';
import { CharacterConfig } from './types';
import { DEFAULT_CONFIG, SKIN_TONES, HAIR_STYLES, HAIR_COLORS, CLOTHING_ITEMS, CLOTHING_COLORS, ACCESSORIES, EYE_COLORS, AGE_GROUPS } from './constants';
import { generateCharacterPipeline } from './services/geminiService';
import { supabase } from './services/supabase';

function MainApp() {
  const [config, setConfig] = useState<CharacterConfig>(DEFAULT_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', userId)
      .single<{ credits_balance: number }>();

    if (!error && data) {
      setCredits(data.credits_balance);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsAuthLoading(false);
    });

    // Load last generated image
    const savedImage = localStorage.getItem('lastGeneratedImage');
    if (savedImage) {
      setGeneratedImage(savedImage);
    }

    return () => subscription.unsubscribe();
  }, []);

  const getRandomConfig = () => {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const validHairStyles = HAIR_STYLES.filter(h => !h.gender || h.gender === gender);
    const validClothing = CLOTHING_ITEMS.filter(c => !c.gender || c.gender === gender);

    // Randomize 0-2 accessories (reduced from 0-3 to minimize conflicts)
    const numAccessories = Math.floor(Math.random() * 3); // 0, 1, or 2
    const shuffledAccessories = [...ACCESSORIES]
      .filter(a => a.id !== 'none')
      .sort(() => 0.5 - Math.random())
      .slice(0, numAccessories)
      .map(a => a.id);

    // Resolve conflicts: glasses and sunglasses can't both be worn
    const resolvedAccessories = resolveAccessoryConflicts(shuffledAccessories);
    const selectedAccessories = resolvedAccessories.length > 0 ? resolvedAccessories : ['none'];

    return {
      gender,
      ageGroup: AGE_GROUPS[Math.floor(Math.random() * AGE_GROUPS.length)].id,
      skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].id,
      hairStyle: validHairStyles[Math.floor(Math.random() * validHairStyles.length)].id,
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].id,
      clothing: validClothing[Math.floor(Math.random() * validClothing.length)].id,
      clothingColor: CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)].id,
      eyeColor: EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)].id,
      accessories: selectedAccessories,
      transparent: config.transparent, // Keep current transparency setting
    } as CharacterConfig;
  };

  // Helper to resolve accessory conflicts
  const resolveAccessoryConflicts = (accessories: string[]): string[] => {
    const result: string[] = [];
    const seen = new Set<string>();
    
    // Conflict map: if accessory is selected, exclude these others
    const conflicts: Record<string, string[]> = {
      'glasses': ['sunglasses'],
      'sunglasses': ['glasses'],
      'cap': ['beanie', 'headphones'],
      'beanie': ['cap', 'headphones'],
      'headphones': ['cap', 'beanie'],
    };
    
    for (const accessory of accessories) {
      // Skip if a conflicting accessory was already added
      if (seen.has(accessory)) continue;
      
      result.push(accessory);
      
      // Mark this and its conflicts as seen
      conflicts[accessory]?.forEach(conflict => seen.add(conflict));
    }
    
    return result;
  };

  // Randomize on mount
  useEffect(() => {
    setConfig(getRandomConfig());
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Don't clear previous image immediately to prevent flicker/unblur if possible, 
    // but user requested "refresh should keep last image", which we handled with localStorage.
    // Clearing it here gives visual feedback that something is happening.
    // setGeneratedImage(null); 

    try {
      const configWithNoCache = { ...config, cache: false };
      const imageUrl = await generateCharacterPipeline(configWithNoCache, (status) => console.log(status));
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        localStorage.setItem('lastGeneratedImage', imageUrl);
        // Refresh credits immediately
        if (user) {
          fetchProfile(user.id);
        }
      }
    } catch (error: any) {
      console.error("Generation failed:", error);
      // Check if it's an auth error
      if (error?.message?.includes('logged in')) {
        setIsSignInOpen(true);
      } else if (error?.message?.includes('credits')) {
        // Open credit purchase modal
        setIsBuyCreditsOpen(true);
      } else {
        alert("Failed to generate character. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomize = () => {
    setConfig(getRandomConfig());
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // TODO: Re-enable once sign-in is implemented
  // if (!user) {
  //   return <Navigate to="/" replace />;
  // }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-red-100 selection:text-red-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="relative w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform duration-300">
                <Bot size={20} strokeWidth={2.5} />
              </div>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
              CharacterForge
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Credits Display */}
            {user && (
              <button
                onClick={() => setIsBuyCreditsOpen(true)}
                className="group/credits flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all shadow-sm cursor-pointer"
              >
                <Sparkles size={16} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-slate-700">
                  {credits !== null ? credits : '-'} credits
                </span>
                <div
                  className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 group-hover/credits:bg-red-500 group-hover/credits:text-white transition-colors"
                >
                  <span className="text-xs font-bold leading-none mb-0.5">+</span>
                </div>
              </button>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm border border-red-200">
                    {user.email[0].toUpperCase()}
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                        <div className="mt-2 flex md:hidden items-center gap-2 text-xs font-medium text-slate-600">
                          <Sparkles size={12} className="text-amber-500 fill-amber-500" />
                          {credits !== null ? credits : '-'} credits
                        </div>
                      </div>
                      <Link
                        to="/developer"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <LayoutDashboard size={16} />
                        Dev Console
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsSignInOpen(true)}
                className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Panel - Config */}
          <div className="lg:col-span-4 flex flex-col">
            <ConfigPanel
              config={config}
              onChange={setConfig}
              onGenerate={handleGenerate}
              onRandomize={handleRandomize}
              isGenerating={isGenerating}
              hideCacheControl={true}
            />
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-8 sticky top-24">
            <div className="w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col font-sans relative h-[calc(100vh-8rem)]">
              {/* Frame Header */}
              <div className="h-14 border-b border-slate-100 flex items-center justify-between px-5 bg-white z-10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white">
                    <Bot size={14} strokeWidth={3} />
                  </div>
                  <span className="font-bold text-slate-900 text-sm tracking-tight">CharacterForge</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                </div>
              </div>

              {/* Embed Content */}
              <div className="flex-1 relative overflow-hidden">
                <CharacterForgeEmbed
                  config={config}
                  isLoading={isGenerating}
                  imageUrl={generatedImage}
                  className="h-full"
                />
              </div>

              {/* Frame Footer */}
              <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} transition-colors`} />
                  <span>{isGenerating ? 'Processing...' : 'System Online'}</span>
                </div>
                <span className="font-mono opacity-50">ID: 8X92-M</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <CreditPurchaseModal
        isOpen={isBuyCreditsOpen}
        onClose={() => setIsBuyCreditsOpen(false)}
        userId={user?.id}
      />

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
      />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<LandingPage user={user} onSignInClick={() => setIsSignInOpen(true)} />} />
        <Route path="/app" element={<MainApp />} />
        <Route path="/developer/*" element={<DeveloperDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
      />
    </BrowserRouter>
  );
}