import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileDown, FileText, AlertTriangle, Activity, Gauge, SlidersHorizontal, ChevronDown, CheckCircle2, ShieldAlert, Sparkles, Scale, Search, Clock } from 'lucide-react';
import { getScanById, generateReport, downloadBlob, fetchScanImageBlob } from '../api';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { getFile } from '../fileStore';
import { Scan, OverallStatus, Severity } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const FIELD_LABELS: Record<string, string> = {
  manufacturer_packer_importer: 'Manufacturer / Packer / Importer', generic_name: 'Generic / Common Name', net_quantity: 'Net Quantity', mrp: 'Maximum Retail Price (MRP)', manufacturing_date: 'Manufacturing Date', consumer_care: 'Consumer Care Details', unit_sale_price: 'Unit Sale Price (USP)', country_of_origin: 'Country of Origin'
};

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

const sevColors: Record<Severity, string> = {
  critical: 'bg-rose-100 text-rose-700', major: 'bg-amber-100 text-amber-700', minor: 'bg-blue-100 text-blue-700'
};

export default function ScanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [scan, setScan] = useState<Scan | null>(null);
  const [tech, setTech] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);

  const fmt = (date: string) => new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (id) {
      getScanById(id).then(async (s) => {
        if (!s) return;
        setScan(s);
        let f: Blob | null = s.__sourceFile || await getFile(s.id);
        if (!f) {
           try {
               f = await fetchScanImageBlob(s.id);
           } catch(e) {}
        }
        if (f) {
           setImageBlob(f);
           setImageUrl(URL.createObjectURL(f));
        }
      }).catch(console.error);
    }
  }, [id]);

  if (!scan) return (
    <div className="p-8 max-w-7xl mx-auto flex justify-center py-20">
      <div className="animate-pulse bg-white p-8 rounded-2xl border border-slate-100 w-full max-w-4xl h-96"></div>
    </div>
  );

  const download = async () => {
    setDownloadError('');
    setDownloading(true);
    try {
      const element = document.getElementById('report-container');
      if (!element) throw new Error('Report container not found');
      
      const opt = {
        margin:       [0.3, 0.3, 0.3, 0.3],
        filename:     `MetroGuard_Inspection_Report_${scan.id.split('-')[0].toUpperCase()}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true, windowWidth: 800 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: 'css' }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : 'Report generation failed.');
    }
    setDownloading(false);
  };

  const isPendingReview = scan.overall_status === 'review_required' || scan.review_status === 'pending_review';
  const disableDownload = role === 'viewer' && isPendingReview;
  const scanName = `Scan-${String(scan.id || 'N/A').split('-')[0].toUpperCase()}`;

  return (
    <div id="report-container" className="p-8 max-w-7xl mx-auto pb-20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{scanName}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${badgeColors[scan.overall_status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {badgeLabels[scan.overall_status] || scan.overall_status || 'UNKNOWN'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><Clock size={16}/> {fmt(scan.scan_date)}</span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5"><Search size={16}/> ID: {scan.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-3" data-html2canvas-ignore="true">
          <button 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all ${
              disableDownload ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10 hover:-translate-y-0.5'
            }`}
            disabled={downloading || disableDownload} 
            onClick={download}
            title={disableDownload ? "Report unavailable until reviewed by an officer" : ""}
          >
            <FileDown size={18} /> {downloading ? 'Generating...' : 'Download PDF Certificate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Col: Image & Violations */}
        <div className="lg:col-span-5 space-y-8">
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Product Image</h3>
            </div>
            <div className="bg-slate-50 p-6 flex justify-center items-center min-h-[300px]">
              {imageUrl ? (
                <img src={imageUrl} alt="Product preview" className="max-w-full max-h-[400px] object-contain rounded-xl shadow-sm border border-slate-200" />
              ) : (
                <div className="text-center text-slate-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No image available</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Violations Identified</h3>
              <p className="text-xs text-slate-500 mt-1">{scan.violations?.length ? 'Detected issues requiring attention' : 'No violations identified'}</p>
            </div>
            <div className="p-0">
              {scan.violations?.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {scan.violations.map(v => (
                    <div className="p-5 flex gap-4" key={v.rule_ref}>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider h-fit shrink-0 ${sevColors[v.severity]}`}>
                        {v.severity}
                      </span>
                      <div>
                        <b className="block text-sm text-slate-900 mb-1">{v.rule_ref}</b>
                        <p className="text-sm text-slate-600 leading-relaxed">{v.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex justify-center items-center mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Perfectly compliant</p>
                  <p className="text-xs text-slate-500 mt-1">No violations were found on this package.</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>

        {/* Right Col: Fields */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Compliance Score Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="p-8 bg-slate-900 text-white rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Scale size={160} />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2"><CheckCircle2 className="text-emerald-400" /> Compliance Score</h3>
              <p className="text-slate-400 text-sm max-w-sm">Calculated by evaluating the package declarations against the Legal Metrology (Packaged Commodities) Rules, 2011.</p>
            </div>
            <div className="relative z-10 flex flex-col items-center shrink-0">
              <div className="text-5xl font-black tracking-tighter text-emerald-400 drop-shadow-md">
                {scan.compliance_score || 0}<span className="text-2xl text-emerald-600/50 ml-1">%</span>
              </div>
              <span className="uppercase tracking-widest text-[10px] font-bold text-slate-400 mt-2">Overall Compliance</span>
            </div>
          </motion.div>

          <div className="html2pdf__page-break"></div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Declaration Field Breakdown</h3>
              <p className="text-sm text-slate-500 mt-1">Detailed analysis of mandatory declarations</p>
            </div>
            
            {downloadError && (
              <div className="m-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex gap-3">
                <AlertTriangle size={18} className="shrink-0" /> {downloadError}
              </div>
            )}

            {scan.overall_status === 'insufficient_image_quality' ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex justify-center items-center mx-auto mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Image quality insufficient</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">{scan.message}</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors" onClick={() => navigate('/scans/new')}>
                  Recapture and Retry
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {Object.entries(scan.fields || {}).map(([key, f], index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: index * 0.05 }}
                    className={`p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 ${f.status === 'not_detected' ? 'bg-slate-50' : ''}`} 
                    key={key}
                  >
                    <div className="sm:w-1/3 shrink-0">
                      <b className="block text-sm font-semibold text-slate-900 mb-2">{FIELD_LABELS[key] || key}</b>
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                        f.status === 'compliant' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        f.status === 'non_compliant' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {f.status === 'not_detected' ? 'Review Required' : (f.status?.replace('_', '-') || 'UNKNOWN')}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      {f.status === 'not_detected' ? (
                        <div className="flex gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
                          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                          <p className="text-sm font-medium">{f.reason || 'Not detected on package'}</p>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-slate-900 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 break-words">
                            {typeof f.value === 'object' && f.value !== null
                              ? Array.isArray(f.value) 
                                ? f.value.join(' • ') 
                                : 'amount' in f.value 
                                  ? `₹${f.value.amount} ${f.value.unit || ''}${f.value.inclusive_of_all_taxes ? ' (inclusive of all taxes)' : ''}` 
                                  : JSON.stringify(f.value)
                              : String(f.value || '')}
                          </div>
                          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                            <span>Rule: <span className="text-blue-600 underline decoration-blue-200 underline-offset-2">{f.rule_ref || 'Unknown'}</span></span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {scan.usp_context?.required && (
              <div className="p-6 bg-blue-50 border-t border-blue-100 flex gap-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex justify-center items-center shrink-0">
                  <Gauge size={20} />
                </div>
                <div>
                  <b className="block text-sm font-bold text-blue-900 mb-1">Unit Sale Price (USP) Evaluated</b>
                  <p className="text-sm text-blue-800 leading-relaxed">{scan.usp_context.reason}</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Technical Specs Toggle */}
          <motion.div data-html2canvas-ignore="true" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <button 
              onClick={() => setTech(!tech)}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-3 text-slate-700">
                <SlidersHorizontal size={18} />
                <b className="text-sm font-bold uppercase tracking-wider">Technical Calibration Details</b>
              </div>
              <ChevronDown className={`text-slate-400 transition-transform ${tech ? 'rotate-180' : ''}`} size={18} />
            </button>
            <AnimatePresence>
              {tech && scan.preprocessing && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-6 border-t border-slate-100 mt-2 pt-6">
                    {Object.entries(scan.preprocessing).map(([k, v]) => (
                      <div key={k}>
                        <small className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{k.replace(/_/g, ' ')}</small>
                        <b className="block text-sm text-slate-800 font-mono bg-slate-50 p-2 rounded border border-slate-100 truncate" title={String(v)}>{String(v)}</b>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
