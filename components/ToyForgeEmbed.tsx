import React, { useState, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface ToyForgeEmbedProps {
    apiKey?: string;
    config?: {
        gender?: string;
        skinToneId?: string;
        hairStyleId?: string;
        hairColorId?: string;
        clothingColorId?: string;
        eyeColorId?: string;
    };
    triggerLoading?: boolean;
    imageUrl?: string;
}

export const ToyForgeEmbed: React.FC<ToyForgeEmbedProps> = ({ config, triggerLoading, imageUrl }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('Initializing...');
    const [image, setImage] = useState<string | null>(imageUrl || null);

    useEffect(() => {
        if (triggerLoading) {
            startLoadingSequence();
        }
    }, [triggerLoading]);

    useEffect(() => {
        if (imageUrl) {
            setImage(imageUrl);
        }
    }, [imageUrl]);

    const startLoadingSequence = () => {
        setIsLoading(true);
        setStatus('Initializing System...');

        setTimeout(() => setStatus('Analyzing Configuration...'), 800);
        setTimeout(() => setStatus('Generating Geometry...'), 1600);
        setTimeout(() => setStatus('Applying Textures...'), 2400);
        setTimeout(() => {
            setImage(imageUrl || "https://mnxzykltetirdcnxugcl.supabase.co/storage/v1/object/public/generations/04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662605042_v71pmk.png");
            setIsLoading(false);
        }, 3500);
    };

    // Initial load on mount if no trigger provided (fallback)
    useEffect(() => {
        if (triggerLoading === undefined) {
            startLoadingSequence();
        }
    }, []);

    return (
        <div className="w-[340px] h-[480px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col font-sans relative">
            {/* Header */}
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

            {/* Main Content */}
            <div className="flex-1 bg-slate-50 relative flex items-center justify-center p-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center z-20">
                        {/* Holographic Scanner Animation */}
                        <div className="relative w-32 h-32 mb-8">
                            <div className="absolute inset-0 border-4 border-brand-500/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                            <div className="absolute inset-0 border-4 border-brand-500/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
                            <div className="absolute inset-2 border-t-4 border-brand-500 rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 bg-brand-500/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-brand-500/20">
                                    <Sparkles className="text-brand-500 animate-pulse" size={32} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-center">
                            <div className="text-brand-600 font-bold text-lg animate-pulse">{status}</div>
                            <div className="flex gap-1 justify-center">
                                <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                        <img
                            src={image || "https://mnxzykltetirdcnxugcl.supabase.co/storage/v1/object/public/generations/04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763662605042_v71pmk.png"}
                            alt="Generated Character"
                            className="w-full h-full object-contain drop-shadow-xl transform transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>System Online</span>
                </div>
                <span className="font-mono opacity-50">ID: 8X92-M</span>
            </div>
        </div>
    );
};
