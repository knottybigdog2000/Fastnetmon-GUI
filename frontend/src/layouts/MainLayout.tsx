import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Server,
  ShieldAlert,
  Settings,
  Users,
  LogOut,
  Activity,
  ScrollText,
  KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/ThemeToggle';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const closePwDialog = () => {
    setPwOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const pwMutation = useMutation({
    mutationFn: () => api.put(`/users/${user?.id}/password`, {
      current_password: currentPassword,
      new_password: newPassword,
    }),
    onSuccess: () => {
      toast.success('Password changed successfully.');
      closePwDialog();
    },
    onError: (err: any) => {
      toast.error(`Failed to change password: ${err.response?.data?.error || err.message}`);
    },
  });

  const pwFormValid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Servers', path: '/servers', icon: Server },
    { name: 'Mitigation', path: '/mitigation', icon: ShieldAlert },
    { name: 'Hostgroups', path: '/hostgroups', icon: Users },
    { name: 'Users', path: '/users', icon: Settings, adminOnly: true },
    { name: 'Audit Log', path: '/audit', icon: ScrollText },
    { name: 'Settings', path: '/settings', icon: Settings, adminOnly: true },
  ].filter((item) => isAdmin || !item.adminOnly);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors relative">
        <div className="p-6 flex items-center justify-between gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8" />
            <span>FNM GUI</span>
          </div>
          <ThemeToggle />
        </div>
        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 px-4 py-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold uppercase">
              {user?.username[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate dark:text-slate-200">{user?.username}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              onClick={() => setPwOpen(true)}
              title="Change your password"
            >
              <KeyRound className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            className="w-full flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>

      <Dialog open={pwOpen} onOpenChange={(open) => { if (!open) closePwDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" /> Change Your Password
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); if (pwFormValid) pwMutation.mutate(); }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="ml-current-password">Current Password</Label>
              <Input
                id="ml-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ml-new-password">New Password</Label>
              <Input
                id="ml-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-red-500">Must be at least 8 characters</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ml-confirm-password">Confirm New Password</Label>
              <Input
                id="ml-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={closePwDialog}>Cancel</Button>
              <Button
                type="submit"
                disabled={!pwFormValid || pwMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {pwMutation.isPending ? 'Saving...' : 'Change Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainLayout;
