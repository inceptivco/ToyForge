import React, { useState, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface CharacterForgeEmbedProps {
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

export const CharacterForgeEmbed: React.FC<CharacterForgeEmbedProps> = ({ config, triggerLoading, imageUrl }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('Initializing...');
    // Initialize with the default image always to ensure smooth transition from default -> generated
    const [image, setImage] = useState<string | null>("https://mnxzykltetirdcnxugcl.supabase.co/storage/v1/object/public/generations/04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763658047143_6bv8f.png");

    useEffect(() => {
        if (triggerLoading) {
            startLoadingSequence();
        }
    }, [triggerLoading]);

    /* Removed automatic effect to prevent jumping
    useEffect(() => {
        if (imageUrl) {
            setImage(imageUrl);
        }
    }, [imageUrl]);
    */

    const startLoadingSequence = () => {
        setIsLoading(true);
        setStatus('Initializing System...');

        setTimeout(() => setStatus('Analyzing Configuration...'), 800);
        setTimeout(() => setStatus('Generating Geometry...'), 1600);
        setTimeout(() => setStatus('Applying Textures...'), 2400);
        setTimeout(() => {
            setImage(imageUrl || "https://mnxzykltetirdcnxugcl.supabase.co/storage/v1/object/public/generations/04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763658047143_6bv8f.png");
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
        <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col font-sans relative">
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
            <div className="flex-1 bg-slate-50 relative flex items-center justify-center p-6 overflow-hidden">
                {/* Always show the image, update source when done */}
                <div className="relative w-full h-full flex items-center justify-center group">
                    <img
                        src={image || "https://mnxzykltetirdcnxugcl.supabase.co/storage/v1/object/public/generations/04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763658047143_6bv8f.png"}
                        alt="Generated Character"
                        className={`w-full h-full object-contain drop-shadow-xl transition-all duration-700 ${isLoading ? 'scale-95 blur-sm opacity-80' : 'scale-100 blur-0 opacity-100'}`}
                    />
                    
                    {/* Magical Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-brand-500/20 to-blue-500/20 mix-blend-overlay animate-pulse" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)] animate-[pulse_3s_infinite]" />
                            <Sparkles className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-spin [animation-duration:3s]" size={48} strokeWidth={1} />
                        </div>
                    )}
                </div>
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

