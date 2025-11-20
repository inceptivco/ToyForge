import React, { useState, useEffect, useRef } from 'react';
import { ToyForgeEmbed } from './ToyForgeEmbed';
import { Code, Eye, Copy, Check, Smartphone, ArrowRight, RefreshCw } from 'lucide-react';

// Three SPECIFIC character configurations with their images (different from carousel)
// These are fixed and will always cycle in this order
const CHARACTER_CONFIGS = [
    {
        gender: 'male' as const,
        skinToneId: 'fair',
        hairStyleId: 'short',
        hairColorId: 'dark_brown',
        clothingColorId: 'purple',
        eyeColorId: 'brown',
        accessoryId: 'sunglasses',
        imageUrl: 'https://mnxzykltetirdcnxugcl.supabase.co/storage/v1/object/public/generations/04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662713279_vd5oh.png'
    },
    {
        gender: 'female' as const,
        skinToneId: 'olive',
        hairStyleId: 'ponytail',
        hairColorId: 'auburn',
        clothingColorId: 'teal',
        eyeColorId: 'hazel',
        accessoryId: 'none',
        imageUrl: 'https://mnxzykltetirdcnxugcl.supabase.co/storage/v1/object/public/generations/04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763658047143_6bv8f_original.png'
    },
    {
        gender: 'male' as const,
        skinToneId: 'brown',
        hairStyleId: 'fade',
        hairColorId: 'black',
        clothingColorId: 'green',
        eyeColorId: 'dark',
        accessoryId: 'cap',
        imageUrl: 'https://mnxzykltetirdcnxugcl.supabase.co/storage/v1/object/public/generations/demo/example_character.png'
    }
];

export const ComponentDemo: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'react' | 'react-native'>('react');
    const [isCopied, setIsCopied] = useState(false);
    const [triggerLoading, setTriggerLoading] = useState(false);
    const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const demoRef = useRef<HTMLDivElement>(null);

    const currentConfig = CHARACTER_CONFIGS[currentConfigIndex];

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTriggerLoading(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        if (demoRef.current) {
            observer.observe(demoRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTriggerLoading(false);
        // Cycle to next config
        setCurrentConfigIndex((prev) => (prev + 1) % CHARACTER_CONFIGS.length);
        setTimeout(() => {
            setTriggerLoading(true);
            setIsRefreshing(false);
        }, 150);
    };

    const getInstallCommand = () => {
        return activeTab === 'react-native' ? 'npm install @toyforge/react-native' : 'npm install @toyforge/react';
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getSnippet());
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const getSnippet = () => {
        const configString = `{
        gender: '${currentConfig.gender}',
        skinToneId: '${currentConfig.skinToneId}',
        hairStyleId: '${currentConfig.hairStyleId}',
        hairColorId: '${currentConfig.hairColorId}',
        clothingColorId: '${currentConfig.clothingColorId}',
        eyeColorId: '${currentConfig.eyeColorId}'${currentConfig.accessoryId !== 'none' ? `,\n        accessoryId: '${currentConfig.accessoryId}'` : ''}
      }`;

        if (activeTab === 'react-native') {
            return `import { CharacterForgeView } from '@toyforge/react-native';

export const MobileCharacter = () => {
  return (
    <CharacterForgeView
      apiKey={process.env.CHARACTER_FORGE_KEY}
      config=${configString}
      cache={true}
      transparent={true}
      style={{ width: 300, height: 300 }}
    />
  );
};`;
        }
        return `import { CharacterForge } from '@toyforge/react';

export const MyCharacter = () => {
  return (
    <CharacterForge
      apiKey={process.env.CHARACTER_FORGE_KEY}
      config=${configString}
      cache={true}
      transparent={true}
      onGenerate={(url) => console.log(url)}
    />
  );
};`;
    };

    return (
        <div className="w-full max-w-7xl mx-auto" ref={demoRef}>
            {/* Character and Code - Same Height, No Nested Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Left Side: Preview - Direct ToyForgeEmbed without container */}
                <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-200 shadow-2xl h-[700px] relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] z-0" />

                    {!isRefreshing && (
                        <div className="relative z-10 transform scale-150 transition-transform duration-500">
                            <ToyForgeEmbed
                                triggerLoading={triggerLoading}
                                config={currentConfig}
                                imageUrl={currentConfig.imageUrl}
                            />
                        </div>
                    )}
                </div>

                {/* Right Side: Code */}
                <div className="flex flex-col h-[700px]">
                    {/* Tabs with Refresh Button */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveTab('react')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'react'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 transform -translate-y-0.5'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <Code size={18} />
                                React
                            </button>
                            <button
                                onClick={() => setActiveTab('react-native')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'react-native'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 transform -translate-y-0.5'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <Smartphone size={18} />
                                React Native
                            </button>
                        </div>

                        {/* Refresh Button in Toolbar */}
                        <button
                            onClick={handleRefresh}
                            className="p-3 bg-white text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-xl shadow-sm border border-slate-200 transition-all hover:rotate-180 duration-500"
                            title="Cycle Character"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>

                    {/* Code Block - Increased height, no scroll */}
                    <div className="flex-1 bg-[#1e1e1e] rounded-3xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col">
                        {/* Code Header */}
                        <div className="bg-[#252526] px-6 py-4 flex items-center justify-between border-b border-slate-800">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                            </div>
                            <div className="text-slate-500 text-xs font-mono">
                                {activeTab === 'react-native' ? 'MobileCharacter.tsx' : 'MyCharacter.tsx'}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                {isCopied ? (
                                    <>
                                        <Check size={14} />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Code Content - No scroll, fits perfectly */}
                        <div className="flex-1 p-8 flex items-center justify-center font-mono text-sm leading-relaxed">
                            <pre className="text-slate-300">
                                <code>{getSnippet()}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </div>

            {/* Installation Package - Full Width Below */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="flex-1 w-full">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Install Package</div>
                    <div className="flex items-center gap-4 bg-slate-800 rounded-xl px-5 py-4 font-mono text-sm text-brand-400 border border-slate-700 shadow-inner">
                        <span>{getInstallCommand()}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(getInstallCommand())}
                            className="ml-auto text-slate-500 hover:text-white transition-colors"
                        >
                            <Copy size={16} />
                        </button>
                    </div>
                </div>
                <a
                    href="#"
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/40 whitespace-nowrap transform hover:-translate-y-0.5"
                >
                    Read the Docs <ArrowRight size={20} />
                </a>
            </div>
        </div>
    );
};
