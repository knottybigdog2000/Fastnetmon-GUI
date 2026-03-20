import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Search, ShieldBan, Trash2, Plus, Zap } from 'lucide-react';

interface Server {
  id: number;
  name: string;
  host: string;
}

const MitigationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'blackhole' | 'flowspec'>('blackhole');
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [ipToBlock, setIpToBlock] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  
  const [flowSpec, setFlowSpec] = useState({
    destination_prefix: '',
    source_prefix: '',
    protocols: ['udp'],
    destination_ports: '',
    source_ports: '',
    action_type: 'discard'
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

  
  const { data: blackholes, isLoading: bhLoading } = useQuery({
    queryKey: ['blackholes', selectedServerId],
    queryFn: async () => {
      if (!selectedServerId) return [];
      try {
        const response = await api.get(`/proxy/${selectedServerId}/blackhole`);
        let data = response.data;
        if (data && data.values) data = data.values;
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!selectedServerId,
    refetchInterval: 5000,
  });

  
  const { data: flowspecs, isLoading: fsLoading } = useQuery({
    queryKey: ['flowspecs', selectedServerId],
    queryFn: async () => {
      if (!selectedServerId) return [];
      try {
        const response = await api.get(`/proxy/${selectedServerId}/flowspec`);
        let data = response.data;
        if (data && data.values) data = data.values;
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!selectedServerId,
    refetchInterval: 5000,
  });

  
  const blockMutation = useMutation({
    mutationFn: async (ip: string) => {
      return api.post(`/proxy/${selectedServerId}/blackhole`, { value: ip });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blackholes', selectedServerId] });
      setIpToBlock('');
      alert("IP successfully blackholed.");
    },
    onError: (err: any) => alert(`Failed to block IP: ${err.message}`)
  });

  const flowSpecMutation = useMutation({
    mutationFn: async (payload: any) => {
      const cleaned: any = { ...payload };
      if (cleaned.destination_ports) cleaned.destination_ports = cleaned.destination_ports.split(',').map((p: string) => parseInt(p.trim())).filter((p: any) => !isNaN(p));
      if (cleaned.source_ports) cleaned.source_ports = cleaned.source_ports.split(',').map((p: string) => parseInt(p.trim())).filter((p: any) => !isNaN(p));
      if (!cleaned.source_prefix) delete cleaned.source_prefix;
      
      return api.post(`/proxy/${selectedServerId}/flowspec`, { object: cleaned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flowspecs', selectedServerId] });
      alert("FlowSpec rule applied.");
    },
    onError: (err: any) => alert(`Failed to apply FlowSpec: ${err.message}`)
  });

  const unblockMutation = useMutation({
    mutationFn: async ({ type, uuid }: { type: 'blackhole' | 'flowspec', uuid: string }) => {
      return api.delete(`/proxy/${selectedServerId}/${type}/${uuid}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.type === 'blackhole' ? 'blackholes' : 'flowspecs', selectedServerId] });
      alert("Rule removed successfully.");
    },
    onError: (err: any) => alert(`Failed to remove rule: ${err.message}`)
  });

  const filteredBans = blackholes?.filter((bh: any) => {
    const ip = String(bh.ip || '').toLowerCase();
    return ip.includes(searchTerm.toLowerCase());
  }) || [];

  const filteredFlowSpecs = flowspecs?.filter((fs: any) => {
    const dest = String(fs.destination_prefix || '').toLowerCase();
    return dest.includes(searchTerm.toLowerCase());
  }) || [];

  if (!servers || servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
        <ShieldAlert className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">No Servers Connected</h2>
        <p className="text-slate-500 mt-2 max-w-md">Please add a FastNetMon server to manage mitigations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mitigation Center</h1>
          <p className="text-slate-500 mt-1">Manage network-wide traffic drops and FlowSpec rules</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search active rules..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="flex h-9 w-full md:w-[250px] items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedServerId} 
            onChange={(e) => setSelectedServerId(e.target.value)}
          >
            {servers.map((server) => (
              <option key={server.id} value={server.id.toString()}>{server.name} ({server.host})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-32">
            <button
              onClick={() => setActiveTab('blackhole')}
              className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-3 ${
                activeTab === 'blackhole' 
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent'
              }`}
            >
              <ShieldBan className="w-4 h-4" />
              Blackhole (BGP)
            </button>
            <button
              onClick={() => setActiveTab('flowspec')}
              className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-3 ${
                activeTab === 'flowspec' 
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent'
              }`}
            >
              <Zap className="w-4 h-4" />
              FlowSpec Rules
            </button>
          </nav>
        </div>

        {}
        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === 'blackhole' ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-1 h-fit border-slate-200 shadow-sm">
                <CardHeader className="bg-red-50/50 border-b border-red-100">
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <ShieldBan className="w-4 h-4" /> Manual Blackhole
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target IP Address</Label>
                    <Input 
                      placeholder="e.g. 1.2.3.4" 
                      value={ipToBlock}
                      onChange={(e) => setIpToBlock(e.target.value)}
                      className="border-slate-200"
                    />
                  </div>
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    onClick={() => blockMutation.mutate(ipToBlock)}
                    disabled={!ipToBlock || blockMutation.isPending}
                  >
                    {blockMutation.isPending ? 'Applying...' : 'Apply Blackhole'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="xl:col-span-2 border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100">
                  <CardTitle>Active BGP Bans</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Target IP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bhLoading ? <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow> :
                      filteredBans.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-12 text-slate-500">No active blackholes found.</TableCell></TableRow> :
                      filteredBans.map((bh: any) => (
                        <TableRow key={bh.uuid}>
                          <TableCell className="font-mono font-medium">{bh.ip}</TableCell>
                          <TableCell><Badge variant="destructive" className="bg-red-100 text-red-700 border-0">Blocked</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600" onClick={() => unblockMutation.mutate({ type: 'blackhole', uuid: bh.uuid })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-1 h-fit border-slate-200 shadow-sm">
                <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                  <CardTitle className="text-indigo-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New FlowSpec Rule
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dest. Prefix</Label>
                    <Input value={flowSpec.destination_prefix} onChange={e => setFlowSpec({...flowSpec, destination_prefix: e.target.value})} placeholder="1.2.3.4/32" className="border-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Protocol</Label>
                      <select className="w-full border border-slate-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={flowSpec.protocols[0]} onChange={e => setFlowSpec({...flowSpec, protocols: [e.target.value]})}>
                        <option value="udp">UDP</option>
                        <option value="tcp">TCP</option>
                        <option value="icmp">ICMP</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Action</Label>
                      <select className="w-full border border-slate-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={flowSpec.action_type} onChange={e => setFlowSpec({...flowSpec, action_type: e.target.value})}>
                        <option value="discard">Discard</option>
                        <option value="rate-limit">Rate Limit</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Source Ports</Label>
                    <Input value={flowSpec.source_ports} onChange={e => setFlowSpec({...flowSpec, source_ports: e.target.value})} placeholder="53, 123" className="border-slate-200" />
                  </div>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={() => flowSpecMutation.mutate(flowSpec)}>
                    {flowSpecMutation.isPending ? 'Applying...' : 'Apply FlowSpec'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="xl:col-span-2 border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100">
                  <CardTitle>Active FlowSpec Rules</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Target</TableHead>
                      <TableHead>Protocol</TableHead>
                      <TableHead>Ports</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fsLoading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> :
                      filteredFlowSpecs.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500">No active FlowSpec rules found.</TableCell></TableRow> :
                      filteredFlowSpecs.map((fs: any) => (
                        <TableRow key={fs.uuid}>
                          <TableCell className="font-mono text-xs font-medium">{fs.destination_prefix}</TableCell>
                          <TableCell><Badge variant="outline" className="font-normal">{fs.protocols?.join(',')}</Badge></TableCell>
                          <TableCell className="text-xs text-slate-500">{fs.source_ports?.join(',') || '*'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600" onClick={() => unblockMutation.mutate({ type: 'flowspec', uuid: fs.uuid })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MitigationPage;
