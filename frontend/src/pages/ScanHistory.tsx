import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { ScanTable } from '../components/ScanTable';
import { listScans } from '../api';
import { Scan, ScanFilters, OverallStatus } from '../types';

export default function ScanHistory() {
  const [rows, setRows] = useState<Scan[]>([]);
  const [filter, setFilter] = useState<ScanFilters>({ status: 'all', type: 'physical' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listScans(filter).then(data => {
      setRows(data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [filter]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto pb-20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Scan History</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{rows.length} scans found</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Filters Top Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-colors">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-1">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Search scans by ID or Product Name..." 
                  value={filter.search || ''} 
                  onChange={e => setFilter({ ...filter, search: e.target.value })}
                />
              </div>
            </div>

            <div className="md:w-72">
              <label className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-1">Compliance Status</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={filter.status} 
                onChange={e => setFilter({ ...filter, status: e.target.value as OverallStatus | 'all' })}
              >
                <option value="all">All statuses</option>
                <option value="compliant">Compliant</option>
                <option value="non_compliant">Non-Compliant</option>
                <option value="review_required">Review Required</option>
                <option value="insufficient_image_quality">Quality Issue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
          <ScanTable rows={rows} loading={loading} />
        </div>
        
      </div>
    </div>
  );
}
