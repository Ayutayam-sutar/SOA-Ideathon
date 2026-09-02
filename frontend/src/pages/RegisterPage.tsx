import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Briefcase, Navigation, ArrowLeft, Mail, Lock, Building2, User, Phone } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { role = 'agent' } = useParams<{ role?: string }>();
  const navigate = useNavigate();

  const isAgent = role === 'agent';

  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic Validation
    if (!contactName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    if (!isAgent && !businessName.trim()) {
      setError('Business / Organization name is required.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    try {
      await authService.register({
        businessName: isAgent ? undefined : businessName,
        contactName: isAgent ? (phone.trim() ? `${contactName} (${phone})` : contactName) : contactName,
        email,
        password,
        role: isAgent ? 'agent' : 'business'
      });
      // Redirect to login on success
      navigate(isAgent ? '/login/agent' : '/login/business');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F2] text-[#1A211E] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm border border-[#D6DCD4] flex-shrink-0 flex items-center justify-center p-0.5">
            <img src="/karwaan-logo.png" alt="Karwaan Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-bold text-2xl text-[#163832] tracking-tight">
            KARWAAN
          </span>
        </Link>
        <p className="text-xs text-[#596560] font-mono">
          PERISHABLE CONSOLIDATION & MULTIMODAL NETWORK
        </p>
      </div>

      {/* Register Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FFFFFF] border border-[#D6DCD4] rounded-[6px] shadow-sm overflow-hidden">
          {/* Role-Specific Chrome Banner Header */}
          <div className={`${isAgent ? 'bg-[#D98E2B]' : 'bg-[#5C7A50]'} text-[#FFFFFF] p-6 flex items-center gap-3.5`}>
            <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center">
              {isAgent ? <Navigation className="w-5 h-5 text-white" /> : <Briefcase className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg leading-tight">
                {isAgent ? 'Delivery Agent Registration' : 'Create Business Account'}
              </h2>
              <span className="text-xs text-white/80 font-sans">
                {isAgent ? 'Reefer Route Fleet Captain Mobile Terminal Sign Up' : 'Agricultural Packhouse & Enterprise Sign Up'}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded border border-red-100 font-mono text-[11px] font-medium text-center">
                  {error}
                </div>
              )}
              
              {!isAgent && (
                <div>
                  <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                    Business / Organization Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#596560]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      placeholder="FreshFarm Organics"
                      className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded pl-9 pr-3 py-2.5 text-xs font-mono focus:outline-none focus:border-[#163832]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                  {isAgent ? 'Agent / Captain Full Name' : 'Contact Person Name'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#596560]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    placeholder={isAgent ? 'Vikram Kadam' : 'Rohit Kulkarni'}
                    className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded pl-9 pr-3 py-2.5 text-xs font-mono focus:outline-none focus:border-[#163832]"
                  />
                </div>
              </div>

              {isAgent && (
                <div>
                  <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                    Contact Phone / Fleet Terminal ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#596560]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 94370 00199"
                      className="w-full bg-[#F3F5F2] border border-[#D6DCD4] rounded pl-9 pr-3 py-2.5 text-xs font-mono focus:outline-none focus:border-[#163832]"
                    />
                  </div>
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
                    placeholder={isAgent ? 'agent@karwaan.in' : 'name@company.in'}
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

              <div>
                <label className="block font-mono text-[11px] font-bold text-[#163832] uppercase mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#596560]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  className={`w-full py-3 px-4 rounded ${isAgent ? 'bg-[#D98E2B] hover:bg-[#B5721C]' : 'bg-[#5C7A50] hover:bg-[#435A3A]'} text-[#FFFFFF] font-sans font-semibold text-xs tracking-wide transition-colors shadow-sm flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <span>Registering Account...</span>
                  ) : (
                    <span>{isAgent ? 'Register as Delivery Agent' : 'Create Business Account'}</span>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <span className="text-[#596560]">Already registered? </span>
                <Link to={isAgent ? '/login/agent' : '/login/business'} className={`${isAgent ? 'text-[#D98E2B]' : 'text-[#5C7A50]'} font-bold hover:underline`}>
                  Log in here
                </Link>
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
                v1.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
