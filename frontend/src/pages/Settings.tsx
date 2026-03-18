import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Search, HardDrive } from 'lucide-react';

interface Server {
  id: number;
  name: string;
}

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [editState, setEditState] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Mitigation / Ban');

  // Fetch servers for the dropdown
  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await api.get('/servers');
      return response.data as Server[];
    },
  });

  // Set initial selected server
  React.useEffect(() => {
    if (servers && servers.length > 0 && !selectedServerId) {
      setSelectedServerId(servers[0].id.toString());
    }
  }, [servers, selectedServerId]);

  // Fetch Main Settings for the selected server
  const { data: settings, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['settings', selectedServerId],
    queryFn: async () => {
      if (!selectedServerId) return null;
      const response = await api.get(`/proxy/${selectedServerId}/main`);
      if (response.data && response.data.object) {
        setEditState(response.data.object);
        return response.data.object;
      }
      return null;
    },
    enabled: !!selectedServerId,
  });

  const saveMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      return api.put(`/proxy/${selectedServerId}/main`, updatedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', selectedServerId] });
      alert("Settings saved successfully.");
    },
    onError: (err: any) => {
      alert(`Failed to save settings: ${err.message}`);
    }
  });

  const handleToggleChange = (key: string, checked: boolean) => {
    setEditState((prev: any) => ({ ...prev, [key]: checked }));
  };

  const handleInputChange = (key: string, value: string | number | string[]) => {
    setEditState((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(editState);
  };

  // Group Settings logically
  const settingGroups = useMemo(() => {
    if (!settings) return {};

    const groups: Record<string, string[]> = {
      'Mitigation / Ban': [],
      'BGP / GoBGP': [],
      'Capture / Traffic': [],
      'Metrics / DB': [],
      'Notifications': [],
      'Advanced / System': [],
    };

    const keys = Object.keys(settings).sort();

    keys.forEach(key => {
      if (!key) return;
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('ban') || lowerKey.includes('threshold') || lowerKey.includes('flow_spec') || lowerKey.includes('hostgroup')) {
        groups['Mitigation / Ban'].push(key);
      } else if (lowerKey.includes('bgp') || lowerKey.includes('mikrotik') || lowerKey.includes('vyos') || lowerKey.includes('asn')) {
        groups['BGP / GoBGP'].push(key);
      } else if (lowerKey.includes('af_packet') || lowerKey.includes('netflow') || lowerKey.includes('sflow') || lowerKey.includes('pcap') || lowerKey.includes('xdp') || lowerKey.includes('interface') || lowerKey.includes('networks_list')) {
        groups['Capture / Traffic'].push(key);
      } else if (lowerKey.includes('clickhouse') || lowerKey.includes('influxdb') || lowerKey.includes('graphite') || lowerKey.includes('redis') || lowerKey.includes('prometheus') || lowerKey.includes('kafka') || lowerKey.includes('traffic_db')) {
        groups['Metrics / DB'].push(key);
      } else if (lowerKey.includes('email') || lowerKey.includes('slack') || lowerKey.includes('telegram') || lowerKey.includes('notify_script')) {
        groups['Notifications'].push(key);
      } else {
        groups['Advanced / System'].push(key);
      }
    });

    return groups;
  }, [settings]);

  if (!servers || servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
        <HardDrive className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">No Servers Connected</h2>
        <p className="text-slate-500 mt-2 max-w-md">Please add a FastNetMon server in the Servers tab to manage its settings.</p>
      </div>
    );
  }

  const renderField = (key: string) => {
    if (!key) return null;
    const val = editState[key];
    const typeofVal = typeof val;

    // Filter by search term safely
    if (searchTerm && key && !key.toLowerCase().includes(searchTerm.toLowerCase())) {
      return null;
    }

    if (typeofVal === 'boolean') {
      return (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-100 last:border-0 gap-4 hover:bg-slate-50 px-4 rounded transition-colors">
          <div className="flex-1">
            <Label className="text-slate-800 font-semibold cursor-pointer text-sm" htmlFor={`switch-${key}`}>{key}</Label>
            <p className="text-xs text-slate-500 mt-0.5">Enable or disable {key.replace(/_/g, ' ')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              id={`switch-${key}`}
              type="checkbox" 
              className="sr-only peer" 
              checked={!!val} 
              onChange={(e) => handleToggleChange(key, e.target.checked)} 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      );
    }

    if (typeofVal === 'number') {
      return (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-100 last:border-0 gap-4 hover:bg-slate-50 px-4 rounded transition-colors">
          <div className="flex-1">
            <Label className="text-slate-800 font-semibold text-sm">{key}</Label>
            <p className="text-xs text-slate-500 mt-0.5">Numeric value for {key.replace(/_/g, ' ')}</p>
          </div>
          <Input 
            type="number" 
            value={val ?? 0} 
            onChange={(e) => handleInputChange(key, parseInt(e.target.value) || 0)} 
            className="w-full sm:w-64 bg-white border-slate-200 focus:ring-indigo-500"
            autoComplete="off"
            data-lpignore="true"
          />
        </div>
      );
    }

    if (Array.isArray(val)) {
      return (
        <div key={key} className="flex flex-col py-4 border-b border-slate-100 last:border-0 gap-3 hover:bg-slate-50 px-4 rounded transition-colors">
          <div>
            <Label className="text-slate-800 font-semibold text-sm">{key}</Label>
            <p className="text-xs text-slate-500 mt-0.5">Comma separated list of items.</p>
          </div>
          <textarea 
            className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={val.join(',\n')} 
            onChange={(e) => handleInputChange(key, e.target.value.split(',').map(s => s.trim()))} 
            placeholder="Item1, Item2, Item3..."
            autoComplete="off"
            data-lpignore="true"
          />
        </div>
      );
    }

    // Default to text (handling null/undefined safely)
    const safeKeyStr = String(key || '');
    const isSecret = safeKeyStr.includes('password') || safeKeyStr.includes('token');
    return (
      <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-100 last:border-0 gap-4 hover:bg-slate-50 px-4 rounded transition-colors">
        <div className="flex-1">
          <Label className="text-slate-800 font-semibold text-sm">{key}</Label>
          <p className="text-xs text-slate-500 mt-0.5">Text string configuration.</p>
        </div>
        <Input 
          type={isSecret ? "password" : "text"} 
          value={val !== null && val !== undefined ? String(val) : ''} 
          onChange={(e) => handleInputChange(key, e.target.value)} 
          placeholder={isSecret ? '********' : 'Not set'}
          className="w-full sm:w-[400px] bg-white border-slate-200 focus:ring-indigo-500"
          autoComplete="new-password"
          data-lpignore="true"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Advanced Settings</h1>
          <p className="text-slate-500 mt-1">Full configuration access for {servers.find(s => s.id.toString() === selectedServerId)?.name}</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Search keys..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="flex h-9 w-full sm:w-[200px] items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedServerId} 
            onChange={(e) => setSelectedServerId(e.target.value)}
          >
            <option value="" disabled>Select Server</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id.toString()}>
                {server.name}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="h-9 px-3">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending || isLoading} className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm w-full sm:w-auto">
            <Save className="w-4 h-4" /> Save Config
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : settings ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Vertical Sidebar Navigation for Groups */}
          <div className="w-full lg:w-64 shrink-0">
            <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-32">
              {Object.keys(settingGroups).map(group => {
                const isActive = activeTab === group;
                return (
                  <button
                    key={group}
                    onClick={() => setActiveTab(group)}
                    className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent'
                    }`}
                  >
                    {group}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      ({settingGroups[group].length})
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Active Group Settings Form */}
          <div className="flex-1 min-w-0">
            {Object.entries(settingGroups).map(([group, keys]) => {
              if (group !== activeTab) return null;
              
              const hasMatches = keys.some(k => k && k.toLowerCase().includes(searchTerm.toLowerCase()));
              if (searchTerm && !hasMatches) {
                return (
                  <div key={group} className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
                    No matching settings found in {group}.
                  </div>
                );
              }

              return (
                <Card key={group} className="border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5">
                    <CardTitle className="text-xl text-slate-900">{group}</CardTitle>
                    <CardDescription>Manage {keys.length} configuration parameters.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {keys.map(key => renderField(key))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed max-w-2xl mx-auto">
          Failed to load settings. Ensure the server API is reachable.
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
