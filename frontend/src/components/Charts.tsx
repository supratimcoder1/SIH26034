import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, LineChart, Legend, Line } from 'recharts';
import { Scan } from '../types';

const CHART = { critical: '#dd4e4e', major: '#d99b17', minor: '#2b78bb', compliant: '#1e8b63', nonCompliant: '#dd4e4e', grid: 'var(--chart-grid)', axis: 'var(--chart-axis)', tooltipBg: 'var(--chart-tooltip-bg)' };

export function SeverityChart({ scans }: { scans: Scan[] }) {
  const data = useMemo(() => {
    const c = { critical: 0, major: 0, minor: 0 };
    scans.forEach(s => {
      if (s.violations) {
        s.violations.forEach(v => {
          if (c[v.severity] !== undefined) {
            c[v.severity]++;
          }
        });
      }
    });
    return [
      { name: 'Critical', count: c.critical, fill: CHART.critical },
      { name: 'Major', count: c.major, fill: CHART.major },
      { name: 'Minor', count: c.minor, fill: CHART.minor }
    ];
  }, [scans]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: CHART.axis }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: CHART.axis }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: CHART.tooltipBg, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12 }} labelStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(40,121,197,0.05)' }} />
        <Bar dataKey="count" name="Violations" radius={[6, 6, 0, 0]}>
          {data.map((e, i) => <Cell key={i} fill={e.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ComplianceChart({ scans }: { scans: Scan[] }) {
  const data = useMemo(() => {
    if (!scans || scans.length === 0) return [];
    
    // Group scans by simple date string (YYYY-MM-DD)
    const grouped: Record<string, { total: number, compliant: number }> = {};
    
    // Sort scans by date ascending
    const sortedScans = [...scans].sort((a, b) => new Date(a.scan_date).getTime() - new Date(b.scan_date).getTime());
    
    sortedScans.forEach(s => {
      const dateStr = new Date(s.scan_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!grouped[dateStr]) grouped[dateStr] = { total: 0, compliant: 0 };
      grouped[dateStr].total++;
      if (s.overall_status === 'compliant') {
        grouped[dateStr].compliant++;
      }
    });

    return Object.keys(grouped).map(date => {
      const g = grouped[date];
      const compPct = Math.round((g.compliant / g.total) * 100);
      return {
        date,
        Compliant: compPct,
        NonCompliant: 100 - compPct
      };
    });
  }, [scans]);
  
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART.axis }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: CHART.axis }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip contentStyle={{ background: CHART.tooltipBg, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12 }} labelStyle={{ color: '#fff' }} cursor={{ stroke: CHART.grid }} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#617180' }} iconType="plainline" />
        <Line type="monotone" dataKey="Compliant" stroke={CHART.compliant} strokeWidth={2.5} dot={{ r: 3, fill: CHART.compliant }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="NonCompliant" stroke={CHART.nonCompliant} strokeWidth={2.5} dot={{ r: 3, fill: CHART.nonCompliant }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
