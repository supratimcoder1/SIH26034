import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, OverallStatus } from '../types';

const badgeColors: Record<OverallStatus, string> = {
  compliant: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  non_compliant: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
  review_required: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  insufficient_image_quality: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  pending: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  processing: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  failed: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'
};

const badgeLabels: Record<OverallStatus, string> = {
  compliant: 'Compliant', non_compliant: 'Non-Compliant', review_required: 'Review Required', insufficient_image_quality: 'Quality Issue', pending: 'Pending', processing: 'Processing', failed: 'Failed'
};

export function ScanTable({ rows, compact = false, loading = false }: { rows: Scan[]; compact?: boolean; loading?: boolean }) {
  const navigate = useNavigate();
  
  const fmt = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="w-full overflow-x-auto bg-white dark:bg-slate-900 transition-colors">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase transition-colors">
              <th className="px-6 py-4 font-semibold">Scan ID</th>
              <th className="px-6 py-4 font-semibold">Product / Manufacturer</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-center">Confidence</th>
              <th className="px-6 py-4 font-semibold">Scan Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-32"></div>
                </td>
                <td className="px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div></td>
                <td className="px-6 py-4"><div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full w-full max-w-[4rem] mx-auto"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 transition-colors">
        <p>No scans found.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-slate-900 transition-colors">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase transition-colors">
            <th className="px-6 py-4 font-semibold">Scan ID</th>
            <th className="px-6 py-4 font-semibold">Product / Manufacturer</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-center">Confidence</th>
            <th className="px-6 py-4 font-semibold">Scan Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
          {rows.map(s => {
            const conf = s.fields ? Math.round(
              Object.values(s.fields).reduce((a, f) => a + f.confidence, 0) /
              (Object.values(s.fields).length || 1) * 100
            ) : 0;
            
            return (
              <tr 
                key={s.id} 
                onClick={() => navigate(`/scans/${s.id}`)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {`Scan-${s.id.substring(0, 8).toUpperCase()}`}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <b className="block text-sm text-slate-900 dark:text-slate-200 mb-0.5">{s.product_name || 'Unknown'}</b>
                  <small className="block text-xs text-slate-500 dark:text-slate-400">{s.manufacturer || 'Pending details'}</small>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border transition-colors ${badgeColors[s.overall_status]}`}>
                      {badgeLabels[s.overall_status]}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden transition-colors">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${conf}%` }}></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-8 text-right">{conf}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{fmt(s.scan_date)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {!compact && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 transition-colors">
          <span>Showing <b>1–{rows.length}</b> of {rows.length} scans</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 bg-slate-900 dark:bg-slate-700 text-white rounded font-medium">1</button>
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
