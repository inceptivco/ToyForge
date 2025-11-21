import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

export const SettingsView: React.FC = () => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase.functions.invoke('delete-account');
            if (error) throw error;

            // Sign out locally
            await supabase.auth.signOut();
            window.location.href = '/'; // Redirect to home
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-red-100 bg-red-50/50">
                    <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-600" />
                        Danger Zone
                    </h2>
                </div>

                <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">Delete Account</h3>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                        </div>

                        {!showConfirm ? (
                            <button
                                onClick={() => setShowConfirm(true)}
                                className="px-4 py-2 bg-white border border-slate-200 text-red-600 font-medium rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
                            >
                                Delete Account
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-200">
                                <span className="text-sm font-medium text-slate-600">Are you sure?</span>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                    Confirm Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
