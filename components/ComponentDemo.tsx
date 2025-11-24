import React, { useState, useEffect, useRef } from 'react';
import { CharacterSmithEmbed } from './CharacterSmithEmbed';
import { Code, Eye, Copy, Check, Smartphone, ArrowRight, RefreshCw } from 'lucide-react';
import { getStorageUrl } from '../utils/storage';

// Six SPECIFIC character configurations with their images
// These cycle in order on refresh
const CHARACTER_CONFIGS = [
    {
        // Character 1: Kid with glasses, headphones, beanie
        gender: 'female' as const,
        ageGroup: 'kid',
        skinTone: 'porcelain',
        hairStyle: 'pixie',
        hairColor: 'white',
        clothing: 'blouse',
        clothingColor: 'teal',
        eyeColor: 'blue',
        accessories: ['glasses', 'headphones', 'beanie'],
        transparent: true,
        imageUrl: getStorageUrl('default-character.png')
    },
    {
        // Character 2: Adult with sunglasses
        gender: 'male' as const,
        ageGroup: 'adult',
        skinTone: 'brown',
        hairStyle: 'messy',
        hairColor: 'platinum',
        clothing: 'sweater',
        clothingColor: 'red',
        eyeColor: 'dark',
        accessories: ['sunglasses'],
        transparent: true,
        imageUrl: getStorageUrl('char2.png')
    },
    {
        // Character 3: Kid with no accessories
        gender: 'male' as const,
        ageGroup: 'kid',
        skinTone: 'medium',
        hairStyle: 'buzz',
        hairColor: 'platinum',
        clothing: 'hoodie',
        clothingColor: 'navy',
        eyeColor: 'brown',
        accessories: ['none'],
        transparent: true,
        imageUrl: getStorageUrl('char3.png')
    },
    {
        // Character 4: Young adult with glasses
        gender: 'female' as const,
        ageGroup: 'young_adult',
        skinTone: 'fair',
        hairStyle: 'messy',
        hairColor: 'ginger',
        clothing: 'jacket',
        clothingColor: 'green',
        eyeColor: 'dark',
        accessories: ['glasses'],
        transparent: true,
        imageUrl: getStorageUrl('char4.png')
    },
    {
        // Character 5: Preteen with beanie
        gender: 'male' as const,
        ageGroup: 'preteen',
        skinTone: 'olive',
        hairStyle: 'buzz',
        hairColor: 'brown',
        clothing: 'henley',
        clothingColor: 'teal',
        eyeColor: 'grey',
        accessories: ['beanie'],
        transparent: true,
        imageUrl: getStorageUrl('char5.png')
    },
    {
        // Character 6: Preteen with no accessories
        gender: 'female' as const,
        ageGroup: 'preteen',
        skinTone: 'olive',
        hairStyle: 'buns',
        hairColor: 'ginger',
        clothing: 'hoodie',
        clothingColor: 'black',
        eyeColor: 'brown',
        accessories: ['none'],
        transparent: true,
        imageUrl: getStorageUrl('char6.png')
    }
];

export const ComponentDemo: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'react' | 'react-native'>('react');
    const [isCopied, setIsCopied] = useState(false);
    const [isInstallCopied, setIsInstallCopied] = useState(false);
    const [triggerLoading, setTriggerLoading] = useState(false);
    // Initialize with random index on page load, then cycle in order
    const [currentConfigIndex, setCurrentConfigIndex] = useState(() => 
        Math.floor(Math.random() * CHARACTER_CONFIGS.length)
    );
    const [isRefreshing, setIsRefreshing] = useState(false);
    const demoRef = useRef<HTMLDivElement>(null);

    const currentConfig = CHARACTER_CONFIGS[currentConfigIndex];

    // Removed IntersectionObserver to prevent auto-loading on scroll
    // The component will start with the default character and only load when manually refreshed

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
        return activeTab === 'react-native' ? 'npm install @charactersmith/react-native' : 'npm install @charactersmith/react';
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getSnippet());
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleInstallCopy = () => {
        navigator.clipboard.writeText(getInstallCommand());
        setIsInstallCopied(true);
        setTimeout(() => setIsInstallCopied(false), 2000);
    };

    const highlightCode = (code: string): React.ReactElement => {
        const lines = code.split('\n');
        const keywords = ['import', 'export', 'const', 'return', 'from', 'true', 'false'];
        const components = ['CharacterSmith', 'CharacterSmithView', 'MobileCharacter', 'MyCharacter'];

        return (
            <>
                {lines.map((line, lineIdx) => {
                    // Simple regex-based highlighting
                    const parts: Array<{ text: string; className: string }> = [];
                    let lastIndex = 0;

                    // Match strings (single or double quotes)
                    const stringRegex = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
                    let match;

                    while ((match = stringRegex.exec(line)) !== null) {
                        // Add text before string
                        if (match.index > lastIndex) {
                            const before = line.substring(lastIndex, match.index);
                            parts.push(...highlightNonStrings(before, keywords, components));
                        }
                        // Add string
                        parts.push({ text: match[0], className: 'text-green-400' });
                        lastIndex = match.index + match[0].length;
                    }

                    // Add remaining text
                    if (lastIndex < line.length) {
                        const remaining = line.substring(lastIndex);
                        parts.push(...highlightNonStrings(remaining, keywords, components));
                    }

                    // If no strings found, highlight the whole line
                    if (parts.length === 0) {
                        parts.push(...highlightNonStrings(line, keywords, components));
                    }

                    return (
                        <span key={lineIdx} className="block">
                            {parts.map((part, partIdx) => (
                                <span key={partIdx} className={part.className}>
                                    {part.text}
                                </span>
                            ))}
                            {lineIdx < lines.length - 1 && '\n'}
                        </span>
                    );
                })}
            </>
        );
    };

    const highlightNonStrings = (text: string, keywords: string[], components: string[]): Array<{ text: string; className: string }> => {
        const parts: Array<{ text: string; className: string }> = [];
        const words = text.split(/(\s+|[{}(),;:=<>[\]/])/);

        words.forEach(word => {
            const trimmed = word.trim();
            if (!trimmed) {
                parts.push({ text: word, className: 'text-slate-300' });
                return;
            }

            if (keywords.includes(trimmed)) {
                parts.push({ text: word, className: 'text-purple-400' });
            } else if (components.includes(trimmed) || /^[A-Z][a-zA-Z]*$/.test(trimmed)) {
                parts.push({ text: word, className: 'text-blue-400' });
            } else if (/^\d+$/.test(trimmed)) {
                parts.push({ text: word, className: 'text-orange-400' });
            } else if (/^[{}(),;:=<>[\]/]+$/.test(trimmed)) {
                parts.push({ text: word, className: 'text-slate-400' });
            } else {
                parts.push({ text: word, className: 'text-slate-300' });
            }
        });

        return parts;
    };

    const getSnippet = () => {
        const accessoriesString = currentConfig.accessories && currentConfig.accessories.length > 0 && currentConfig.accessories[0] !== 'none'
            ? `,\n    accessories: [${currentConfig.accessories.filter(a => a !== 'none').map(a => `'${a}'`).join(', ')}]`
            : '';
        
        const configString = `{
    gender: '${currentConfig.gender}',
    ageGroup: '${currentConfig.ageGroup || 'teen'}',
    skinTone: '${currentConfig.skinTone || 'fair'}',
    hairStyle: '${currentConfig.hairStyle || 'short'}',
    hairColor: '${currentConfig.hairColor || 'brown'}',
    clothing: '${currentConfig.clothing || 'tshirt'}',
    clothingColor: '${currentConfig.clothingColor || 'blue'}',
    eyeColor: '${currentConfig.eyeColor || 'dark'}'${accessoriesString}
  }`;

        if (activeTab === 'react-native') {
            return `import { CharacterSmithView } from '@charactersmith/react-native';

export const MobileCharacter = () => {
  return (
    <CharacterSmithView
      apiKey={process.env.CHARACTER_SMITH_KEY}
      config={${configString}}
      cache={true}
      transparent={true}
      style={{ width: 300, height: 300 }}
    />
  );
};`;
        }
        return `import { CharacterSmith } from '@charactersmith/react';

export const MyCharacter = () => {
  return (
    <CharacterSmith
      apiKey={process.env.CHARACTER_SMITH_KEY}
      config={${configString}}
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
                {/* Left Side: Preview - Direct CharacterSmithEmbed without container */}
                <div className="flex items-center justify-center h-[700px]">
                    <CharacterSmithEmbed
                        triggerLoading={triggerLoading}
                        config={currentConfig}
                        imageUrl={currentConfig.imageUrl}
                    />
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
                        <div className="flex-1 p-8 overflow-auto font-mono text-sm leading-relaxed">
                            <pre className="text-slate-300 whitespace-pre-wrap">
                                <code>{highlightCode(getSnippet())}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </div>

            {/* Installation Package - Full Width Below */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-end justify-between gap-8">
                <div className="flex-1 w-full">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Install Package</div>
                    <div className="flex items-center gap-4 bg-slate-800 rounded-xl px-5 py-4 font-mono text-sm text-brand-400 border border-slate-700 shadow-inner h-[54px]">
                        <span>{getInstallCommand()}</span>
                        <button
                            onClick={handleInstallCopy}
                            className="ml-auto text-slate-500 hover:text-white transition-colors flex items-center gap-2 p-2 -mr-2"
                        >
                            {isInstallCopied ? (
                                <>
                                    <Check size={16} className="text-green-500" />
                                    <span className="text-green-500 text-xs font-bold">Copied!</span>
                                </>
                            ) : (
                                <Copy size={16} />
                            )}
                        </button>
                    </div>
                </div>
                <a
                    href="#"
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/40 whitespace-nowrap transform hover:-translate-y-0.5 h-[54px]"
                >
                    Read the Docs <ArrowRight size={20} />
                </a>
            </div>
        </div>
    );
};
