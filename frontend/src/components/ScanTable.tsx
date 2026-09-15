import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, OverallStatus } from '../types';

const badgeColors: Record<OverallStatus, string> = {
  compliant: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  non_compliant: 'bg-rose-100 text-rose-700 border-rose-200',
  review_required: 'bg-amber-100 text-amber-700 border-amber-200',
  insufficient_image_quality: 'bg-slate-100 text-slate-700 border-slate-200',
  pending: 'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  failed: 'bg-red-100 text-red-700 border-red-200'
};

const badgeLabels: Record<OverallStatus, string> = {
  compliant: 'Compliant', non_compliant: 'Non-Compliant', review_required: 'Review Required', insufficient_image_quality: 'Quality Issue', pending: 'Pending', processing: 'Processing', failed: 'Failed'
};

export function ScanTable({ rows, compact = false }: { rows: Scan[]; compact?: boolean }) {
  const navigate = useNavigate();
  
  const fmt = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (!rows || rows.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No scans found.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-slate-50 border-y border-slate-100 text-xs font-bold text-slate-500 tracking-wider uppercase">
            <th className="px-6 py-4 font-semibold">Scan ID</th>
            <th className="px-6 py-4 font-semibold">Product / Manufacturer</th>
            <th className="px-6 py-4 font-semibold">Scan Date</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-center">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(s => {
            const conf = s.fields ? Math.round(
              Object.values(s.fields).reduce((a, f) => a + f.confidence, 0) /
              (Object.values(s.fields).length || 1) * 100
            ) : 0;
            
            return (
              <tr 
                key={s.id} 
                onClick={() => navigate(`/scans/${s.id}`)}
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {`Scan-${s.id.substring(0, 8).toUpperCase()}`}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <b className="block text-sm text-slate-900 mb-0.5">{s.product_name || 'Unknown'}</b>
                  <small className="block text-xs text-slate-500">{s.manufacturer || 'Pending details'}</small>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 font-medium">{fmt(s.scan_date)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${badgeColors[s.overall_status]}`}>
                      {badgeLabels[s.overall_status]}
                    </span>
                    {s.review_status && s.review_status !== 'completed' && s.review_status !== 'pending' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                        Review
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${conf}%` }}></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-8 text-right">{conf}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {!compact && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-white">
          <span>Showing <b>1–{rows.length}</b> of {rows.length} scans</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 bg-slate-900 text-white rounded font-medium">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
