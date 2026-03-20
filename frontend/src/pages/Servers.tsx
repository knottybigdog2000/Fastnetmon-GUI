import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Server } from '@/types/fnm';

const ServersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Server | null>(null);

  
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    api_port: 10007,
    api_login: 'admin',
    api_password: '',
  });

  const { data: servers, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await api.get('/servers');
      return response.data as Server[];
    },
  });

  const addMutation = useMutation({
    mutationFn: (newServer: any) => api.post('/servers', newServer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success("Server added successfully.");
    },
    onError: (err: any) => toast.error(`Failed to add server: ${err.message}`)
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: number; payload: any }) =>
      api.put(`/servers/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setIsDialogOpen(false);
      setEditingServer(null);
      resetForm();
      toast.success("Server updated successfully.");
    },
    onError: (err: any) => toast.error(`Failed to update server: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/servers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success("Server deleted.");
    },
    onError: (err: any) => toast.error(`Failed to delete server: ${err.message}`)
  });

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      api_port: 10007,
      api_login: 'admin',
      api_password: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingServer) {
      editMutation.mutate({ id: editingServer.id, payload: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleEditOpen = (server: Server) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      host: server.host,
      api_port: server.api_port,
      api_login: server.api_login,
      api_password: '', 
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      deleteMutation.mutate(pendingDelete.id);
      setPendingDelete(null);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading servers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">FNM Instances</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your FastNetMon Advanced servers</p>
        </div>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          onClick={() => {
            setEditingServer(null);
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Server
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingServer ? 'Edit FNM Instance' : 'Add New FNM Instance'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Friendly Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Edge-01" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="host">Host / IP</Label>
                  <Input 
                    id="host" 
                    placeholder="10.0.0.1" 
                    value={formData.host}
                    onChange={(e) => setFormData({...formData, host: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="port">API Port</Label>
                  <Input 
                    id="port" 
                    type="number" 
                    value={formData.api_port}
                    onChange={(e) => setFormData({...formData, api_port: parseInt(e.target.value)})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login">API Login</Label>
                  <Input 
                    id="login" 
                    value={formData.api_login}
                    onChange={(e) => setFormData({...formData, api_login: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">API Password {editingServer && '(Leave blank to keep current)'}</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.api_password}
                  onChange={(e) => setFormData({...formData, api_password: e.target.value})}
                  required={!editingServer} 
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addMutation.isPending || editMutation.isPending}>
                  {addMutation.isPending || editMutation.isPending ? 'Saving...' : 'Save Instance'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No servers added yet.
                  </TableCell>
                </TableRow>
              ) : (
                servers?.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell>
                      {server.is_active ? (
                        <Badge variant="outline" className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 gap-1">
                          <XCircle className="w-3 h-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{server.name}</TableCell>
                    <TableCell>{server.host}</TableCell>
                    <TableCell>{server.api_port}</TableCell>
                    <TableCell>{server.api_login}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => handleEditOpen(server)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => setPendingDelete(server)}
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

      <Dialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700 dark:text-red-400">Confirm Server Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 dark:text-slate-300 py-4">
            Are you sure you want to remove the server <span className="font-bold">"{pendingDelete?.name}"</span> ({pendingDelete?.host})?
            This will stop the GUI from monitoring this instance.
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
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Remove Server'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServersPage;
