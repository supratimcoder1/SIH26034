import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileImage, CheckCircle2, XCircle, ClipboardCheck, AlertTriangle, Plus, ChevronRight } from 'lucide-react';
import { ScanTable } from '../components/ScanTable';
import { SeverityChart, ComplianceChart } from '../components/Charts';
import { listScans } from '../api';
import { Scan } from '../types';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const [period, setPeriod] = useState<'7d' | '30d' | 'custom'>('30d');
  const [scans, setScans] = useState<Scan[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    listScans().then(setScans).catch(console.error);
  }, []);

  const filteredScans = useMemo(() => {
    const now = new Date();
    if (period === '7d') {
      const d = new Date(); d.setDate(now.getDate() - 7);
      return scans.filter(s => new Date(s.scan_date) >= d);
    }
    if (period === '30d') {
      const d = new Date(); d.setDate(now.getDate() - 30);
      return scans.filter(s => new Date(s.scan_date) >= d);
    }
    return scans;
  }, [period, scans]);

  const compliant = filteredScans.filter(s => s.overall_status === 'compliant').length;
  const non = filteredScans.filter(s => s.overall_status === 'non_compliant').length;
  const review = filteredScans.filter(s => s.overall_status === 'review_required' || s.review_status === 'pending_review' || s.review_status === 'pending').length;
  const qualityIssues = filteredScans.filter(s => s.overall_status === 'insufficient_image_quality').length;
  const complianceRate = filteredScans.length > 0 ? Math.round((compliant / filteredScans.length) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Enforcement Dashboard</h1>
          <p className="text-slate-500 font-medium text-sm">South Delhi District • Legal Metrology Division</p>
        </div>
        <button 
          onClick={() => navigate('/scans/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 flex items-center gap-2 w-fit"
        >
          <Plus size={18} /> New Scan
        </button>
      </div>

      {/* Date Filter & Overview */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex gap-1">
          {['7d', '30d', 'custom'].map(p => (
            <button 
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                period === p 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'Custom Range'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats Grid */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6"
      >
        <StatCard 
          label="Total Scans" value={filteredScans.length} icon={FileImage} 
          hint="In selected period" onClick={() => navigate('/scans')} 
          gradient="from-slate-800 to-slate-900" iconBg="bg-white/10" textClass="text-slate-400" valueClass="text-white"
        />
        <StatCard 
          label="Compliant" value={compliant} icon={CheckCircle2} 
          hint={`${complianceRate}% overall compliance rate`} onClick={() => navigate('/scans?status=compliant')} 
          gradient="from-emerald-500 to-teal-500" iconBg="bg-white/20" textClass="text-emerald-100" valueClass="text-white"
        />
        <StatCard 
          label="Non-Compliant" value={non} icon={XCircle} 
          hint={`${non} violations detected`} onClick={() => navigate('/scans?status=non_compliant')} 
          gradient="from-rose-500 to-red-500" iconBg="bg-white/20" textClass="text-rose-100" valueClass="text-white"
        />
        <StatCard 
          label="Pending Review" value={review} icon={ClipboardCheck} 
          hint="Requires manual check" onClick={() => navigate('/review-queue')} 
          gradient="from-amber-400 to-orange-500" iconBg="bg-white/20" textClass="text-amber-100" valueClass="text-white"
        />
        <StatCard 
          label="Quality Issues" value={qualityIssues} icon={AlertTriangle} 
          hint="Recapture recommended" 
          gradient="from-white to-white" iconBg="bg-slate-100 text-slate-500" textClass="text-slate-500" valueClass="text-slate-900" 
          border="border border-slate-200"
        />
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Violations by Severity</h3>
            <p className="text-sm text-slate-500">Distribution across all non-compliant scans</p>
          </div>
          <div className="h-[265px]">
            <SeverityChart scans={filteredScans} />
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Compliance Trend</h3>
            <p className="text-sm text-slate-500">Outcome distribution over selected period</p>
          </div>
          <div className="h-[265px]">
            <ComplianceChart scans={filteredScans} />
          </div>
        </motion.div>
      </div>

      {/* Recent Scans Table */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Scans</h3>
            <p className="text-sm text-slate-500">{Math.min(10, filteredScans.length)} most recent submissions</p>
          </div>
          <button 
            onClick={() => navigate('/scans')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            View all scans <ChevronRight size={16} />
          </button>
        </div>
        <div className="p-0">
          <ScanTable rows={filteredScans.slice(0, 10)} compact />
        </div>
      </motion.div>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, hint, onClick, gradient, iconBg, textClass, valueClass, border = '' }: any) {
  return (
    <motion.div 
      variants={itemVariants}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${gradient} ${border} ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''} transition-all duration-300`}
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
        <Icon size={20} className={iconBg.includes('text-') ? '' : 'text-white'} />
      </div>
      <div>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${textClass}`}>{label}</h4>
        <div className={`text-3xl font-bold tracking-tight mb-2 ${valueClass}`}>{value}</div>
        <p className={`text-[11px] font-medium leading-tight ${textClass}`}>{hint}</p>
      </div>
    </motion.div>
  );
}
