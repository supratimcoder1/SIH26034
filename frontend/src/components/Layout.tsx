import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, UploadCloud, ClipboardCheck, BarChart3, Users as UsersIcon, LogIn, Menu, ChevronDown, Scale, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const nav = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, group: 'Overview' },
  { label: 'Scan History', path: '/scans', icon: Search, group: 'Overview' },
  { label: 'New Image Scan', path: '/scans/new', icon: UploadCloud, group: 'Scanning' },
  { label: 'Review Queue', path: '/review-queue', icon: ClipboardCheck, group: 'Enforcement' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, group: 'Enforcement' },
  { label: 'User Management', path: '/admin/users', icon: UsersIcon, group: 'Administration' }
];

export default function Layout() {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('metroguard_theme') === 'dark';
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('metroguard_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('metroguard_theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const name = user?.name || 'Unknown User';
  const initial = name.charAt(0).toUpperCase();
  const roleDisplay = role === 'admin' ? 'Admin' : role === 'enforcement_officer' ? 'Officer' : 'Viewer';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans m-0 p-0 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* SIDEBAR (LEFT PANEL) */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 68 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="h-screen bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col flex-shrink-0 relative border-r border-slate-800 dark:border-slate-800/50 whitespace-nowrap overflow-hidden z-20 select-none !m-0"
      >
        {/* Brand & Hamburger Header on the Left Panel */}
        <div className={`h-16 flex items-center border-b border-slate-800 shrink-0 ${sidebarOpen ? 'px-4 justify-between' : 'justify-center'}`}>
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400 shrink-0">
                  <Scale size={20} />
                </div>
                <div className="overflow-hidden">
                  <b className="text-white block text-sm leading-tight tracking-tight">MetroGuard AI</b>
                  <small className="text-slate-400 text-[10px] uppercase tracking-wider block font-semibold leading-tight">Enforcement</small>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                title="Collapse sidebar"
              >
                <Menu size={19} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Expand sidebar"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
          {['Overview', 'Scanning', 'Enforcement', 'Administration'].map(group => {
            const items = nav.filter(n => n.group === group).filter(n => {
              if (role === 'viewer' && ['/review-queue', '/analytics', '/admin/users'].includes(n.path)) return false;
              if (role === 'enforcement_officer' && n.path === '/admin/users') return false;
              return true;
            });
            
            if (items.length === 0) return null;

            return (
              <div key={group} className="space-y-1">
                {sidebarOpen && (
                  <small className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-3 mb-1.5 block">
                    {group}
                  </small>
                )}
                {items.map(n => {
                  const Icon = n.icon;
                  return (
                    <NavLink
                      key={n.path}
                      to={n.path}
                      end
                      title={!sidebarOpen ? n.label : undefined}
                      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                        sidebarOpen ? '' : 'justify-center px-0'
                      } ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30' 
                          : 'hover:bg-slate-800/80 hover:text-white text-slate-400'
                      }`}
                    >
                      <Icon size={19} className="shrink-0" />
                      {sidebarOpen && <span className="truncate">{n.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Profile / Logout at Bottom of Left Panel */}
        <div className="p-3 border-t border-slate-800">
          <button 
            onClick={handleLogout} 
            title={!sidebarOpen ? `${name} (Sign out)` : undefined}
            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left ${
              sidebarOpen ? '' : 'justify-center p-1.5'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {initial}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 overflow-hidden">
                  <b className="block text-xs font-semibold text-white truncate">{name}</b>
                  <small className="text-slate-400 text-[11px] block truncate">{roleDisplay}</small>
                </div>
                <LogIn size={15} className="text-slate-500 shrink-0 hover:text-slate-300" />
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-screen !m-0 !w-full">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm shadow-slate-100/50 dark:shadow-none transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Ministry of Consumer Affairs</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Legal Metrology Division</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              onClick={() => navigate('/scans/new')}
              className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              New Scan
            </button>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            
            <div className="flex items-center gap-2.5 py-1 px-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                {initial}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{roleDisplay}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content wrapper */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 relative transition-colors">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
