'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Search,
  Loader2,
  Calendar,
  User,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Terminal,
} from 'lucide-react';

type AuditLog = {
  id: number;
  action: string;
  userId: number | null;
  userName: string | null;
  userUsername: string | null;
  createdAt: string;
  ipAddress: string;
  affectedRecord: string | null;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, search]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({ page, limit, search });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Audit Logs</h1>
        <p className="text-sm text-slate-400">Complete, tamper-evident audit trail of system activities</p>
      </div>

      {/* Filter and search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by action, user, IP, or record..."
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Audit Logs list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="px-4 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">IP Address</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">Affected Record</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-slate-500">
                    No audit logs matching search filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-800/60 hover:bg-slate-800/10">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-amber-500" />
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {log.userName ? (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{log.userName}</span>
                          <span className="text-slate-500 text-[10px]">({log.userUsername})</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{log.ipAddress}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono max-w-[240px] truncate">
                      {log.affectedRecord || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-slate-800 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-sans">
              Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total} logs
            </p>
            <div className="flex items-center space-x-2 font-sans">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
