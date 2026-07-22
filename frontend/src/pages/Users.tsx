import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Trash2, UserPlus, Shield, KeyRound } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
}

const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ id: number; username: string } | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [changePassword, setChangePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data as User[];
    },
  });

  
  const createMutation = useMutation({
    mutationFn: async (newUser: any) => {
      return api.post('/users', newUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNewUsername('');
      setNewPassword('');
      toast.success("User created successfully.");
    },
    onError: (err: any) => {
      toast.error(`Failed to create user: ${err.response?.data?.error || err.message}`);
    }
  });

  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User deleted successfully.");
    },
    onError: (err: any) => {
      toast.error(`Failed to delete user: ${err.response?.data?.error || err.message}`);
    }
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { id: number; payload: { current_password?: string; new_password: string } }) => {
      return api.put(`/users/${data.id}/password`, data.payload);
    },
    onSuccess: () => {
      toast.success("Password changed successfully.");
      closePasswordDialog();
    },
    onError: (err: any) => {
      toast.error(`Failed to change password: ${err.response?.data?.error || err.message}`);
    }
  });

  const closePasswordDialog = () => {
    setPasswordTarget(null);
    setCurrentPassword('');
    setChangePassword('');
    setConfirmPassword('');
  };

  const isSelfChange = passwordTarget?.id === currentUser?.id;
  const passwordFormValid =
    changePassword.length >= 8 &&
    changePassword === confirmPassword &&
    (!isSelfChange || currentPassword.length > 0);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget || !passwordFormValid) return;
    passwordMutation.mutate({
      id: passwordTarget.id,
      payload: {
        new_password: changePassword,
        ...(isSelfChange ? { current_password: currentPassword } : {}),
      },
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;
    createMutation.mutate({ username: newUsername.trim(), password: newPassword });
  };

  const handleDeleteUser = (id: number, username: string) => {
    setPendingDelete({ id, username });
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      deleteMutation.mutate(pendingDelete.id);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage GUI access and administrators</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30 py-5">
              <CardTitle className="text-indigo-900 dark:text-indigo-100 flex items-center gap-2 text-lg">
                <UserPlus className="w-5 h-5" /> Add New User
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username"
                    placeholder="admin2" 
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    autoComplete="off"
                    data-lpignore="true"
                    className="dark:bg-slate-900 dark:border-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="********" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    data-lpignore="true"
                    className="dark:bg-slate-900 dark:border-slate-800"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!newUsername.trim() || !newPassword.trim() || createMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm mt-2"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 py-4 bg-white dark:bg-slate-900">
              <div>
                <CardTitle>System Users</CardTitle>
                <CardDescription>Accounts authorized to access the FNM GUI</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-950 sticky top-0">
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-slate-500 dark:text-slate-400">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : !users || users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-slate-500 dark:text-slate-400">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold uppercase text-xs">
                            {u.username[0]}
                          </div>
                          {u.username}
                          {currentUser?.id === u.id && (
                            <Badge variant="outline" className="ml-2 text-xs font-normal">You</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                            <Shield className="w-3.5 h-3.5" />
                            <span className="capitalize">{u.role || 'Admin'}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPasswordTarget(u)}
                            className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            title={currentUser?.id === u.id ? "Change your password" : "Reset password"}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={deleteMutation.isPending || currentUser?.id === u.id}
                            className={currentUser?.id === u.id ? 'opacity-30' : 'text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}
                            title={currentUser?.id === u.id ? "Cannot delete your own account" : "Delete user"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!passwordTarget} onOpenChange={(open) => { if (!open) closePasswordDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              {isSelfChange ? 'Change Your Password' : `Reset Password for "${passwordTarget?.username}"`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 py-4">
            {isSelfChange && (
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="dark:bg-slate-900 dark:border-slate-800"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={changePassword}
                onChange={(e) => setChangePassword(e.target.value)}
                autoComplete="new-password"
                className="dark:bg-slate-900 dark:border-slate-800"
              />
              {changePassword.length > 0 && changePassword.length < 8 && (
                <p className="text-xs text-red-500">Must be at least 8 characters</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="dark:bg-slate-900 dark:border-slate-800"
              />
              {confirmPassword.length > 0 && confirmPassword !== changePassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={closePasswordDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!passwordFormValid || passwordMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {passwordMutation.isPending ? 'Saving...' : 'Change Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700 dark:text-red-400">Confirm User Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 dark:text-slate-400 py-4">
            Are you sure you want to delete the user account for{' '}
            <span className="font-bold">"{pendingDelete?.username}"</span>?
            This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
