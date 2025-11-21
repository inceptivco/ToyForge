import React, { useState, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface CharacterConfig {
    gender?: string;
    skinTone?: string;
    hairStyle?: string;
    hairColor?: string;
    clothing?: string;
    clothingColor?: string;
    eyeColor?: string;
    accessories?: string[];
    transparent?: boolean;
    cache?: boolean;
}

interface CharacterForgeEmbedProps {
    config?: CharacterConfig;
    triggerLoading?: boolean;
    imageUrl?: string | null;
    isLoading?: boolean;
    className?: string;
}

export const CharacterForgeEmbed: React.FC<CharacterForgeEmbedProps> = ({
    config,
    triggerLoading,
    imageUrl,
    isLoading: externalIsLoading,
    className = ""
}) => {
    const [internalIsLoading, setInternalIsLoading] = useState(false);
    const [status, setStatus] = useState('Initializing...');

    // Use external loading state if provided, otherwise use internal
    const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;

    // Initialize with the default image always to ensure smooth transition from default -> generated
    const [image, setImage] = useState<string | null>("https://mnxzykltetirdcnxugcl.supabase.co/storage/v1/object/public/generations/04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763658047143_6bv8f.png");

    useEffect(() => {
        if (triggerLoading) {
            startLoadingSequence();
        }
    }, [triggerLoading]);

    // If in App mode (external isLoading provided), update image directly when not loading
    useEffect(() => {
        if (externalIsLoading !== undefined) {
            if (!externalIsLoading && imageUrl) {
                setImage(imageUrl);
            }
        }
    }, [externalIsLoading, imageUrl]);

    const startLoadingSequence = () => {
        setInternalIsLoading(true);
        setStatus('Initializing System...');

        setTimeout(() => setStatus('Analyzing Configuration...'), 800);
        setTimeout(() => setStatus('Generating Geometry...'), 1600);
        setTimeout(() => setStatus('Applying Textures...'), 2400);
        setTimeout(() => {
            setImage(imageUrl || "https://mnxzykltetirdcnxugcl.supabase.co/storage/v1/object/public/generations/04ab3acd-47b0-4f92-bae8-7db99cbf7158/1763658047143_6bv8f.png");
            setInternalIsLoading(false);
        }, 3500);
    };

    // Initial load on mount if no trigger provided and not controlled externally (fallback for demo)
    useEffect(() => {
        if (triggerLoading === undefined && externalIsLoading === undefined) {
            startLoadingSequence();
        }
    }, []);

    return (
        <div className={`w-full h-full bg-white overflow-hidden flex flex-col font-sans relative ${className}`}>

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

                            {/* Status Text for Real App Mode */}
                            {externalIsLoading !== undefined && (
                                <div className="absolute bottom-8 left-0 right-0 text-center z-20">
                                    <span className="inline-block px-4 py-1.5 bg-white/80 backdrop-blur rounded-full text-sm font-medium text-brand-600 shadow-sm border border-brand-100 animate-pulse">
                                        Generating Character...
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
        </div>
    );
};

