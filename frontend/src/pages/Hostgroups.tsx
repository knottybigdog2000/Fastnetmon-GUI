import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Users as UsersIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  ShieldCheck, 
  RefreshCw,
  Save
} from 'lucide-react';
import { Hostgroup, Server } from '@/types/fnm';

const HostgroupsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHostgroup, setEditingServer] = useState<Hostgroup | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Hostgroup | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Hostgroup>>({
    name: '',
    calculation_method: 'per_host',
    networks: [],
    enable_ban: true,
    threshold_mbps: 1000,
    threshold_pps: 100000,
    threshold_flows: 5000,
  });

  
  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await api.get('/servers');
      return response.data as Server[];
    },
  });

  React.useEffect(() => {
    if (servers && servers.length > 0 && !selectedServerId) {
      setSelectedServerId(servers[0].id.toString());
    }
  }, [servers, selectedServerId]);

  
  const { data: hostgroups, isLoading } = useQuery({
    queryKey: ['hostgroups', selectedServerId],
    queryFn: async () => {
      if (!selectedServerId) return [];
      const response = await api.get(`/proxy/${selectedServerId}/hostgroup`);
      
      if (response.data && response.data.values) {
        return response.data.values as Hostgroup[];
      }
      return [];
    },
    enabled: !!selectedServerId,
  });

  
  const saveMutation = useMutation({
    mutationFn: (data: Hostgroup) => api.post(`/proxy/${selectedServerId}/hostgroup`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostgroups', selectedServerId] });
      setIsDialogOpen(false);
      toast.success("Hostgroup saved successfully.");
    },
    onError: (err: any) => toast.error(`Failed to save hostgroup: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => api.delete(`/proxy/${selectedServerId}/hostgroup/${name}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostgroups', selectedServerId] });
      toast.success("Hostgroup deleted.");
    },
    onError: (err: any) => toast.error(`Failed to delete: ${err.message}`)
  });

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      await api.put(`/proxy/${selectedServerId}/commit`);
      toast.success("Changes committed to FastNetMon.");
    } catch (err: any) {
      toast.error(`Commit failed: ${err.message}`);
    } finally {
      setIsCommitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      calculation_method: 'per_host',
      networks: [],
      enable_ban: true,
      threshold_mbps: 1000,
      threshold_pps: 100000,
      threshold_flows: 5000,
    });
  };

  const handleEditOpen = (hg: Hostgroup) => {
    setEditingServer(hg);
    setFormData(hg);
    setIsDialogOpen(true);
  };

  const filteredHostgroups = useMemo(() => {
    return hostgroups?.filter(hg => 
      hg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hg.networks.some(n => n.includes(searchTerm))
    ) || [];
  }, [hostgroups, searchTerm]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Hostgroups</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Define thresholds and subnets for traffic monitoring</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            className="flex h-10 w-full md:w-[200px] items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
            value={selectedServerId} 
            onChange={(e) => setSelectedServerId(e.target.value)}
          >
            {servers?.map((server) => (
              <option key={server.id} value={server.id.toString()}>{server.name}</option>
            ))}
          </select>
          
          {isAdmin && (
            <>
              <Button
                onClick={handleCommit}
                disabled={isCommitting || !selectedServerId}
                variant="outline"
                className="border-orange-200 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                {isCommitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Commit Changes
              </Button>

              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                onClick={() => {
                  setEditingServer(null);
                  resetForm();
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> New Group
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <Search className="w-5 h-5 text-slate-400" />
        <Input 
          placeholder="Search groups or networks..." 
          className="border-none shadow-none focus-visible:ring-0 bg-transparent text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">Loading hostgroups...</div>
        ) : filteredHostgroups.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            No hostgroups found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredHostgroups.map((hg) => (
              <Card key={hg.name} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl dark:text-slate-100">{hg.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
                        {hg.calculation_method.replace('_', ' ')}
                      </Badge>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleEditOpen(hg)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => setPendingDelete(hg)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Thresholds</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-center">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{hg.threshold_mbps || 0}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Mbps</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-center">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{(hg.threshold_pps || 0) / 1000}k</div>
                        <div className="text-[10px] text-slate-500 uppercase">Pps</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-center">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{hg.threshold_flows || 0}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Flows</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Networks ({hg.networks?.length || 0})</div>
                      <ShieldCheck className={`w-4 h-4 ${hg.enable_ban ? 'text-green-500' : 'text-slate-300'}`} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {hg.networks?.map((net, i) => (
                        <code key={i} className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-[10px] rounded border border-indigo-100 dark:border-indigo-900/30">
                          {net}
                        </code>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">{editingHostgroup ? `Edit Hostgroup: ${editingHostgroup.name}` : 'Create New Hostgroup'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Group Name</Label>
                <Input 
                  placeholder="customers_vlan_10" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  disabled={!!editingHostgroup}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Calculation Method</Label>
                <select 
                  className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm dark:text-slate-200"
                  value={formData.calculation_method}
                  onChange={e => setFormData({...formData, calculation_method: e.target.value as any})}
                >
                  <option value="per_host">Per Host (Individual IP thresholds)</option>
                  <option value="total">Total (Threshold for entire subnet)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Networks (One per line)</Label>
                <textarea 
                  className="w-full min-h-[120px] p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-mono dark:text-slate-200"
                  placeholder="1.2.3.0/24&#10;4.5.6.0/24"
                  value={formData.networks?.join('\n')}
                  onChange={e => setFormData({...formData, networks: e.target.value.split('\n').filter(n => n.trim())})}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4 border border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold uppercase text-slate-400">Threshold Settings</div>
                <div className="space-y-2">
                  <Label className="text-xs dark:text-slate-300">MBPS Threshold</Label>
                  <Input type="number" value={formData.threshold_mbps} onChange={e => setFormData({...formData, threshold_mbps: Number(e.target.value)})} className="h-8 dark:bg-slate-900" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs dark:text-slate-300">PPS Threshold</Label>
                  <Input type="number" value={formData.threshold_pps} onChange={e => setFormData({...formData, threshold_pps: Number(e.target.value)})} className="h-8 dark:bg-slate-900" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs dark:text-slate-300">Flows Threshold</Label>
                  <Input type="number" value={formData.threshold_flows} onChange={e => setFormData({...formData, threshold_flows: Number(e.target.value)})} className="h-8 dark:bg-slate-900" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Label className="dark:text-slate-300">Enable BGP Ban</Label>
                  <input 
                    type="checkbox" 
                    checked={formData.enable_ban} 
                    onChange={e => setFormData({...formData, enable_ban: e.target.checked})}
                    className="w-4 h-4 accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => saveMutation.mutate(formData as Hostgroup)}>
              {saveMutation.isPending ? 'Saving...' : 'Save Hostgroup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700 dark:text-red-400">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-slate-600 dark:text-slate-300">
            Are you sure you want to delete the hostgroup <span className="font-bold">"{pendingDelete?.name}"</span>?
            This will remove all associated thresholds and network memberships.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (pendingDelete) {
                deleteMutation.mutate(pendingDelete.name);
                setPendingDelete(null);
              }
            }}>
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostgroupsPage;
