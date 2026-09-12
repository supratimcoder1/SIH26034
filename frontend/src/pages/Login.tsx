import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, register as apiRegister } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, FileText, CheckCircle, Scale, Copy } from 'lucide-react';

export default function Login() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'signup') {
        const data = await apiRegister(name, email, password);
        login(data.token, data.id, data.email, data.name, data.role);
        navigate('/dashboard');
      } else {
        const data = await apiLogin(email, password);
        login(data.token, data.id, data.email, data.name, data.role);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'officer' | 'admin' | 'user') => {
    setEmail(`${role}@metroguard.gov.in`);
    setPassword(`${role.charAt(0).toUpperCase() + role.slice(1)}@2026`);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[45%_55%] bg-slate-50 font-sans">
      
      {/* LEFT PANEL */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-12 flex flex-col justify-between hidden md:flex relative overflow-hidden">
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <Scale size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">MetroGuard <span className="text-blue-400 font-light">AI</span></h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">Enforcement Dashboard</p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl leading-tight font-semibold mb-6">
              Legal Metrology Compliance,<br/>
              powered by <span className="text-blue-400">Computer Vision.</span>
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed max-w-md mb-12">
              An enforcement tool for officers under India's Ministry of Consumer Affairs — analyze product labels, detect violations, and manage your district's compliance queue.
            </p>

            <div className="space-y-6">
              {[
                { icon: ShieldCheck, text: "AI-powered OCR label analysis against Legal Metrology Rules 2011" },
                { icon: CheckCircle, text: "Field-level compliance checking with rule references and confidence scores" },
                { icon: FileText, text: "Human-in-the-loop review queue for undetected declarations" }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-start gap-4"
                >
                  <div className="bg-slate-700/50 p-2 rounded text-blue-400 mt-0.5">
                    <item.icon size={20} />
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-sm">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="text-xs text-slate-500 mt-12 relative z-10">
          <p>Ministry of Consumer Affairs, Food & Public Distribution · Government of India</p>
          <p className="mt-1">SIH Project 26034 · Internal Enforcement Tool</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          
          {/* Tabs */}
          <div className="flex gap-8 border-b border-slate-200 mb-8">
            <button 
              className={`pb-4 text-sm font-semibold transition-colors relative ${tab === 'signin' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setTab('signin')}
            >
              Sign In
              {tab === 'signin' && (
                <motion.div layoutId="underline" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
              )}
            </button>
            <button 
              className={`pb-4 text-sm font-semibold transition-colors relative ${tab === 'signup' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setTab('signup')}
            >
              Sign Up
              {tab === 'signup' && (
                <motion.div layoutId="underline" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
              )}
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {tab === 'signin' ? 'Sign in to your account' : 'Create new account'}
            </h2>
            <p className="text-sm text-slate-500">
              {tab === 'signin' ? 'Authorised enforcement officers only' : 'Register for access to the portal'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                  <ShieldCheck size={16} /> {error}
                </div>
              )}

              {tab === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Official Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="officer@metroguard.gov.in"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Enter your password"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-70"
              >
                {loading ? 'Processing...' : (tab === 'signin' ? 'Sign In' : 'Sign Up')}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Demo Credentials Box */}
          {tab === 'signin' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
            >
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500 tracking-wider">DEMO CREDENTIALS — HACKATHON ACCESS</span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {/* Officer */}
                <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded w-16 text-center">Officer</span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">officer@metroguard.gov.in</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">Officer@2026</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => fillDemo('officer')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                  >
                    <Copy size={14} /> Use
                  </button>
                </div>

                {/* Admin */}
                <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-16 text-center">Admin</span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">admin@metroguard.gov.in</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">Admin@2026</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => fillDemo('admin')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                  >
                    <Copy size={14} /> Use
                  </button>
                </div>

                {/* Normal User */}
                <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded w-16 text-center">User</span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">user@metroguard.gov.in</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">User@2026</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => fillDemo('user')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                  >
                    <Copy size={14} /> Use
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <p className="text-center text-xs text-slate-400 mt-8 max-w-xs mx-auto leading-relaxed">
            This system is for authorised enforcement officers only. Unauthorised access is a punishable offence.
          </p>
        </div>
      </div>
    </div>
  );
}
