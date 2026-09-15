import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReviewItems, resolveReview } from '../api';
import { Scan } from '../types';
import { Check, X } from 'lucide-react';

export default function ReviewQueue() {
  const [items, setItems] = useState<{ scan: Scan; field: string }[]>([]);
  const navigate = useNavigate();

  const load = () => {
    getReviewItems().then(setItems).catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  const handleResolve = async (scanId: string, fieldId: string, compliant: boolean) => {
    try {
      await resolveReview(scanId, fieldId, compliant);
      load();
    } catch (e) {
      console.error(e);
      alert('Failed to resolve review');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20 font-sans">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Review Queue</h1>
        <p className="text-slate-500 font-medium text-sm">{items.length} items require manual officer review</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex justify-center items-center mx-auto mb-4 border border-slate-100">
              <Check size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">All caught up! No items in the review queue.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 tracking-wider uppercase">
                  <th className="px-6 py-4 font-semibold">Scan ID</th>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Field Requiring Review</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={`${item.scan.id}-${item.field}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td 
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => navigate(`/scans/${item.scan.id}`)}
                    >
                      <span className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                        {`Scan-${item.scan.id.substring(0, 8).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <b className="block text-sm text-slate-900">{item.scan.product_name}</b>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-bold uppercase tracking-wider">
                        {item.field.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-semibold transition-colors"
                          onClick={() => handleResolve(item.scan.id, item.field, true)}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-sm font-semibold transition-colors"
                          onClick={() => handleResolve(item.scan.id, item.field, false)}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
