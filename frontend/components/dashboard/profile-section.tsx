"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Camera, Bell, Shield, AlertTriangle, Download, Trash2, Loader2, Key, Link as LinkIcon, Eye, EyeOff, UserX } from "lucide-react";
import { toast } from "sonner";
import * as profileAPI from "@/lib/api/profile";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";

export function ProfileSection({ user }: { user: any }) {
    const router = useRouter();
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [bio, setBio] = useState(user?.user_metadata?.bio || "");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Loading states
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [savingNotifications, setSavingNotifications] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [hardDeleting, setHardDeleting] = useState(false);
    const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false);

    // Notification preferences
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [sessionReminders, setSessionReminders] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(false);
    const [loadingPreferences, setLoadingPreferences] = useState(true);

    // Security features
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);
    const [connectedAccounts, setConnectedAccounts] = useState<profileAPI.ConnectedAccount[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);

    // Password visibility state
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Danger Zone state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Load notification preferences on mount
    useEffect(() => {
        async function loadPreferences() {
            try {
                const prefs = await profileAPI.getNotificationPreferences();
                setEmailNotifications(prefs.emailNotifications);
                setSessionReminders(prefs.sessionReminders);
                setWeeklyReport(prefs.weeklyReport);
            } catch (error) {
                console.error('Failed to load notification preferences:', error);
                toast.error('Failed to load notification preferences');
            } finally {
                setLoadingPreferences(false);
            }
        }
        loadPreferences();
    }, []);

    // Load connected accounts on mount
    useEffect(() => {
        async function loadAccounts() {
            try {
                const accounts = await profileAPI.getConnectedAccounts();
                setConnectedAccounts(accounts);
            } catch (error) {
                console.error('Failed to load connected accounts:', error);
            } finally {
                setLoadingAccounts(false);
            }
        }
        loadAccounts();
    }, []);

    // Load profile data from backend on mount
    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await profileAPI.getUserProfile();
                setFullName(profile.name || "");
                setEmail(profile.email || "");
                setBio(profile.bio || "");
                setAvatar(profile.avatar || null);
            } catch (error) {
                console.error('Failed to load profile:', error);
                // Fallback to user metadata if API fails
                setFullName(user?.user_metadata?.full_name || "");
                setEmail(user?.email || "");
                setBio(user?.user_metadata?.bio || "");
            } finally {
                setLoadingProfile(false);
            }
        }
        loadProfile();
    }, []);

    const handleSaveChanges = async () => {
        try {
            setSavingProfile(true);
            await profileAPI.updateProfile({
                name: fullName,
                email,
                bio
            });
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('File too large. Maximum size is 2MB.');
                return;
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
                return;
            }

            // Show preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload immediately
            try {
                setUploadingAvatar(true);
                const result = await profileAPI.uploadAvatar(file);
                setAvatar(result.avatarUrl);
                toast.success('Avatar uploaded successfully!');
            } catch (error) {
                console.error('Failed to upload avatar:', error);
                toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
                setAvatar(null); // Reset preview on error
            } finally {
                setUploadingAvatar(false);
            }
        }
    };

    const handleSaveNotifications = async (overrides?: Partial<{
        emailNotifications: boolean;
        sessionReminders: boolean;
        weeklyReport: boolean;
    }>) => {
        try {
            setSavingNotifications(true);
            await profileAPI.updateNotificationPreferences({
                emailNotifications: overrides?.emailNotifications ?? emailNotifications,
                sessionReminders: overrides?.sessionReminders ?? sessionReminders,
                weeklyReport: overrides?.weeklyReport ?? weeklyReport
            });
            toast.success('Notification preferences saved!');
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
            toast.error('Failed to save notification preferences');
        } finally {
            setSavingNotifications(false);
        }
    };

    const handlePasswordChange = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        try {
            setChangingPassword(true);
            await profileAPI.changePassword(currentPassword, newPassword);
            toast.success('Password changed successfully!');

            // Reset form and close dialog
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowPasswordDialog(false);
        } catch (error) {
            console.error('Failed to change password:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleExportData = async () => {
        try {
            setExporting(true);
            const data = await profileAPI.exportUserData();

            // Download as JSON file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mock-mentor-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Data exported successfully!');
        } catch (error) {
            console.error('Failed to export data:', error);
            toast.error('Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setDeleting(true);
            await profileAPI.deleteUserAccount();

            // Sign out from Supabase to update Navbar state
            const supabase = createClient();
            await supabase.auth.signOut();

            toast.success('Account deactivated successfully');
            // Force logout and redirect
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Failed to deactivate account:', error);
            toast.error('Failed to deactivate account');
            setDeleting(false);
        }
    };

    const handleHardDeleteAccount = async () => {
        try {
            setHardDeleting(true);
            await profileAPI.hardDeleteUserAccount();

            // Sign out from Supabase to update Navbar state
            const supabase = createClient();
            await supabase.auth.signOut();

            toast.success('Account permanently deleted');
            // Force logout and redirect
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Failed to delete account:', error);
            toast.error('Failed to delete account');
            setHardDeleting(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="animate-fade-down">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                    Account Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your profile and preferences
                </p>
            </div>

            {/* Profile Information */}
            <Card className="animate-fade-up">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Profile Information</CardTitle>
                    </div>
                    <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                                {avatar ? (
                                    <img src={avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                                ) : (
                                    getInitials(fullName || email)
                                )}
                            </div>
                            <label
                                htmlFor="avatar-upload"
                                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                            >
                                <Camera className="h-3.5 w-3.5" />
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </label>
                        </div>
                        <div>
                            <p className="font-medium text-sm mb-1">Change Avatar</p>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG or GIF. Max 2MB.
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Name and Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder=""
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder=""
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder=""
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleSaveChanges}
                            size="lg"
                            disabled={savingProfile}
                        >
                            {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="animate-fade-up" style={{ animationDelay: "100ms" }}>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Notifications</CardTitle>
                    </div>
                    <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">
                                Receive email updates about your sessions
                            </p>
                        </div>
                        <Switch
                            checked={emailNotifications}
                            onCheckedChange={async (checked) => {
                                setEmailNotifications(checked);
                                await handleSaveNotifications({ emailNotifications: checked });
                            }}
                            disabled={loadingPreferences}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="font-medium">Session Reminders</p>
                            <p className="text-sm text-muted-foreground">
                                Get reminded before scheduled sessions
                            </p>
                        </div>
                        <Switch
                            checked={sessionReminders}
                            onCheckedChange={async (checked) => {
                                setSessionReminders(checked);
                                await handleSaveNotifications({ sessionReminders: checked });
                            }}
                            disabled={loadingPreferences}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="font-medium">Weekly Progress Report</p>
                            <p className="text-sm text-muted-foreground">
                                Receive weekly summaries of your progress
                            </p>
                        </div>
                        <Switch
                            checked={weeklyReport}
                            onCheckedChange={async (checked) => {
                                setWeeklyReport(checked);
                                await handleSaveNotifications({ weeklyReport: checked });
                            }}
                            disabled={loadingPreferences}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Security */}
            <Card className="animate-fade-up" style={{ animationDelay: "200ms" }}>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Security</CardTitle>
                    </div>
                    <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Password */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="font-medium">Password</p>
                            <p className="text-sm text-muted-foreground">
                                Update your password regularly for security
                            </p>
                        </div>
                        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Key className="h-4 w-4" />
                                    Change Password
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Change Password</DialogTitle>
                                    <DialogDescription>
                                        Enter your current password and choose a new one. Password must be at least 8 characters long.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="current-password"
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Enter current password"
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="sr-only">
                                                    {showCurrentPassword ? "Hide password" : "Show password"}
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="new-password"
                                                type={showNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="sr-only">
                                                    {showNewPassword ? "Hide password" : "Show password"}
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirm-password"
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="sr-only">
                                                    {showConfirmPassword ? "Hide password" : "Show password"}
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowPasswordDialog(false)}
                                        disabled={changingPassword}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handlePasswordChange}
                                        disabled={changingPassword}
                                    >
                                        {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Change Password
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Separator />

                    {/* Two-Factor Authentication - Coming Soon */}
                    <div className="flex items-center justify-between opacity-60">
                        <div className="space-y-0.5">
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-muted-foreground">
                                Coming soon - Add an extra layer of security
                            </p>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                            Enable
                        </Button>
                    </div>

                    <Separator />

                    {/* Connected Accounts */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="font-medium">Connected Accounts</p>
                                <p className="text-sm text-muted-foreground">
                                    OAuth providers linked to your account
                                </p>
                            </div>
                        </div>

                        {loadingAccounts ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </div>
                        ) : connectedAccounts.length > 0 ? (
                            <div className="space-y-2">
                                {connectedAccounts.map((account, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium capitalize">{account.provider}</p>
                                                <p className="text-xs text-muted-foreground">{account.email}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Connected
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No connected accounts. Sign in with an OAuth provider to link your account.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="animate-fade-up border-destructive/50" style={{ animationDelay: "300ms" }}>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    </div>
                    <CardDescription>Irreversible account actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                        <div className="space-y-0.5">
                            <p className="font-medium">Export Your Data</p>
                            <p className="text-sm text-muted-foreground">
                                Download all your session data
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={handleExportData}
                            disabled={exporting}
                        >
                            {exporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Export
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                        <div className="space-y-0.5">
                            <p className="font-medium text-destructive">Deactivate Account</p>
                            <p className="text-sm text-muted-foreground">
                                Deactivate your account (Soft Delete)
                            </p>
                        </div>
                        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <UserX className="h-4 w-4" />
                                    )}
                                    Deactivate Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to deactivate?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will deactivate your account. Your data will be retained
                                        but you will lose access until you reactivate it.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteAccount();
                                        }}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={deleting}
                                    >
                                        {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Deactivate Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/50">
                        <div className="space-y-0.5">
                            <p className="font-medium text-red-600">Permanently Delete Account</p>
                            <p className="text-sm text-red-600/80">
                                Irreversibly remove user info and data
                            </p>
                        </div>
                        <AlertDialog open={showHardDeleteDialog} onOpenChange={setShowHardDeleteDialog}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-2 bg-red-600 hover:bg-red-700"
                                    disabled={hardDeleting}
                                >
                                    {hardDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    Delete Forever
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600">⚠️ PERMANENT DELETION WARNING</AlertDialogTitle>
                                    <AlertDialogDescription className="text-foreground">
                                        This action cannot be undone. This will <strong>permanently delete</strong> your
                                        account and <strong>remove all your data</strong> from our servers immediately.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={hardDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleHardDeleteAccount();
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        disabled={hardDeleting}
                                    >
                                        {hardDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Permanently Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
