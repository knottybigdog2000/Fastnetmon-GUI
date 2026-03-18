import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ShieldAlert, ShieldCheck, Search, ShieldBan, Trash2, Plus } from 'lucide-react';

interface Server {
  id: number;
  name: string;
}

const MitigationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [ipToBlock, setIpToBlock] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Servers
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

  // 2. Fetch Active Blackholes
  const { data: blackholes, isLoading } = useQuery({
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
    refetchInterval: 5000, // Poll every 5s
  });

  // 3. Block IP Mutation
  const blockMutation = useMutation({
    mutationFn: async (ip: string) => {
      // Send the object wrapped in "value" as FNM often expects
      // Using standard POST structure
      return api.post(`/proxy/${selectedServerId}/blackhole`, { ip });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blackholes', selectedServerId] });
      setIpToBlock('');
      alert("IP successfully blackholed.");
    },
    onError: (err: any) => {
      alert(`Failed to block IP: ${err.message}`);
    }
  });

  // 4. Unblock IP Mutation (Requires UUID)
  const unblockMutation = useMutation({
    mutationFn: async (uuid: string) => {
      return api.delete(`/proxy/${selectedServerId}/blackhole/${uuid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blackholes', selectedServerId] });
      alert("IP successfully unblocked.");
    },
    onError: (err: any) => {
      alert(`Failed to unblock IP: ${err.message}`);
    }
  });

  const handleBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipToBlock.trim()) return;
    if (confirm(`Are you sure you want to blackhole ${ipToBlock}? This will drop all traffic to/from this IP.`)) {
      blockMutation.mutate(ipToBlock.trim());
    }
  };

  const handleUnblock = (uuid: string, ip: string) => {
    if (confirm(`Are you sure you want to remove the blackhole for ${ip}?`)) {
      unblockMutation.mutate(uuid);
    }
  };

  const filteredBans = blackholes?.filter((bh: any) => {
    if (!searchTerm) return true;
    const ip = String(bh.ip || '').toLowerCase();
    const uuid = String(bh.uuid || '').toLowerCase();
    return ip.includes(searchTerm.toLowerCase()) || uuid.includes(searchTerm.toLowerCase());
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mitigation Center</h1>
          <p className="text-slate-500 mt-1">Manage manual blackholes and traffic drops</p>
        </div>
        
        <div className="flex gap-3 items-center w-full md:w-auto">
          <select 
            className="flex h-10 w-full sm:w-[250px] items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedServerId} 
            onChange={(e) => setSelectedServerId(e.target.value)}
          >
            <option value="" disabled>Select Target Node</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id.toString()}>
                {server.name} ({server.host})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Manual Block Action Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-red-50/50 border-b border-red-100">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <ShieldBan className="w-5 h-5" /> Trigger Manual Ban
              </CardTitle>
              <CardDescription className="text-red-600/70">
                Instantly drop all traffic for a specific host IP or CIDR via BGP.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleBlock} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ip">IP Address (IPv4 or IPv6)</Label>
                  <Input 
                    id="ip"
                    placeholder="e.g. 192.168.1.50" 
                    value={ipToBlock}
                    onChange={(e) => setIpToBlock(e.target.value)}
                    className="focus-visible:ring-red-500"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!ipToBlock.trim() || blockMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-white shadow-sm"
                >
                  {blockMutation.isPending ? 'Executing...' : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Apply Blackhole
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Active Mitigations</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">{blackholes?.length || 0}</h3>
                </div>
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Bans Table */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 py-4 bg-white">
              <div>
                <CardTitle>Active Blocklist</CardTitle>
                <CardDescription>Currently blackholed hosts</CardDescription>
              </div>
              <div className="relative w-64 hidden sm:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search IP or UUID..."
                  className="pl-9 h-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="w-[180px]">Target IP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">UUID</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                        Loading active bans...
                      </TableCell>
                    </TableRow>
                  ) : filteredBans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <ShieldCheck className="w-12 h-12 text-green-400 mb-3" />
                          <p className="text-slate-600 font-medium text-lg">No Active Mitigations</p>
                          <p className="text-slate-400 text-sm mt-1">
                            {searchTerm ? "No bans match your search query." : "Network traffic is flowing normally."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBans.map((bh: any) => (
                      <TableRow key={bh.uuid || bh.ip}>
                        <TableCell className="font-mono font-medium text-slate-900">
                          {bh.ip || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-0">
                            Blocked
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-400 hidden md:table-cell truncate max-w-[150px]">
                          {bh.uuid || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnblock(bh.uuid, bh.ip)}
                            disabled={unblockMutation.isPending || !bh.uuid}
                            className="text-slate-600 hover:text-green-700 hover:bg-green-50 hover:border-green-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Unban
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
    </div>
  );
};

export default MitigationPage;
