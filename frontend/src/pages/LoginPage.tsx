import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Briefcase, Navigation, ArrowLeft, KeyRound, Mail, CheckCircle2, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { role = 'admin' } = useParams<{ role: UserRole }>();
  const navigate = useNavigate();
  const auth = useAuth();

  const roleConfig = {
    admin: {
      title: 'Platform Admin Portal',
      subtitle: 'Central Dispatch & Network Operations Authentication',
      accentColor: '#163832',
      bgHeader: 'bg-[#163832]',
      buttonBg: 'bg-[#163832] hover:bg-[#0F2622]',
      borderAccent: 'border-[#163832]',
      icon: Shield,
      defaultEmail: 'admin@karwaan.in',
      accountName: 'Ananya Deshmukh (Logistics Director)',
      targetRoute: '/admin',
    },
    business: {
      title: 'Business & Shipper Portal',
      subtitle: 'Agricultural Packhouse & Enterprise Account Sign In',
      accentColor: '#5C7A50',
      bgHeader: 'bg-[#5C7A50]',
      buttonBg: 'bg-[#5C7A50] hover:bg-[#435A3A]',
      borderAccent: 'border-[#5C7A50]',
      icon: Briefcase,
      defaultEmail: 'logistics@sahyadri.in',
      accountName: 'Rohit Kulkarni (Sahyadri Agro Farms)',
      targetRoute: '/business',
    },
    agent: {
      title: 'Delivery Agent Portal',
      subtitle: 'Reefer Route Fleet Captain Mobile Terminal',
      accentColor: '#D98E2B',
      bgHeader: 'bg-[#D98E2B]',
      buttonBg: 'bg-[#D98E2B] hover:bg-[#B5721C]',
      borderAccent: 'border-[#D98E2B]',
      icon: Navigation,
      defaultEmail: 'agent1@karwaan.in',
      accountName: 'Vikram Kadam (Reefer Route Captain)',
      targetRoute: '/agent',
    },
  }[role as UserRole] || {
    title: 'Karwaan Platform Portal',
    subtitle: 'Sign In to Proceed',
    accentColor: '#163832',
    bgHeader: 'bg-[#163832]',
    buttonBg: 'bg-[#163832] hover:bg-[#0F2622]',
    borderAccent: 'border-[#163832]',
    icon: Shield,
    defaultEmail: 'admin@karwaan.in',
    accountName: 'Ananya Deshmukh',
    targetRoute: '/admin',
  };

  const [email, setEmail] = useState(roleConfig.defaultEmail);
  const [password, setPassword] = useState('demo-access-2026');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(roleConfig.defaultEmail);
  }, [role, roleConfig.defaultEmail]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await auth.login(email, password, role);
      navigate(roleConfig.targetRoute);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('429') || msg.toLowerCase().includes('too many')) {
        setError('Too many login attempts. Please wait 30 seconds and try again.');
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail(roleConfig.defaultEmail);
    setPassword('demo-access-2026');
  };

  const IconComponent = roleConfig.icon;

  return (
    <div className="min-h-screen bg-[#F3F5F2] text-[#1A211E] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded bg-[#163832] flex items-center justify-center text-[#FFFFFF] font-display font-bold text-lg">
            K
          </div>
          <span className="font-display font-bold text-2xl text-[#163832] tracking-tight">
            KARWAAN
          </span>
        </Link>
        <p className="text-xs text-[#596560] font-mono">
          PERISHABLE CONSOLIDATION & MULTIMODAL NETWORK
        </p>
      </div>

      {/* Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] shadow-sm overflow-hidden">
          {/* Distinct Role Chrome Banner Header */}
          <div className={`${roleConfig.bgHeader} text-[#FFFFFF] p-6 flex items-center gap-3.5`}>
            <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg leading-tight">
                {roleConfig.title}
              </h2>
              <span className="text-xs text-white/80 font-sans">
                {roleConfig.subtitle}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Quick-Fill Demo Account Helper */}
            <div className="bg-[#F8FAF7] border border-[#E5EBE3] p-3 rounded text-xs flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-[#596560] block">
                  Demo Credentials for {role.toUpperCase()}
                </span>
                <span className="font-medium text-[#1A211E]">{roleConfig.accountName}</span>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#E5EBE3] border border-[#D6DCD4] rounded font-mono text-[11px] text-[#163832] font-semibold transition-colors"
              >
                Auto-fill
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded border border-red-100 font-mono text-[11px] font-medium text-center">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                  Email Address / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#596560]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@karwaan.in"
                    className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded pl-9 pr-3 py-2.5 text-xs font-mono focus:outline-none focus:border-[#163832]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                  Access Key / Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#596560]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded pl-9 pr-3 py-2.5 text-xs font-mono focus:outline-none focus:border-[#163832]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded ${roleConfig.buttonBg} text-[#FFFFFF] font-sans font-semibold text-xs tracking-wide transition-colors shadow-sm flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <span>Authenticating session...</span>
                  ) : (
                    <span>Log in as {role.toUpperCase()}</span>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-[#E5EBE3] flex items-center justify-between text-xs font-sans">
              <Link
                to="/select-role"
                className="text-[#596560] hover:text-[#163832] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to role selection</span>
              </Link>

              <span className="font-mono text-[11px] text-[#596560]">
                v1.0 Demo Build
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
