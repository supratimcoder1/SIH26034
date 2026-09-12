import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { ScanTable } from '../components/ScanTable';
import { listScans } from '../api';
import { Scan, ScanFilters, OverallStatus } from '../types';

export default function ScanHistory() {
  const [rows, setRows] = useState<Scan[]>([]);
  const [filter, setFilter] = useState<ScanFilters>({ status: 'all', type: 'physical' }); // defaulted to physical since ecommerce is removed

  useEffect(() => {
    listScans(filter).then(setRows).catch(console.error);
  }, [filter.search, filter.status, filter.type]);

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Scan History</h1>
          <p className="text-slate-500 font-medium text-sm">{rows.length} scans found</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Filters Sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-8">
            <b className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-6">Filters</b>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Search</label>
                <small className="block text-xs text-slate-500 mb-2">Product name or ID</small>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Search scans..." 
                    value={filter.search || ''} 
                    onChange={e => setFilter({ ...filter, search: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Compliance Status</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
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
        </div>

        {/* Table Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <ScanTable rows={rows} />
        </div>
        
      </div>
    </div>
  );
}
