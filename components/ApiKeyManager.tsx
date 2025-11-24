import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { apiLogger } from '../utils/logger';
import { Key, Trash2, Copy, Check, Plus, AlertTriangle, X } from 'lucide-react';

interface ApiKey {
    id: string;
    label: string;
    created_at: string;
    last_used_at: string | null;
}

interface ApiKeyManagerProps {
    onKeysChange?: () => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeysChange }) => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [label, setLabel] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        const { data } = await supabase
            .from('api_keys')
            .select('id, label, created_at, last_used_at')
            .is('deleted_at', null)  // Only fetch active keys
            .order('created_at', { ascending: false });

        if (data) setKeys(data);
        setIsLoading(false);
    };

    const createKey = async () => {
        if (!label.trim()) return;
        setIsCreating(true);
        setError(null);

        try {
            // Check authentication
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Please sign in first');
            }

            apiLogger.info('Invoking create-api-key', { label });

            const { data, error } = await supabase.functions.invoke('create-api-key', {
                body: { label }
            });

            apiLogger.debug('Response received', { hasData: !!data, hasError: !!error });

            // Handle errors: Check for error in response data first (edge function returns error in body for non-2xx)
            // Supabase may set error for non-2xx status codes, but data should still contain the response body
            if (error || (data && typeof data === 'object' && 'error' in data)) {
                // Prefer error message from response body (more specific), then fall back to Supabase error message
                const errorMessage = (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string')
                    ? data.error
                    : (error?.message || 'Failed to create API key. Please try again.');
                apiLogger.error('Error from function', new Error(errorMessage));
                throw new Error(errorMessage);
            }

            if (!data || !data.apiKey) {
                throw new Error('No API key returned from server');
            }

            apiLogger.info('Key created successfully');
            setNewKey(data.apiKey);
            setLabel('');
            await fetchKeys();
            onKeysChange?.();
            // Keep modal open to show the key
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create API key. Please try again.';
            apiLogger.error('Failed to create key', err instanceof Error ? err : undefined);
            setError(errorMessage);
            alert('Failed to create API key: ' + errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    const deleteKey = async (id: string) => {
        if (!confirm('Are you sure? This will revoke the API key. Past usage will still be visible for billing purposes.')) return;

        try {
            apiLogger.info('Soft deleting key', { keyId: id.substring(0, 8) + '...' });

            // Soft delete by setting deleted_at timestamp
            const { error } = await supabase
                .from('api_keys')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                apiLogger.error('Delete error', error);
                throw error;
            }

            apiLogger.info('Key soft deleted successfully');
            setKeys(keys.filter(k => k.id !== id));
            onKeysChange?.();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to revoke API key. Please try again.';
            apiLogger.error('Failed to delete key', err instanceof Error ? err : undefined);
            alert('Failed to revoke API key: ' + errorMessage);
        }
    };

    const handleCopy = () => {
        if (newKey) {
            navigator.clipboard.writeText(newKey);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNewKey(null);
        setLabel('');
        setError(null);
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setNewKey(null);
        setLabel('');
        setError(null);
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Key size={20} className="text-brand-500" />
                                API Keys
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Manage keys to access the CharacterForge API programmatically.
                            </p>
                        </div>
                        <button
                            onClick={handleOpenModal}
                            className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm hover:shadow-md active:scale-95"
                        >
                            <Plus size={18} />
                            Create New Key
                        </button>
                    </div>
                </div>

                <div className="p-6">

                {/* Key List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-400">Loading keys...</div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No API keys found. Create one to get started.
                        </div>
                    ) : (
                        keys.map(key => (
                            <div key={key.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                                <div>
                                    <div className="font-medium text-slate-800">{key.label}</div>
                                    <div className="text-xs text-slate-400 mt-0.5 flex gap-3">
                                        <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                                        {key.last_used_at && (
                                            <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                        sk_characterforge_...
                                    </div>
                                    <button
                                        onClick={() => deleteKey(key.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Revoke Key"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                </div>
            </div>

            {/* Create Key Modal */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={handleCloseModal}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-6">
                            {!newKey ? (
                                <>
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Create New API Key</h2>
                                        <p className="text-slate-500 text-sm">
                                            Give your key a label to help you identify it later.
                                        </p>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Key Label
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. My App, Production, Development"
                                            value={label}
                                            onChange={(e) => {
                                                setLabel(e.target.value);
                                                setError(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && label.trim() && !isCreating) {
                                                    createKey();
                                                }
                                            }}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                            autoFocus
                                        />
                                    </div>

                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                                                    <AlertTriangle size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-red-800 mb-1">Error</h4>
                                                    <p className="text-sm text-red-700">{error}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={handleCloseModal}
                                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={createKey}
                                            disabled={isCreating || !label.trim()}
                                            className="flex-1 px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 min-h-[42px]"
                                        >
                                            {isCreating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={18} />
                                                    Create Key
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-green-100 rounded-full text-green-600">
                                                <Check size={24} />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Key Created Successfully!</h2>
                                        </div>
                                        <p className="text-slate-500 text-sm">
                                            Copy this key now. You won't be able to see it again.
                                        </p>
                                    </div>

                                    <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                Your API Key
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-3">
                                            <code className="flex-1 font-mono text-sm text-slate-600 break-all select-all">
                                                {newKey}
                                            </code>
                                            <button
                                                onClick={handleCopy}
                                                className="flex items-center gap-2 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md text-sm font-medium transition-colors shrink-0"
                                                title="Copy to clipboard"
                                            >
                                                {isCopied ? (
                                                    <>
                                                        <Check size={16} />
                                                        <span>Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={16} />
                                                        <span>Copy</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                            <div className="text-sm text-amber-800">
                                                <p className="font-semibold mb-1">Important</p>
                                                <p>Store this key securely. It will not be shown again.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCloseModal}
                                        className="w-full px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors"
                                    >
                                        Done
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
