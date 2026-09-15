import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeImage } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Box, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';

const steps = [
  { id: 1, label: 'Uploading Image securely' },
  { id: 2, label: 'Preprocessing & Enhancing Resolution' },
  { id: 3, label: 'Extracting Text via PaddleOCR API' },
  { id: 4, label: 'Evaluating against Legal Metrology Rules, 2011' },
];

export default function NewScan() {
  const [file, setFile] = useState<File | null>(null);
  const [packWidth, setPackWidth] = useState('');
  const [packHeight, setPackHeight] = useState('');
  const [isMolded, setIsMolded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  React.useEffect(() => {
    // Wake up Neon DB as soon as the user enters the preprocessing screen
    import('../api').then(({ pingDatabase }) => pingDatabase());
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const submit = async () => {
    setError('');
    if (!file) {
      setError('Select a product image before starting the scan.');
      return;
    }
    setProcessing(true);
    setCurrentStep(1);

    // Run backend request and simulation in parallel.
    // Minimum simulated time is 3.5s total to look sleek.
    const startTime = Date.now();
    let backendDone = false;
    let backendResult: any = null;
    let backendError: any = null;

    // Fire actual API
    analyzeImage(
      file, 
      packWidth ? Number(packWidth) : undefined, 
      packHeight ? Number(packHeight) : undefined, 
      isMolded
    ).then(res => {
      backendDone = true;
      backendResult = res;
    }).catch(err => {
      backendDone = true;
      backendError = err;
    });

    // Simulate steps sequentially
    for (let i = 1; i <= 4; i++) {
      setCurrentStep(i);
      
      // If we are at the last step, we wait for backend if it's not done yet.
      if (i === 4) {
        while (!backendDone) {
          await new Promise(r => setTimeout(r, 200));
        }
      } else {
        await new Promise(r => setTimeout(r, 800)); // fixed delay for first 3 steps
      }
    }

    setProcessing(false);
    
    if (backendError) {
      setError(backendError.message || 'Analysis failed.');
      setCurrentStep(0);
    } else if (backendResult) {
      navigate(`/scans/${backendResult.id}`);
    }
  };

  if (processing) {
    return (
      <div className="p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-center items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 w-full max-w-lg"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex justify-center items-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Scanning Artifact</h2>
              <p className="text-sm text-slate-500">Please wait while AI processes the label</p>
            </div>
          </div>

          <div className="space-y-6">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isDone = currentStep > step.id;
              const isPending = currentStep < step.id;

              return (
                <div key={step.id} className={`flex items-center gap-4 transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isDone ? 'bg-emerald-100 text-emerald-600' : 
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isDone ? <Check size={16} strokeWidth={3} /> : 
                     isActive ? <Loader2 size={16} className="animate-spin" /> : 
                     <div className="w-2 h-2 rounded-full bg-slate-300" />}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-blue-900' : isDone ? 'text-slate-600' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">New Image Scan</h1>
        <p className="text-slate-500 font-medium text-sm">Upload a product label for Legal Metrology compliance checks</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {error && (
          <div className="m-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Left side: Upload */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">1. Product Image</h3>
              
              <label 
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                  file ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
                }`}
              >
                {file ? (
                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex justify-center items-center mb-3">
                      <ImageIcon size={24} />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500 px-4 text-center">
                    <Upload size={32} className="mb-3 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Click or drag image to upload</span>
                    <span className="text-xs mt-1">PNG, JPG, WEBP up to 20MB</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)} 
                />
              </label>
            </div>

            {/* Right side: Options */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">2. Label Details (Optional)</h3>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pack Width (cm)</label>
                    <input 
                      type="number" step="0.1" 
                      value={packWidth} onChange={e => setPackWidth(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. 15.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pack Height (cm)</label>
                    <input 
                      type="number" step="0.1" 
                      value={packHeight} onChange={e => setPackHeight(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. 20.0"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={isMolded} onChange={e => setIsMolded(e.target.checked)} 
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-slate-900">Molded / Embossed Lettering</span>
                    <span className="block text-xs text-slate-500 mt-0.5">Check this if text is embossed in plastic or glass (no ink).</span>
                  </div>
                </label>
              </div>

            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end">
          <button 
            onClick={submit}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 py-3 rounded-xl transition-colors shadow-lg shadow-slate-900/10 flex items-center gap-2"
          >
            <Box size={18} /> Start Compliance Scan
          </button>
        </div>

      </div>
    </div>
  );
}
