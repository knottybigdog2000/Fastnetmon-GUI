import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, ShieldAlert, ArrowUpRight, Zap, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { HostCounter, BlackholeRule, FlowSpecRule, Server } from '@/types/fnm';

const DashboardPage: React.FC = () => {
  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await api.get('/servers');
      return response.data as Server[];
    },
  });

  const activeServers = useMemo(() => servers?.filter(s => s.is_active) || [], [servers]);
  const [primaryServerId, setPrimaryServerId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (activeServers.length > 0 && primaryServerId === undefined) {
      setPrimaryServerId(activeServers[0].id);
    }
  }, [activeServers, primaryServerId]);

  const selectedServer = useMemo(() => 
    activeServers.find(s => s.id === primaryServerId) || activeServers[0],
  [activeServers, primaryServerId]);

  
  const { data: rawHostsData, isLoading: hostsLoading } = useQuery({
    queryKey: ['topHosts', primaryServerId],
    queryFn: async () => {
      if (!primaryServerId) return [];
      try {
        const response = await api.get(`/proxy/${primaryServerId}/host_counters`);
        return response.data;
      } catch (e) {
        return [];
      }
    },
    enabled: !!primaryServerId,
    refetchInterval: 5000,
  });

  
  const { data: rawGlobalData } = useQuery({
    queryKey: ['globalTotal', primaryServerId],
    queryFn: async () => {
      if (!primaryServerId) return null;
      try {
        const response = await api.get(`/proxy/${primaryServerId}/hostgroup_counters_total`);
        return response.data;
      } catch (e) { return null; }
    },
    enabled: !!primaryServerId,
    refetchInterval: 5000,
  });

  
  const { data: rawBhData, isLoading: bhLoading } = useQuery({
    queryKey: ['blackholes', primaryServerId],
    queryFn: async () => {
      if (!primaryServerId) return [];
      try {
        const response = await api.get(`/proxy/${primaryServerId}/blackhole`);
        return response.data;
      } catch (e) { return []; }
    },
    enabled: !!primaryServerId,
    refetchInterval: 5000,
  });

  
  const { data: rawFsData, isLoading: fsLoading } = useQuery({
    queryKey: ['flowspecs', primaryServerId],
    queryFn: async () => {
      if (!primaryServerId) return [];
      try {
        const response = await api.get(`/proxy/${primaryServerId}/flowspec`);
        return response.data;
      } catch (e) { return []; }
    },
    enabled: !!primaryServerId,
    refetchInterval: 5000,
  });

  const extractArray = <T,>(data: any): T[] => {
    if (Array.isArray(data)) return data;
    if (data?.values && Array.isArray(data.values)) return data.values;
    if (data?.value && Array.isArray(data.value)) return data.value;
    return [];
  };

  const processedHosts = useMemo(() => extractArray<HostCounter>(rawHostsData), [rawHostsData]);
  const processedBans = useMemo(() => extractArray<BlackholeRule>(rawBhData), [rawBhData]);
  const processedFlowSpecs = useMemo(() => extractArray<FlowSpecRule>(rawFsData), [rawFsData]);

  
  const getBps = (host: HostCounter | undefined) => {
    if (!host) return 0;
    
    return Number(host.incoming_bytes || 0) * 8;
  };

  const getPps = (host: HostCounter | undefined) => {
    if (!host) return 0;
    return Number(host.incoming_packets || 0);
  };

  
  const totalBps = useMemo(() => {
    if (rawGlobalData?.values && Array.isArray(rawGlobalData.values) && rawGlobalData.values.length > 0) {
      return getBps(rawGlobalData.values[0]);
    }
    return processedHosts.reduce((acc, h) => acc + getBps(h), 0);
  }, [rawGlobalData, processedHosts]);

  const totalPps = useMemo(() => {
    if (rawGlobalData?.values && Array.isArray(rawGlobalData.values) && rawGlobalData.values.length > 0) {
      return getPps(rawGlobalData.values[0]);
    }
    return processedHosts.reduce((acc, h) => acc + getPps(h), 0);
  }, [rawGlobalData, processedHosts]);

  const formatBps = (bps: number) => {
    if (bps >= 1000000000) return `${(bps / 1000000000).toFixed(2)} Gbps`;
    if (bps >= 1000000) return `${(bps / 1000000).toFixed(2)} Mbps`;
    if (bps >= 1000) return `${(bps / 1000).toFixed(2)} Kbps`;
    return `${bps} bps`;
  };

  const formatPps = (pps: number) => {
    if (pps >= 1000000) return `${(pps / 1000000).toFixed(2)} Mpps`;
    if (pps >= 1000) return `${(pps / 1000).toFixed(2)} Kpps`;
    return `${pps} pps`;
  };

  if (serversLoading) return <div className="p-8 text-center">Loading Dashboard...</div>;

  if (activeServers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Activity className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">No Servers Connected</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Live Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitoring <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedServer?.name}</span></p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {activeServers.length > 1 && (
            <div className="relative inline-block w-full md:w-64">
              <select 
                className="appearance-none w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all cursor-pointer dark:text-slate-200"
                value={primaryServerId}
                onChange={(e) => setPrimaryServerId(Number(e.target.value))}
              >
                {activeServers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.host})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}
          
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 px-3 py-1.5 rounded-full uppercase">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            Live Updates
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Throughput</CardTitle>
            <Zap className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatBps(totalBps)}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Full Server Traffic</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Packet Rate</CardTitle>
            <Activity className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatPps(totalPps)}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total PPS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Bans</CardTitle>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{processedBans.length}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">BGP Blackholes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">FlowSpec Rules</CardTitle>
            <Zap className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{processedFlowSpecs.length}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Layer 7/Filtering</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Top Hosts (Real-time)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Throughput</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostsLoading ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4">Loading...</TableCell></TableRow>
                ) : processedHosts.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-slate-500 dark:text-slate-400">No traffic detected.</TableCell></TableRow>
                ) : (
                  processedHosts.slice(0, 10).map((host: HostCounter, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs text-slate-900 dark:text-slate-100">{host.host || host.ip || 'Unknown'}</TableCell>
                      <TableCell className="text-right font-medium text-slate-700 dark:text-slate-200 text-xs">{formatBps(getBps(host))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Active Blackholes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bhLoading ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4">Loading...</TableCell></TableRow>
                ) : processedBans.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-slate-500 dark:text-slate-400">No active blackholes.</TableCell></TableRow>
                ) : (
                  processedBans.map((bh: BlackholeRule, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs text-slate-900 dark:text-slate-100">{bh.ip || bh.uuid || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive" className="text-[10px] h-5">BGP</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>FlowSpec Rules</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fsLoading ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4">Loading...</TableCell></TableRow>
                ) : processedFlowSpecs.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-slate-500 dark:text-slate-400">No active FlowSpecs.</TableCell></TableRow>
                ) : (
                  processedFlowSpecs.map((fs: FlowSpecRule, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs truncate max-w-[120px] text-slate-900 dark:text-slate-100">
                        {fs.destination_prefix || 'Global'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] h-5 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-0">
                          {fs.action_type || 'discard'}
                        </Badge>
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
  );
};

export default DashboardPage;
