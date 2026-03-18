import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
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

interface Server {
  id: number;
  name: string;
  host: string;
  api_port: number;
  api_login: string;
  is_active: number;
}

const ServersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);

  // Form states
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
      setIsAddOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/servers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
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
    addMutation.mutate(formData);
  };

  if (isLoading) return <div>Loading servers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">FNM Instances</h1>
          <p className="text-slate-500">Manage your FastNetMon Advanced servers</p>
        </div>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="w-4 h-4" /> Add Server
        </Button>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New FNM Instance</DialogTitle>
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
                <Label htmlFor="password">API Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.api_password}
                  onChange={(e) => setFormData({...formData, api_password: e.target.value})}
                  required 
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Saving...' : 'Save Instance'}
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
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No servers added yet.
                  </TableCell>
                </TableRow>
              ) : (
                servers?.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell>
                      {server.is_active ? (
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200 gap-1">
                          <XCircle className="w-3 h-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{server.name}</TableCell>
                    <TableCell>{server.host}</TableCell>
                    <TableCell>{server.api_port}</TableCell>
                    <TableCell>{server.api_login}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" className="text-slate-500 hover:text-indigo-600">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-500 hover:text-red-600"
                        onClick={() => deleteMutation.mutate(server.id)}
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
  );
};

export default ServersPage;
