import React, { useState } from 'react';
import { User, Lock, Mail, MessageCircle, Send, LogOut, Crown, AlertCircle, Shield, Settings, Users, ArrowLeft, CreditCard } from 'lucide-react';

const MAX_QUERIES_EXPLORER = 5;

// Security: Input sanitization helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
};

// Security: Simple email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const App = () => {
  const [currentView, setCurrentView] = useState('login'); // login, chat, admin, upgrade
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // User database - stored in component state
  const [userDatabase, setUserDatabase] = useState([
    {
      id: 1,
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
      queriesUsed: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      email: 'explorer@example.com', 
      password: 'explorer123',
      name: 'Explorer User',
      role: 'explorer',
      queriesUsed: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      email: 'pro@example.com',
      password: 'pro123', 
      name: 'Pro User',
      role: 'pro',
      queriesUsed: 15,
      createdAt: new Date().toISOString()
    }
  ]);

  // Get user limits based on role
  const getUserLimits = (role) => {
    switch (role) {
      case 'admin':
        return { maxQueries: -1, canManageUsers: true };
      case 'pro':
        return { maxQueries: -1, canManageUsers: false };
      case 'explorer':
      default:
        return { maxQueries: MAX_QUERIES_EXPLORER, canManageUsers: false };
    }
  };

  const handleSignup = async () => {
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (!isValidEmail(signupEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    if (signupPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (userDatabase.find(u => u.email === signupEmail.toLowerCase())) {
      alert('User with this email already exists');
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newUser = {
        id: Date.now(),
        email: signupEmail.toLowerCase(),
        password: signupPassword,
        name: signupName.trim(),
        role: 'explorer',
        queriesUsed: 0,
        createdAt: new Date().toISOString()
      };

      setUserDatabase(prev => [...prev, newUser]);
      setUser(newUser);
      setCurrentView('chat');
      
      // Clear signup form
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      
      console.log(`New explorer user created: ${newUser.email}`);
      
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (!isValidEmail(loginEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const foundUser = userDatabase.find(
        u => u.email === loginEmail.toLowerCase() && u.password === loginPassword
      );
      
      if (foundUser) {
        setUser(foundUser);
        setCurrentView('chat');
        
        // Clear login form
        setLoginEmail('');
        setLoginPassword('');
        
        console.log(`User ${foundUser.email} logged in as ${foundUser.role}`);
      } else {
        alert('Invalid email or password');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
    setChatMessages([]);
    setLoginEmail('');
    setLoginPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
  };

  const handleUpgradeRequest = () => {
    setCurrentView('upgrade');
  };

  const processUpgrade = async () => {
    setIsLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user role to pro
      const updatedUser = { ...user, role: 'pro' };
      setUser(updatedUser);
      
      // Update in database
      setUserDatabase(prev => prev.map(u => 
        u.id === user.id ? updatedUser : u
      ));
      
      alert('Congratulations! You have been upgraded to Pro. You now have unlimited queries!');
      setCurrentView('chat');
      
    } catch (error) {
      alert('Upgrade failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = (userId, newRole) => {
    setUserDatabase(prev => prev.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ));
    
    if (user && user.id === userId) {
      setUser(prev => ({ ...prev, role: newRole }));
    }
    
    alert(`User role updated to ${newRole}`);
  };

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

    try {
      // Build OpenAI-style messages from existing chat, plus this new message
      const oaMessages = [
        ...chatMessages.map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        { role: 'user', content: sanitizedMessage }
      ];

      // Same-origin call to Vercel API route
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: oaMessages })
      });

      if (!resp.ok) throw new Error(`API ${resp.status}`);

      const data = await resp.json();
      const assistantText = data.reply || 'Sorry, I could not generate a response.';

      setChatMessages(prev => [...prev, { type: 'bot', content: assistantText }]);

      // Update query count
      const updatedUser = { ...user, queriesUsed: user.queriesUsed + 1 };
      setUser(updatedUser);
      setUserDatabase(prev => prev.map(u => 
        u.id === user.id ? updatedUser : u
      ));
      
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, an error occurred. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'pro': return 'text-yellow-400';
      case 'explorer': return 'text-green-400';
      default: return 'text-gray-400';
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

  // LOGIN/SIGNUP VIEW
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Food Compliance Copilot</h1>
            <p className="text-gray-300">AI-Powered Compliance Assistant</p>
          </div>

          <div className="space-y-4">
            {showSignup && (
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  maxLength="50"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="email"
                placeholder="Email Address"
                value={showSignup ? signupEmail : loginEmail}
                onChange={(e) => showSignup ? setSignupEmail(e.target.value) : setLoginEmail(e.target.value)}
                maxLength="100"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                placeholder="Password"
                value={showSignup ? signupPassword : loginPassword}
                onChange={(e) => showSignup ? setSignupPassword(e.target.value) : setLoginPassword(e.target.value)}
                maxLength="50"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={showSignup ? handleSignup : handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-200"
            >
              {isLoading ? 'Processing...' : (showSignup ? 'Create Explorer Account' : 'Sign In')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              {showSignup ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => {
                  setShowSignup(!showSignup);
                  setLoginEmail('');
                  setLoginPassword('');
                  setSignupName('');
                  setSignupEmail('');
                  setSignupPassword('');
                }}
                className="ml-2 text-blue-400 hover:text-blue-300 font-semibold"
              >
                {showSignup ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>

          {/* Demo accounts info */}
          <div className="mt-6 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
            <p className="text-sm text-blue-200 mb-2">Demo Accounts:</p>
            <p className="text-xs text-blue-300">Admin: admin@example.com / admin123</p>
            <p className="text-xs text-blue-300">Explorer: explorer@example.com / explorer123</p>
            <p className="text-xs text-blue-300">Pro: pro@example.com / pro123</p>
          </div>

          {/* Role explanation */}
          <div className="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-400/30">
            <p className="text-xs text-green-200">
              <strong>New users start as Explorer</strong> (5 free queries). 
              Upgrade to Pro for unlimited queries. Admins can manage all users.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // UPGRADE VIEW
  if (currentView === 'upgrade') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-lg border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Upgrade to Pro</h1>
            <p className="text-gray-300">Unlock unlimited queries and advanced features</p>
          </div>

          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-2">Current Plan: Explorer</h3>
              <p className="text-green-200 text-sm">
                Queries used: {user.queriesUsed}/{MAX_QUERIES_EXPLORER}
              </p>
            </div>

            {/* Pro Plan Benefits */}
            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-3">Pro Plan Benefits:</h3>
              <ul className="text-yellow-200 text-sm space-y-2">
                <li>✓ Unlimited compliance queries</li>
                <li>✓ Priority response time</li>
                <li>✓ Advanced regulatory insights</li>
                <li>✓ Document analysis support</li>
                <li>✓ 24/7 technical support</li>
              </ul>
            </div>

            {/* Pricing */}
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 text-center">
              <h3 className="text-blue-400 font-semibold mb-2">Pro Plan Pricing</h3>
              <div className="text-3xl font-bold text白 mb-1">$29<span className="text-lg text-gray-300">/month</span></div>
              <p className="text-gray-300 text-sm">Cancel anytime</p>
            </div>

            {/* Payment Simulation */}
            <div className="space-y-4">
              <button
                onClick={processUpgrade}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Upgrade Now (Demo)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCurrentView('chat')}
                className="w-full bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 font-semibold py-3 rounded-lg transition-all duration-200"
              >
                Maybe Later
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-500/20 rounded-lg border border-gray-400/30">
              <p className="text-xs text-gray-300 text-center">
                This is a demo upgrade process. In a real application, this would integrate with Stripe, PayPal, or another payment processor.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN VIEW
  if (currentView === 'admin' && user && getUserLimits(user.role).canManageUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-800 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-red-400 to-pink-500 w-12 h-12 rounded-full flex items-center justify-center">
                  <Settings className="w-6 h-6 text白" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text白">Admin Dashboard</h1>
                  <p className="text-gray-300">User Management & System Control</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentView('chat')}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Chat</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text白 mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Management
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userDatabase.filter(u => u.id !== user.id).map(dbUser => (
                <div key={dbUser.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text白 font-medium">{dbUser.name}</h3>
                      <p className="text-gray-400 text-sm">{dbUser.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getRoleColor(dbUser.role)} bg-white/10`}>
                      {dbUser.role.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-300 text-sm">
                      Queries: <span className="font-medium">{dbUser.queriesUsed}</span>
                      {dbUser.role === 'explorer' && ` / ${MAX_QUERIES_EXPLORER}`}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Created: {new Date(dbUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text白 text-sm font-medium">Change Role:</p>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => updateUserRole(dbUser.id, 'explorer')}
                        disabled={dbUser.role === 'explorer'}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          dbUser.role === 'explorer' 
                            ? 'bg-green-500/40 text-green-300 cursor-not-allowed' 
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                      >
                        Explorer
                      </button>
                      <button
                        onClick={() => updateUserRole(dbUser.id, 'pro')}
                        disabled={dbUser.role === 'pro'}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          dbUser.role === 'pro' 
                            ? 'bg-yellow-500/40 text-yellow-300 cursor-not-allowed' 
                            : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        }`}
                      >
                        Pro
                      </button>
                      <button
                        onClick={() => updateUserRole(dbUser.id, 'admin')}
                        disabled={dbUser.role === 'admin'}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          dbUser.role === 'admin' 
                            ? 'bg-red-500/40 text-red-300 cursor-not-allowed' 
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        Admin
                      </button>
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

  // CHAT VIEW
  if (currentView === 'chat' && user) {
    const userLimits = getUserLimits(user.role);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text白" />
            </div>
            <div>
              <h1 className="text白 font-semibold">Food Compliance Copilot</h1>
              <p className="text-gray-300 text-sm">AI-Powered Regulatory Guidance</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text白 font-medium flex items-center">
                <span className={getRoleColor(user.role)}>{getRoleIcon(user.role)}</span>
                <span className="ml-1">{user.name}</span>
                <span className={`ml-2 text-xs ${getRoleColor(user.role)}`}>
                  {user.role.toUpperCase()}
                </span>
              </p>
              <p className="text-gray-300 text-sm">
                {userLimits.maxQueries === -1 
                  ? `${user.queriesUsed} queries used` 
                  : `${user.queriesUsed}/${userLimits.maxQueries} queries used`}
              </p>
            </div>

            {/* Admin Dashboard button */}
            {userLimits.canManageUsers && (
              <button
                onClick={() => setCurrentView('admin')}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded-lg transition-colors text-sm flex items-center space-x-1"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}

            {/* Upgrade button for explorers */}
            {user.role === 'explorer' && (
              <button
                onClick={handleUpgradeRequest}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1 rounded-lg transition-colors text-sm flex items-center space-x-1"
              >
                <Crown className="w-4 h-4" />
                <span>Upgrade</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text白" />
              </div>
              <h3 className="text白 text-xl font-semibold mb-2">Welcome to Food Compliance Copilot</h3>
              <p className="text-gray-300 max-w-md mx-auto">
                Ask anything about FDA, FSMA, HACCP, FSSAI, EU FIC, Codex, allergens, and labeling.
              </p>
            </div>
          )}

          {chatMessages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text白'
                    : 'bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div>Thinking</div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#60a5fa',
                      animation: 'typing-bounce 1.4s infinite',
                      animationDelay: '0s'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#60a5fa',
                      animation: 'typing-bounce 1.4s infinite',
                      animationDelay: '0.2s'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#60a5fa',
                      animation: 'typing-bounce 1.4s infinite',
                      animationDelay: '0.4s'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Query Limit Warning */}
        {user.role === 'explorer' && user.queriesUsed >= userLimits.maxQueries - 1 && (
          <div className="mx-6 mb-4 p-3 bg-orange-500/20 border border-orange-400/30 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <p className="text-orange-200 text-sm">
              {user.queriesUsed >= userLimits.maxQueries
                ? 'You have reached your query limit. Upgrade to Pro for unlimited access!'
                : `You have ${userLimits.maxQueries - user.queriesUsed} queries remaining.`}
            </p>
            {user.queriesUsed >= userLimits.maxQueries && (
              <button
                onClick={handleUpgradeRequest}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1 rounded text-sm ml-2"
              >
                Upgrade Now
              </button>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-6">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about food labeling, allergens, HACCP, FSSAI, EU FIC..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text白 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || (userLimits.maxQueries !== -1 && user.queriesUsed >= userLimits.maxQueries)}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim() || (userLimits.maxQueries !== -1 && user.queriesUsed >= userLimits.maxQueries)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text白 p-3 rounded-lg transition-all duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
