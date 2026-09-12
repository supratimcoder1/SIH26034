import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { getScanById } from '../api';
import { Scan } from '../types';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Hello! I am MetroGuard AI. Ask me anything about Legal Metrology compliance.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const [currentScan, setCurrentScan] = useState<Scan | null>(null);

  // Fetch scan context if on a scan page
  useEffect(() => {
    if (location.pathname.startsWith('/scans/')) {
      const parts = location.pathname.split('/');
      const id = parts[parts.length - 1];
      if (id && id !== 'new') {
        getScanById(id).then(scan => {
          if (scan) setCurrentScan(scan);
        }).catch(() => setCurrentScan(null));
      }
    } else {
      setCurrentScan(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    let contextData = undefined;
    if (currentScan) {
      contextData = `The user is currently viewing Scan ID: ${currentScan.id}. Product: ${currentScan.product_name}. ` +
                    `Status: ${currentScan.overall_status}. Violations: ${currentScan.violations?.map(v => v.rule_ref).join(', ') || 'None'}.`;
    }

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, context: contextData })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'bot', text: data.reply || data.response || 'No response.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: 'Error connecting to OCR service.' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Network error connecting to Chat API.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
        <MessageSquare size={24} color="#fff" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="chatbot-window"
          >
            <div className="chatbot-header">
              <b>MetroGuard Assistant</b>
              <button onClick={() => setIsOpen(false)}><X size={18} /></button>
            </div>
            <div className="chatbot-body" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`chat-message ${m.role}`}>
                  {m.text}
                </div>
              ))}
              {loading && <div className="chat-message bot loading">Typing...</div>}
            </div>
            <div className="chatbot-footer">
              <input 
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask about rules..." 
              />
              <button onClick={send}><Send size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
