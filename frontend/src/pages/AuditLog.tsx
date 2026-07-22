import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollText, ShieldAlert, Server, UserCog, LogIn } from 'lucide-react';

interface AuditEntry {
  id: number;
  username: string | null;
  action: string;
  details: string | null;
  success: number;
  ip: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  'fnm:put': { label: 'FNM Change', icon: ShieldAlert },
  'fnm:post': { label: 'FNM Change', icon: ShieldAlert },
  'fnm:delete': { label: 'FNM Remove', icon: ShieldAlert },
  'server:create': { label: 'Server Added', icon: Server },
  'server:update': { label: 'Server Updated', icon: Server },
  'server:delete': { label: 'Server Removed', icon: Server },
  'user:create': { label: 'User Created', icon: UserCog },
  'user:delete': { label: 'User Deleted', icon: UserCog },
  'user:password': { label: 'Password Change', icon: UserCog },
  'auth:login': { label: 'Login', icon: LogIn },
};

const formatTime = (utc: string) => {
  // SQLite CURRENT_TIMESTAMP is UTC without a timezone marker
  const date = new Date(utc.includes('T') ? utc : utc.replace(' ', 'T') + 'Z');
  return date.toLocaleString();
};

const AuditLogPage: React.FC = () => {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: async () => {
      const response = await api.get('/audit?limit=300');
      return response.data as AuditEntry[];
    },
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
          <ScrollText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          Audit Log
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Who did what, and when — logins, user changes, and every mitigation action
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 py-4">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last {entries?.length ?? 0} events, newest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-950 sticky top-0">
              <TableRow>
                <TableHead className="whitespace-nowrap">Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    Loading audit log...
                  </TableCell>
                </TableRow>
              ) : !entries || entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No activity recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const meta = ACTION_LABELS[entry.action] || { label: entry.action, icon: ScrollText };
                  const Icon = meta.icon;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {formatTime(entry.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.username || <span className="text-slate-400 italic">unknown</span>}
                        {entry.ip && (
                          <span className="block text-xs text-slate-400 dark:text-slate-500 font-normal">{entry.ip}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300 font-mono break-all">
                        {entry.details || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.success ? (
                          <Badge variant="outline" className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30">
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30">
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogPage;
