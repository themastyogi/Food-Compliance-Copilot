import React, { useState, useEffect } from 'react';
import {
  User, Lock, Mail, MessageCircle, Send, LogOut, Crown,
  AlertCircle, Shield, Settings, Users, ArrowLeft, CreditCard,
  Download, ChevronDown
} from 'lucide-react';

const MAX_QUERIES_EXPLORER = 5;

// Toggle (kept but hidden)
const SHOW_DEMO_INFO = false;
const SHOW_SECONDARY_IMAGE = false;

// Footer lines
const COPYRIGHT = '© 2025 Food Compliance Copilot. All rights reserved.';
const DISCLAIMER =
  'AI-generated compliance guidance. Verify with official regulations and qualified professionals before final decisions. Not legal advice. Contact: themastyogi@gmail.com';

// Security helpers
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
};
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Utils
const escapeHtml = (str) =>
  String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stripTags = (html) => String(html).replace(/<[^>]+>/g, '');

// Minimal Markdown → HTML for readable bubbles
const mdToHTML = (text) => {
  if (!text) return '';
  let s = String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Bold **text**
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  const lines = s.split(/\r?\n/);
  const out = [];
  let inOl = false, inUl = false;

  const closeLists = () => {
    if (inOl) { out.push('</ol>'); inOl = false; }
    if (inUl) { out.push('</ul>'); inUl = false; }
  };

  for (const line of lines) {
    const olMatch = line.match(/^\s*\d+\.\s+(.*)/);
    const ulMatch = line.match(/^\s*[-*]\s+(.*)/);

    if (olMatch) {
      if (!inOl) { closeLists(); out.push('<ol>'); inOl = true; }
      out.push(`<li>${olMatch[1]}</li>`);
    } else if (ulMatch) {
      if (!inUl) { closeLists(); out.push('<ul>'); inUl = true; }
      out.push(`<li>${ulMatch[1]}</li>`);
    } else if (line.trim() === '') {
      closeLists();
      out.push('<br/>');
    } else {
      closeLists();
      out.push(`<p>${line}</p>`);
    }
  }
  closeLists();
  return out.join('\n');
};

const App = () => {
  const [currentView, setCurrentView] = useState('login'); // login, chat, admin, upgrade, downloads
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(true); // default: Sign Up first
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Users list for admin (fetched from API)
  const [userDatabase, setUserDatabase] = useState([]);

  // Menu / Templates
  const [menuMode, setMenuMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateContentHTML, setTemplateContentHTML] = useState(''); // store HTML

  // Check for existing session on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include' // Include cookies for session
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setCurrentView('chat');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // User not logged in, stay on login page
    }
  };

  // Close user dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      const menu = document.getElementById('user-menu-dropdown');
      const trigger = document.getElementById('user-menu-trigger');
      if (menu && trigger && !menu.contains(e.target) && !trigger.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // ===== Limits =====
  const getUserLimits = (role) => {
    switch (role) {
      case 'admin': return { maxQueries: -1, canManageUsers: true };
      case 'pro': return { maxQueries: -1, canManageUsers: false };
      case 'explorer':
      default: return { maxQueries: MAX_QUERIES_EXPLORER, canManageUsers: false };
    }
  };

  // ===== Auth Functions =====
  const handleSignup = async () => {
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      alert('Please fill in all fields'); return;
    }
    if (!isValidEmail(signupEmail)) { alert('Please enter a valid email address'); return; }
    if (signupPassword.length < 6) { alert('Password must be at least 6 characters'); return; }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.toLowerCase(),
          password: signupPassword
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setCurrentView('chat');
        setSignupName(''); setSignupEmail(''); setSignupPassword('');
        alert('Account created successfully!');
      } else {
        alert(data.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.');
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) { 
      alert('Please fill in all fields'); return; 
    }
    if (!isValidEmail(loginEmail)) { 
      alert('Please enter a valid email address'); return; 
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.toLowerCase(),
          password: loginPassword
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setCurrentView('chat');
        setLoginEmail(''); setLoginPassword('');
      } else {
        alert(data.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleForgotPassword = () => {
    setShowForgot(true);
    setShowSignup(false);
    setLoginEmail('');
    setLoginPassword('');
  };

  const submitForgotPassword = async () => {
    if (!isValidEmail(forgotEmail)) { 
      alert('Enter a valid email'); return; 
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) { 
      alert('New password must be at least 6 characters'); return; 
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.toLowerCase(),
          newPassword: forgotNewPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Password updated successfully. Please sign in.');
        setShowForgot(false);
        setShowSignup(false);
        setForgotEmail('');
        setForgotNewPassword('');
      } else {
        alert(data.error || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      alert('Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local state
    setUser(null);
    setCurrentView('login');
    setChatMessages([]);
    setLoginEmail(''); setLoginPassword('');
    setSignupName(''); setSignupEmail(''); setSignupPassword('');
    setMenuMode(false); setSelectedTemplate(null); setTemplateContentHTML('');
    setShowSignup(true);
    setUserMenuOpen(false);
  };

  const handleUpgradeRequest = () => { 
    setCurrentView('upgrade'); 
    setUserMenuOpen(false); 
  };

  const processUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        alert('Congratulations! You have been upgraded to Pro. You now have unlimited queries!');
        setCurrentView('chat');
      } else {
        alert(data.error || 'Upgrade failed. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Upgrade failed. Please try again.');
    } finally { 
      setIsLoading(false); 
    }
  };

  // Fetch users for admin dashboard
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserDatabase(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch('/api/users/update-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setUserDatabase(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
        if (user && user.id === userId) {
          setUser(prev => ({ ...prev, role: newRole }));
        }
        alert(`User role updated to ${newRole}`);
      } else {
        alert(data.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Role update error:', error);
      alert('Failed to update user role');
    }
  };

  // ===== Prompt catalog & template generation =====
  const TEMPLATE_PROMPTS = {
    haccp: "Generate a HACCP plan template (by product/process). Include process steps, hazards, CCPs, critical limits, monitoring, verification, corrective actions.",
    pcqi: "Generate a FSMA Preventive Controls (PCQI) plan outline. Include hazard analysis, process/env/allergen/supply-chain preventive controls, monitoring, verification, corrective actions, recall plan, and records.",
    recall: "Generate a US FDA recall plan SOP outline. Include roles, decision tree, lot identification, notifications, product retrieval, communication templates, effectiveness checks, and mock recall testing.",
    nfp: "Generate an FDA Nutrition Facts panel checklist. Include mandatory elements, order, type size, dual-column rules, %DV rounding, footnotes, added sugars, and common pitfalls.",
    allergens: "Generate an allergen declaration matrix for US/EU/India. Include top allergens per region, 'Contains' statement examples, precautionary labeling notes, and cross-contact controls.",
    fssai: "Generate an FSSAI label format checklist outlining mandatory declarations, font sizes, veg/non-veg logo, FSSAI license, date/lot/best-before, nutrition panel, allergens.",
    eu_fic: "Generate an EU FIC (1169/2011) QUID & allergen declaration table, with labeling examples, ingredient emphasis, and common pitfalls."
  };

  const htmlEnvelope = (inner) => {
    const footer = `
      <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb">
      <p style="font-size:12px;color:#6b7280;margin:0">${COPYRIGHT}</p>
      <p style="font-size:12px;color:#6b7280;margin:0">${DISCLAIMER}</p>
    `;
    return `
      <div style="font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111827">
        ${inner}
        ${footer}
      </div>
    `;
  };

  const promptToHTMLInstruction = (base) =>
    `${base}\n\nFormat the response as clean semantic HTML only (no markdown), using <h2>, <h3>, <ul>, <ol>, <table>, and short paragraphs. Add clear section headings. Do not include <html> or <body> tags. Do not include external links or images.`;

  const generateTemplateHTML = async (instruction) => {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: promptToHTMLInstruction(instruction) }]
      }),
      credentials: 'include'
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('API /api/chat error:', resp.status, errText);
      throw new Error(`API ${resp.status}`);
    }
    const data = await resp.json();
    let html = data.reply || '';
    if (!html) html = '<p>No content returned.</p>';
    return htmlEnvelope(html);
  };

  const handleSelectTemplate = async (key) => {
    setSelectedTemplate(key);
    setIsLoading(true);
    setMenuMode(false);
    try {
      const html = await generateTemplateHTML(TEMPLATE_PROMPTS[key] || 'Generate a food compliance template.');
      setTemplateContentHTML(html);
      setChatMessages(prev => [...prev, { type: 'bot-html', html }]);
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { type: 'bot', content: 'Failed to generate the template. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const doQuickPrompt = async (key) => {
    setCurrentView('chat');
    await handleSelectTemplate(key);
  };

  // ===== Downloads helpers =====
  const downloadContent = (format) => {
    if (!templateContentHTML) return;

    const nameMap = {
      haccp: 'haccp_plan',
      pcqi: 'fsma_pcqi_plan',
      recall: 'recall_plan_sop',
      nfp: 'fda_nutrition_facts_checklist',
      allergens: 'allergen_declaration_matrix',
      fssai: 'fssai_label_checklist',
      eu_fic: 'eu_fic_quid_allergen'
    };
    const baseName = nameMap[selectedTemplate] || 'compliance_template';

    let blob, filename;

    switch (format) {
      case 'doc': {
        const htmlDoc = `<!doctype html><html><head><meta charset="utf-8"></head><body>${templateContentHTML}</body></html>`;
        blob = new Blob([htmlDoc], { type: 'application/msword' });
        filename = `${baseName}.doc`;
        break;
      }
      case 'pdf': {
        // Print-ready HTML (user chooses Save as PDF)
        const win = window.open('', '_blank', 'noopener,noreferrer');
        if (!win) return;
        win.document.open();
        win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${baseName}</title></head><body>${templateContentHTML}<script>window.onload = () => setTimeout(() => window.print(), 200);</script></body></html>`);
        win.document.close();
        return;
      }
      case 'txt': {
        const txt = stripTags(templateContentHTML);
        blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        filename = `${baseName}.txt`;
        break;
      }
      case 'json': {
        const json = JSON.stringify({ title: baseName, html: templateContentHTML }, null, 2);
        blob = new Blob([json], { type: 'application/json' });
        filename = `${baseName}.json`;
        break;
      }
      case 'yaml': {
        const yaml = `title: ${baseName}\nhtml: |\n  ${templateContentHTML.replace(/\n/g, '\n  ')}`;
        blob = new Blob([yaml], { type: 'text/yaml' });
        filename = `${baseName}.yaml`;
        break;
      }
      case 'csv': {
        const csv = `content_html\n"${templateContentHTML.replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
        blob = new Blob([csv], { type: 'text/csv' });
        filename = `${baseName}.csv`;
        break;
      }
      default: return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ===== Chat handler =====
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userLimits = getUserLimits(user.role);
    if (userLimits.maxQueries !== -1 && user.queriesUsed >= userLimits.maxQueries) {
      alert('You have reached your query limit. Please upgrade to Pro for unlimited access.');
      return;
    }

    const sanitizedMessage = sanitizeInput(inputMessage.trim());
    setIsLoading(true);
    setChatMessages(prev => [...prev, { type: 'user', content: sanitizedMessage }]);
    setInputMessage('');

    if (/^\s*menu\s*$/i.test(sanitizedMessage)) {
      setMenuMode(true); setIsLoading(false); return;
    }

    try {
      const oaMessages = [
        ...chatMessages.map(m => (
          m.type === 'user'
            ? { role: 'user', content: m.content }
            : m.type === 'bot' ? { role: 'assistant', content: m.content }
            : m.type === 'bot-html' ? { role: 'assistant', content: stripTags(m.html) }
            : { role: 'assistant', content: '' }
        )),
        { role: 'user', content: sanitizedMessage }
      ];

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: oaMessages }),
        credentials: 'include'
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        console.error('API /api/chat error:', resp.status, errText);
        throw new Error(`API ${resp.status}`);
      }

      const data = await resp.json();
      const assistantText = data.reply || 'Sorry, I could not generate a response.';
      const html = mdToHTML(assistantText);
      setChatMessages(prev => [...prev, { type: 'bot-html', html }]);

      // Update user query count on server
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, { type: 'bot', content: 'Sorry, an error occurred. Please try again.' }]);
    } finally { setIsLoading(false); }
  };

  // ===== UI helpers =====
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-600 text-white';
      case 'pro': return 'bg-yellow-400 text-black';
      case 'explorer': return 'bg-green-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Settings className="w-4 h-4" />;
      case 'pro': return <Crown className="w-4 h-4" />;
      case 'explorer': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  // ===== EFFECT: fetch users when entering Admin (hooks at top level only) =====
  useEffect(() => {
    if (currentView === 'admin' && user && getUserLimits(user.role).canManageUsers) {
      fetchUsers();
    }
  }, [currentView, user]);

  // ===== VIEWS =====

  // LOGIN/SIGNUP
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Food Compliance Copilot</h1>
            <p className="text-gray-200">AI-Powered Compliance Assistant</p>
          </div>

          {/* Forgot Password card */}
          {showForgot ? (
            <div className="space-y-4">
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="Registered Email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-12 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="New Password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-12 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={submitForgotPassword}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  onClick={() => { setShowForgot(false); setShowSignup(false); }}
                  className="flex-1 bg-gray-600/30 hover:bg-gray-600/40 text-gray-200 font-semibold py-3 rounded-lg transition"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
          <div className="space-y-4">
            {showSignup && (
              <div className="relative">
                <User className="w-5 h-5 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  maxLength={50}
                  className="w-full bg-white/10 border border-white/30 rounded-lg px-12 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="Email Address"
                value={showSignup ? signupEmail : loginEmail}
                onChange={(e) => showSignup ? setSignupEmail(e.target.value) : setLoginEmail(e.target.value)}
                maxLength={100}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-12 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Password"
                value={showSignup ? signupPassword : loginPassword}
                onChange={(e) => showSignup ? setSignupPassword(e.target.value) : setLoginPassword(e.target.value)}
                maxLength={50}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-12 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              onClick={showSignup ? handleSignup : handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-200"
            >
              {isLoading ? 'Processing...' : (showSignup ? 'Create Explorer Account' : 'Sign In')}
            </button>
            {!showSignup && !showForgot && (
              <div className="text-right">
                <button className="text-blue-300 hover:text-blue-200 text-sm underline" onClick={handleForgotPassword}>
                  Forgot password?
                </button>
              </div>
            )}
          </div>
          )}

          <div className="mt-6 text-center">
            {!showForgot && (
              <p className="text-gray-200">
                {showSignup ? 'Already have an account?' : "Don't have an account?"}
                <button
                  onClick={() => {
                    setShowSignup(!showSignup);
                    setLoginEmail(''); setLoginPassword('');
                    setSignupName(''); setSignupEmail(''); setSignupPassword('');
                  }}
                  className="ml-2 text-blue-300 hover:text-blue-200 font-semibold underline"
                >
                  {showSignup ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            )}
          </div>

          <div className="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-400/30">
            <p className="text-xs text-green-100"><strong>New users start as Explorer</strong> (5 free queries). Upgrade to Pro for unlimited queries. Admins can manage all users.</p>
          </div>
        </div>
      </div>
    );
  }

  // UPGRADE
  if (currentView === 'upgrade') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-lg border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Upgrade to Pro</h1>
            <p className="text-gray-200">Unlock unlimited queries and advanced features</p>
          </div>

          <div className="space-y-6">
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
              <h3 className="text-green-300 font-semibold mb-2">Current Plan: Explorer</h3>
              <p className="text-green-100 text-sm">Queries used: {user.queriesUsed}/{MAX_QUERIES_EXPLORER}</p>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
              <h3 className="text-yellow-300 font-semibold mb-3">Pro Plan Benefits:</h3>
              <ul className="text-yellow-100 text-sm space-y-2">
                <li>✓ Unlimited compliance queries</li>
                <li>✓ Priority response time</li>
                <li>✓ Advanced regulatory insights</li>
                <li>✓ Document analysis support</li>
                <li>✓ 24/7 technical support</li>
              </ul>
            </div>

            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 text-center">
              <h3 className="text-blue-300 font-semibold mb-2">Pro Plan Pricing</h3>
              <div className="text-3xl font-bold text-white mb-1">$29<span className="text-lg text-gray-300">/month</span></div>
              <p className="text-gray-300 text-sm">Cancel anytime</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={processUpgrade}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? <span>Processing Payment...</span> : (<><CreditCard className="w-5 h-5" /><span>Upgrade Now</span></>)}
              </button>

              <button
                onClick={() => setCurrentView('chat')}
                className="w-full bg-gray-600/20 hover:bg-gray-600/30 text-gray-200 font-semibold py-3 rounded-lg transition-all duration-200"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN
  if (currentView === 'admin' && user && getUserLimits(user.role).canManageUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-800 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-red-400 to-pink-500 w-12 h-12 rounded-full flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white drop-shadow">Admin Dashboard</h1>
                  <p className="text-gray-200">User Management & System Control</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentView('chat')}
                  className="bg-blue-600/70 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" /><span>Back to Chat</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 p-2 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2" /> User Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userDatabase.filter(u => u.id !== user.id).map(dbUser => (
                <div key={dbUser.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium">{dbUser.name}</h3>
                      <p className="text-gray-300 text-sm">{dbUser.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getRoleColor(dbUser.role)} shadow-sm`}>
                      {dbUser.role.toUpperCase()}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-200 text-sm">
                      Queries: <span className="font-medium">{dbUser.queriesUsed || 0}</span>
                      {dbUser.role === 'explorer' && ` / ${MAX_QUERIES_EXPLORER}`}
                    </p>
                    <p className="text-gray-300 text-xs">Created: {dbUser.createdAt ? new Date(dbUser.createdAt).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white text-sm font-medium">Change Role:</p>
                    <div className="flex space-x-1">
                      <button onClick={() => updateUserRole(dbUser.id, 'explorer')} disabled={dbUser.role === 'explorer'}
                        className={`px-2 py-1 rounded text-xs ${dbUser.role === 'explorer' ? 'bg-green-500/40 text-black/70' : 'bg-green-500 text-black hover:bg-green-400'}`}>Explorer</button>
                      <button onClick={() => updateUserRole(dbUser.id, 'pro')} disabled={dbUser.role === 'pro'}
                        className={`px-2 py-1 rounded text-xs ${dbUser.role === 'pro' ? 'bg-yellow-500/40 text-black/70' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}>Pro</button>
                      <button onClick={() => updateUserRole(dbUser.id, 'admin')} disabled={dbUser.role === 'admin'}
                        className={`px-2 py-1 rounded text-xs ${dbUser.role === 'admin' ? 'bg-red-600/40 text-white/70' : 'bg-red-600 text-white hover:bg-red-500'}`}>Admin</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DOWNLOADS (aligned cards)
  if (currentView === 'downloads' && user) {
    const links = [
      { key: 'haccp', label: 'HACCP plan template (by product/process)' },
      { key: 'pcqi', label: 'FSMA Preventive Controls plan outline' },
      { key: 'recall', label: 'Recall plan SOP (US FDA)' },
      { key: 'nfp', label: 'FDA Nutrition Facts panel checklist' },
      { key: 'allergens', label: 'Allergen declaration matrix (US/EU/India)' },
      { key: 'fssai', label: 'FSSAI label format checklist' },
      { key: 'eu_fic', label: 'EU FIC QUID & allergen table' }
    ];

    const Card = ({ item }) => (
      <button
        onClick={() => doQuickPrompt(item.key)}
        className="text-left bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl p-4 transition h-24 flex items-center"
      >
        {item.label}
      </button>
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-extrabold drop-shadow">Downloads</h1>
              <p className="text-gray-200 text-sm">Click an item to auto-generate and open in Chat</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentView('chat')}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-500">Back to Chat</button>
            <button onClick={handleLogout}
              className="bg-red-600/70 hover:bg-red-600 text-white p-2 rounded-lg">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {links.map((item) => <Card key={item.key} item={item} />)}
          </div>

          {/* Footer disclaimer visible here too */}
          <div className="w-full mt-3 p-3 bg-white/10 border border-white/20 rounded-lg text-gray-300 text-xs">
            <div className="font-medium">© 2025 Food Compliance Copilot. All rights reserved.</div>
            <div>
              AI-generated compliance guidance. Verify with official regulations and qualified professionals before final decisions.
              Not legal advice. Contact: themastyogi@gmail.com
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CHAT
  if (currentView === 'chat' && user) {
    const userLimits = getUserLimits(user.role);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex flex-col">
        {/* Tiny inline keyframes for typing dots */}
        <style>{`
          @keyframes typing-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: .4; }
            40% { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div className="relative bg-white/10 backdrop-blur-lg border-b border-white/20 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-extrabold drop-shadow">Food Compliance Copilot</h1>
              <p className="text-gray-200 text-sm">AI-Powered Regulatory Guidance</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* User menu trigger */}
            <button
              id="user-menu-trigger"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-2"
              title="Account"
            >
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${getRoleColor(user.role)} shadow`}>
                {getRoleIcon(user.role)}
                <span className="text-xs font-bold tracking-wide">{user.role.toUpperCase()}</span>
              </span>
              <span className="ml-1">{user.name}</span>
              <ChevronDown className="w-4 h-4 opacity-80" />
            </button>

            {userMenuOpen && (
              <div
                id="user-menu-dropdown"
                className="absolute right-6 top-16 w-64 bg-gray-900/95 border border-white/15 rounded-xl shadow-lg text-gray-100 z-50"
              >
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="text-sm">Signed in as</div>
                  <div className="font-semibold break-all">{user.email}</div>
                </div>
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="text-sm">Current:</div>
                  <div className="mt-1 inline-flex items-center gap-2 px-2 py-0.5 rounded text-xs font-bold tracking-wide bg-green-500 text-black">
                    {user.role.toUpperCase()}
                  </div>
                  <div className="text-xs mt-2 text-gray-300">
                    Queries used: {userLimits.maxQueries === -1 ? `${user.queriesUsed || 0} (unlimited plan)` : `${user.queriesUsed || 0}/${userLimits.maxQueries}`}
                  </div>
                </div>
                <button onClick={() => { setCurrentView('downloads'); setUserMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10">Downloads</button>
                {user.role === 'explorer' && (
                  <button onClick={handleUpgradeRequest} className="w-full text-left px-4 py-3 hover:bg-white/10">Upgrade to Pro</button>
                )}
                <button
                  onClick={() => { setCurrentView('admin'); setUserMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-white/10"
                  disabled={!userLimits.canManageUsers}
                  style={{ opacity: userLimits.canManageUsers ? 1 : 0.5, cursor: userLimits.canManageUsers ? 'pointer' : 'not-allowed' }}
                >
                  Admin Dashboard
                </button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-white/10 text-red-300">Sign out</button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">Welcome to Food Compliance Copilot</h3>
              <p className="text-gray-200 max-w-md mx-auto">
                Ask anything about FDA, FSMA, HACCP, FSSAI, EU FIC, Codex, allergens, and labeling. Type <span className="font-semibold">menu</span> to open templates, or use <span className="font-semibold">Downloads</span> for quick links.
              </p>
            </div>
          )}

          {/* Visual Menu */}
          {menuMode && (
            <div className="bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Menu</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="w-full text-left bg-blue-500/30 hover:bg-blue-500/40 px-3 py-2 rounded" onClick={() => handleSelectTemplate('haccp')}>1) HACCP plan template (by product/process)</button></li>
                <li><button className="w-full text-left bg-blue-500/30 hover:bg-blue-500/40 px-3 py-2 rounded" onClick={() => handleSelectTemplate('pcqi')}>2) FSMA Preventive Controls plan outline</button></li>
                <li><button className="w-full text-left bg-blue-500/30 hover:bg-blue-500/40 px-3 py-2 rounded" onClick={() => handleSelectTemplate('recall')}>3) Recall plan SOP (US FDA)</button></li>
                <li><button className="w-full text-left bg-blue-500/30 hover:bg-blue-500/40 px-3 py-2 rounded" onClick={() => handleSelectTemplate('nfp')}>4) FDA Nutrition Facts panel checklist</button></li>
                <li><button className="w-full text-left bg-blue-500/30 hover:bg-blue-500/40 px-3 py-2 rounded" onClick={() => handleSelectTemplate('allergens')}>5) Allergen declaration matrix (US/EU/India)</button></li>
              </ul>
              <div className="pt-3 flex gap-2">
                <button className="bg-gray-500/30 hover:bg-gray-500/40 px-3 py-2 rounded" onClick={() => setMenuMode(false)}>0) Go back</button>
                <button className="bg-gray-500/30 hover:bg-gray-500/40 px-3 py-2 rounded" onClick={() => { setMenuMode(false); setSelectedTemplate(null); setTemplateContentHTML(''); }}>00) Main menu</button>
              </div>
            </div>
          )}

          {/* Messages */}
          {chatMessages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type === 'bot-html' ? (
                <div
                  className="max-w-xl lg:max-w-3xl px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20"
                  dangerouslySetInnerHTML={{ __html: message.html }}
                />
              ) : (
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20'
                  }`}
                >
                  {message.content}
                </div>
              )}
            </div>
          ))}

          {/* Template download bar */}
          {templateContentHTML && (
            <div className="bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Download Options</h4>
              <div className="flex flex-wrap gap-2">
                <button className="bg-blue-600 text-white hover:bg-blue-500 px-3 py-2 rounded" onClick={() => downloadContent('doc')}>Export as Word (.doc)</button>
                <button className="bg-blue-600 text-white hover:bg-blue-500 px-3 py-2 rounded" onClick={() => downloadContent('pdf')}>Export as PDF</button>
                <button className="bg-blue-600 text-white hover:bg-blue-500 px-3 py-2 rounded" onClick={() => downloadContent('txt')}>Export as TXT</button>
                <button className="bg-blue-600 text-white hover:bg-blue-500 px-3 py-2 rounded" onClick={() => downloadContent('json')}>Export as JSON</button>
                <button className="bg-blue-600 text-white hover:bg-blue-500 px-3 py-2 rounded" onClick={() => downloadContent('yaml')}>Export as YAML</button>
                <button className="bg-blue-600 text-white hover:bg-blue-500 px-3 py-2 rounded" onClick={() => downloadContent('csv')}>Export as CSV</button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div>Thinking</div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#60a5fa', animation: 'typing-bounce 1.4s infinite', animationDelay: '0s' }} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#60a5fa', animation: 'typing-bounce 1.4s infinite', animationDelay: '0.2s' }} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#60a5fa', animation: 'typing-bounce 1.4s infinite', animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-6">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about food labeling, allergens, HACCP, FSSAI, EU FIC... (type 'menu' for templates)"
              className="flex-1 bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={isLoading || (getUserLimits(user.role).maxQueries !== -1 && user.queriesUsed >= getUserLimits(user.role).maxQueries)}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim() || (getUserLimits(user.role).maxQueries !== -1 && user.queriesUsed >= getUserLimits(user.role).maxQueries)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-500 disabled:to-gray-600 text-white p-3 rounded-lg transition-all duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Disclaimer BELOW typing space */}
        <div className="bg-transparent px-6 pb-6">
          <div className="max-w-4xl mx-auto p-3 bg-white/10 border border-white/20 rounded text-gray-200 text-xs">
            <div className="font-medium">{COPYRIGHT}</div>
            <div>{DISCLAIMER}</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
