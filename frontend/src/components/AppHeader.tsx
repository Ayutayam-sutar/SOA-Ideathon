import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, UserRole } from '../types';
import { dataService } from '../services/dataService';
import { Shield, Briefcase, Navigation, ArrowRightLeft } from 'lucide-react';

interface AppHeaderProps {
  user: User | null;
  activeRole?: UserRole;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user, activeRole }) => {
  const navigate = useNavigate();

  // Premium Role Theming Configurations
  const roleThemes = {
    admin: {
      bg: 'bg-gradient-to-r from-[#112A26] to-[#163832]',
      border: 'border-[#245249]',
      roleLabel: 'PLATFORM ADMIN',
      roleBadge: 'bg-[#245249]/60 text-[#E5EBE3] border-[#5C7A50]/50 shadow-[0_0_15px_rgba(92,122,80,0.3)]',
      icon: Shield,
    },
    business: {
      bg: 'bg-gradient-to-r from-[#4A6340] to-[#5C7A50]',
      border: 'border-[#769669]',
      roleLabel: 'BUSINESS / SHIPPER',
      roleBadge: 'bg-[#435A3A]/60 text-[#F3F5F2] border-[#769669]/50 shadow-[0_0_15px_rgba(118,150,105,0.3)]',
      icon: Briefcase,
    },
    agent: {
      bg: 'bg-gradient-to-r from-[#B5721C] to-[#D98E2B]',
      border: 'border-[#EBB05E]/50',
      roleLabel: 'DELIVERY AGENT',
      roleBadge: 'bg-[#B5721C]/60 text-[#FFFFFF] border-[#EBB05E]/50 shadow-[0_0_15px_rgba(235,176,94,0.3)]',
      icon: Navigation,
    },
  };

  const currentRole = activeRole || user?.role || 'admin';
  const theme = roleThemes[currentRole];
  const IconComponent = theme.icon;

  return (
    <header className={`${theme.bg} text-[#FFFFFF] border-b ${theme.border} transition-all duration-500 ease-in-out select-none shadow-lg relative z-50 overflow-hidden`}>
      
      {/* Aesthetic Glass Highlights */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
      <div className="absolute -top-[50%] -left-[10%] w-[40%] h-[200%] bg-white/5 rotate-12 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand & Platform Identity */}
          {/* FIX: ml-12 clears the hamburger menu on mobile for admin. Reduced from ml-[3.5rem] to save space. */}
          <div className={`flex items-center gap-2.5 sm:gap-4 transition-all duration-300 ${currentRole === 'admin' ? 'ml-12 lg:ml-0' : 'ml-0'}`}>
            
            {/* FIX: Hide the logo link entirely on Admin Desktop (lg:hidden) because the sidebar already has it! */}
            <Link to="/" className={`flex items-center gap-2 sm:gap-3 group ${currentRole === 'admin' ? 'lg:hidden' : ''}`}>
              
              {/* Logo with Glowing Hover Effect */}
              {/* FIX: Scaled container down slightly on mobile (w-10 h-10) to prevent the header from breaking, while keeping your specific scale-[1.7] effect */}
              <div className="relative flex-shrink-0 group w-10 h-10 sm:w-12 sm:h-12">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Perfect Circle Boundary */}
                <div className="relative w-full h-full rounded-full overflow-hidden bg-white shadow-md border border-white/30">
                  <img 
                    src="/src/photos/karwaanlogo4.png" 
                    alt="Karwaan Logo" 
                    /* scale-[1.7] se pura logo emblem circle ke boundaries ko touch karega */
                    className="w-full h-full object-cover object-center transform scale-[1.7] transition-transform duration-300 group-hover:scale-[2.0] group-hover:rotate-6" 
                  />
                </div>
              </div>

              {/* Title & Badges */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-lg sm:text-2xl tracking-tight text-[#FFFFFF] drop-shadow-md">
                    KARWAAN
                  </span>
                  {/* Modernized pill badge - hidden on tiny phones, visible on tablets+ */}
                  <span className="hidden md:inline-flex items-center font-mono text-[9px] sm:text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-black/25 text-[#FFFFFF] border border-white/10 backdrop-blur-md shadow-inner">
                    AGRI-LOGISTICS
                  </span>
                </div>
                {/* Subtitle - visible only on desktops */}
                <span className="text-[11px] font-sans font-medium text-white/80 -mt-0.5 hidden xl:block tracking-wide">
                  Multimodal Perishables Consolidation Network
                </span>
              </div>
            </Link>

            {/* Current Role Glowing Banner Chip - Always visible on desktop */}
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border backdrop-blur-md ${theme.roleBadge} ${currentRole !== 'admin' ? 'ml-2' : ''} transition-all`}>
              <IconComponent className="w-4 h-4 opacity-90" />
              <span className="tracking-wide">{theme.roleLabel}</span>
            </div>
          </div>

          {/* Right Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* User Profile Capsule - Hidden on mobile to save space */}
            {user && (
              <div className="hidden sm:flex items-center gap-3 bg-black/15 pl-2 pr-3 py-1.5 rounded-full border border-white/10 shadow-inner backdrop-blur-sm hover:bg-black/25 transition-colors cursor-default">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm font-mono uppercase shadow-sm border border-white/10">
                  {(user.name || user.email || 'U').charAt(0)}
                </div>
                <div className="flex flex-col text-left justify-center">
                  <span className="text-xs font-bold text-[#FFFFFF] leading-tight tracking-wide">
                    {user.name || user.email}
                  </span>
                  <span className="text-[10px] text-white/70 font-mono leading-tight truncate max-w-[120px]">
                    {user.businessName || user.title || 'User Profile'}
                  </span>
                </div>
              </div>
            )}

            {/* Role Select Button */}
            <Link
              to="/select-role"
              className="text-xs font-bold bg-white text-[#1A211E] px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_15px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 flex items-center gap-1.5 sm:gap-2 active:scale-95"
            >
              <span className="hidden sm:inline">Change Role</span>
              <span className="sm:hidden">Switch</span>
              <ArrowRightLeft className="w-3.5 h-3.5 opacity-70" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};