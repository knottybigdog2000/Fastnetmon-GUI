import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, ShieldAlert, ArrowUpRight, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Server {
  id: number;
  name: string;
  host: string;
  is_active: number;
}

const DashboardPage: React.FC = () => {
  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await api.get('/servers');
      return response.data as Server[];
    },
  });

  const activeServers = useMemo(() => servers?.filter(s => s.is_active) || [], [servers]);
  const primaryServerId = activeServers[0]?.id;

  // 2. Fetch traffic stats (Host Counters)
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

  // 2.1 Fetch Global Traffic (From hostgroup_counters_total)
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

  // 3. Blackholes
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

  // 4. FlowSpec Rules
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

  const extractArray = (data: any) => {
    if (Array.isArray(data)) return data;
    if (data?.values && Array.isArray(data.values)) return data.values;
    if (data?.value && Array.isArray(data.value)) return data.value;
    return [];
  };

  const processedHosts = useMemo(() => extractArray(rawHostsData), [rawHostsData]);
  const processedBans = useMemo(() => extractArray(rawBhData), [rawBhData]);
  const processedFlowSpecs = useMemo(() => extractArray(rawFsData), [rawFsData]);

  // Use the EXACT fields from the API logs provided
  const getBps = (host: any) => {
    if (!host) return 0;
    // API returns 'incoming_bytes' which is a byte count, convert to bits
    return Number(host.incoming_bytes || 0) * 8;
  };

  const getPps = (host: any) => {
    if (!host) return 0;
    return Number(host.incoming_packets || 0);
  };

  // Determine Global Totals (Prefer hostgroup_counters_total, fallback to sum)
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
        <Activity className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">No Servers Connected</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Live Dashboard</h1>
          <p className="text-slate-500">Monitoring {activeServers[0].name}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          LIVE UPDATES
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Throughput</CardTitle>
            <Zap className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBps(totalBps)}</div>
            <p className="text-xs text-slate-500 mt-1">Full Server Traffic</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Packet Rate</CardTitle>
            <Activity className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPps(totalPps)}</div>
            <p className="text-xs text-slate-500 mt-1">Total PPS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Bans</CardTitle>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedBans.length}</div>
            <p className="text-xs text-slate-500 mt-1">BGP Blackholes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">FlowSpec Rules</CardTitle>
            <Zap className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedFlowSpecs.length}</div>
            <p className="text-xs text-slate-500 mt-1">Layer 7/Filtering</p>
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
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-slate-500">No traffic detected.</TableCell></TableRow>
                ) : (
                  processedHosts.slice(0, 10).map((host: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{host.host || host.ip || 'Unknown'}</TableCell>
                      <TableCell className="text-right font-medium text-slate-700 text-xs">{formatBps(getBps(host))}</TableCell>
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
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-slate-500">No active blackholes.</TableCell></TableRow>
                ) : (
                  processedBans.map((bh: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{bh.ip || bh.uuid || 'N/A'}</TableCell>
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
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-slate-500">No active FlowSpecs.</TableCell></TableRow>
                ) : (
                  processedFlowSpecs.map((fs: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs truncate max-w-[120px]">
                        {fs.destination_prefix || 'Global'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-orange-100 text-orange-700 text-[10px] h-5 hover:bg-orange-100">
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
