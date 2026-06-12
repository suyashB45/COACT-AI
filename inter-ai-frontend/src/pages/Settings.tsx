import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Lock, AlertTriangle, ArrowLeft, Shield } from 'lucide-react';
import Navigation from '../components/landing/Navigation';
import { updateName, updatePassword, deleteAccount, toggle2FA, verifyUpdatePassword, verifyDeleteAccount } from '../lib/api';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    
    // Settings state
    const [newName, setNewName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState({ text: '', type: '' });
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    
    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // OTP Modal state
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [pendingAction, setPendingAction] = useState<'password_update' | 'account_deletion' | null>(null);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }
        const currentUser = JSON.parse(userStr);
        setUser(currentUser);
        if (currentUser.name) {
            setNewName(currentUser.name);
        }
        if (currentUser.is_2fa_enabled !== undefined) {
            setIs2FAEnabled(currentUser.is_2fa_enabled);
        }
    }, [navigate]);

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            setIsUpdatingName(true);
            const res = await updateName(newName);
            
            // Update local user state
            const updatedUser = { ...user, name: res.name };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setSettingsMessage({ text: 'Name updated successfully', type: 'success' });
            setTimeout(() => setSettingsMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setSettingsMessage({ text: 'Failed to update name', type: 'error' });
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) return;
        try {
            setIsUpdatingPassword(true);
            const res = await updatePassword(currentPassword, newPassword);
            if (res.status === 'otp_required') {
                setPendingAction('password_update');
                setShowOtpModal(true);
                setSettingsMessage({ text: 'A verification code has been sent. Please check your inbox and spam folder.', type: 'success' });
            } else {
                setSettingsMessage({ text: 'Password updated successfully', type: 'success' });
                setCurrentPassword('');
                setNewPassword('');
                setTimeout(() => setSettingsMessage({ text: '', type: '' }), 3000);
            }
        } catch (error: any) {
            setSettingsMessage({ text: error.message || 'Failed to update password. Check your current password.', type: 'error' });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleToggle2FA = async () => {
        try {
            const newState = !is2FAEnabled;
            await toggle2FA(newState);
            setIs2FAEnabled(newState);
            
            // Update local user state
            const updatedUser = { ...user, is_2fa_enabled: newState };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setSettingsMessage({ text: `2FA ${newState ? 'enabled' : 'disabled'} successfully`, type: 'success' });
            setTimeout(() => setSettingsMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setSettingsMessage({ text: 'Failed to update 2FA settings', type: 'error' });
            setTimeout(() => setSettingsMessage({ text: '', type: '' }), 3000);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setIsDeleting(true);
            const res = await deleteAccount();
            if (res.status === 'otp_required') {
                setPendingAction('account_deletion');
                setShowDeleteModal(false);
                setShowOtpModal(true);
                setSettingsMessage({ text: 'A verification code has been sent. Please check your inbox and spam folder.', type: 'success' });
            } else {
                localStorage.removeItem('user');
                navigate('/');
            }
        } catch (error: any) {
            console.error('Failed to delete account:', error);
            alert(error.message || 'Failed to delete account. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode) return;
        try {
            setIsVerifyingOtp(true);
            if (pendingAction === 'password_update') {
                await verifyUpdatePassword(currentPassword, newPassword, otpCode);
                setSettingsMessage({ text: 'Password updated successfully', type: 'success' });
                setCurrentPassword('');
                setNewPassword('');
            } else if (pendingAction === 'account_deletion') {
                await verifyDeleteAccount(otpCode);
                localStorage.removeItem('user');
                navigate('/');
                return;
            }
            setShowOtpModal(false);
            setOtpCode('');
            setPendingAction(null);
            setTimeout(() => setSettingsMessage({ text: '', type: '' }), 3000);
        } catch (error: any) {
            setSettingsMessage({ text: error.message || 'Invalid verification code.', type: 'error' });
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background font-sans">
            <Navigation />

            <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 pb-16 sm:pb-32">
                <button 
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Profile
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border shadow-sm rounded-xl p-6 sm:p-10 mb-8"
                >
                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border/50">
                        <SettingsIcon className="w-6 h-6 text-primary" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Account Settings</h1>
                    </div>

                    {settingsMessage.text && (
                        <div className={`p-4 rounded-lg mb-8 text-sm font-medium ${settingsMessage.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                            {settingsMessage.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Update Name Form */}
                        <form onSubmit={handleUpdateName} className="space-y-5 bg-background p-6 rounded-xl border border-border/50">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-primary" /> Display Name
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">How you appear to others on the platform.</p>
                            <div>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Enter new display name"
                                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors shadow-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isUpdatingName || !newName.trim()}
                                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold shadow-md disabled:opacity-50"
                            >
                                {isUpdatingName ? 'Updating...' : 'Save Name'}
                            </button>
                        </form>

                        {/* Update Password Form */}
                        <form onSubmit={handleUpdatePassword} className="space-y-5 bg-background p-6 rounded-xl border border-border/50">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-2">
                                <Lock className="w-4 h-4 text-primary" /> Security
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">Update your password to keep your account secure.</p>
                            <div className="space-y-3">
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Current Password"
                                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors shadow-sm"
                                />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New Password"
                                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors shadow-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isUpdatingPassword || !currentPassword || !newPassword}
                                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold shadow-md disabled:opacity-50"
                            >
                                {isUpdatingPassword ? 'Updating...' : 'Change Password'}
                            </button>
                        </form>

                        {/* 2-Step Verification Form */}
                        <div className="space-y-5 bg-background p-6 rounded-xl border border-border/50 md:col-span-2 lg:col-span-1">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-primary" /> 2-Step Verification
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account.</p>
                            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg shadow-sm">
                                <div>
                                    <h4 className="font-semibold text-sm text-foreground">Authenticator App</h4>
                                    <p className="text-xs text-muted-foreground">Use an app like Google Authenticator.</p>
                                </div>
                                <button
                                    onClick={handleToggle2FA}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${is2FAEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${is2FAEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <button
                                onClick={handleToggle2FA}
                                className="w-full px-4 py-3 bg-muted text-foreground border border-border rounded-lg hover:bg-muted/80 transition-colors text-sm font-bold shadow-sm"
                            >
                                {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Danger Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-red-500/20 shadow-sm rounded-xl p-6 sm:p-10 mt-8 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> Danger Zone
                            </h2>
                            <p className="text-muted-foreground text-sm max-w-lg">
                                Once you delete your account, there is no going back. Please be certain.
                                This will permanently delete all your practice history and data.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full sm:w-auto px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-md shadow-red-500/20 whitespace-nowrap"
                        >
                            Delete Account
                        </button>
                    </div>
                </motion.div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-card border border-border shadow-2xl rounded-2xl p-6 max-w-md w-full"
                        >
                            <h3 className="text-xl font-bold text-foreground mb-4">Delete Account?</h3>
                            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                                Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all your practice history.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-border hover:bg-muted font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* OTP Verification Modal */}
                {showOtpModal && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-card border border-border shadow-2xl rounded-2xl p-6 max-w-md w-full"
                        >
                            <h3 className="text-xl font-bold text-foreground mb-2">Enter Verification Code</h3>
                            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                                We've sent a 6-digit code to your email. Please check your inbox (and spam folder), and enter it below to confirm this action.
                            </p>
                            <input
                                type="text"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="Enter 6-digit code"
                                className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-6 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
                                maxLength={6}
                            />
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => {
                                        setShowOtpModal(false);
                                        setOtpCode('');
                                        setPendingAction(null);
                                    }}
                                    disabled={isVerifyingOtp}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-border hover:bg-muted font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={isVerifyingOtp || otpCode.length !== 6}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-colors disabled:opacity-50"
                                >
                                    {isVerifyingOtp ? 'Verifying...' : 'Verify & Complete'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
