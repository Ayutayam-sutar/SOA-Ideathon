import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Briefcase, Navigation, ArrowRight, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'admin' as UserRole,
      title: 'Platform Admin',
      subtitle: 'Central Logistics & Dispatch Operations',
      description: 'Orchestrate network consolidation clusters, track live cold-chain spoilage risks, inspect multimodal road/rail explanations, and trigger incident-driven route re-optimizations.',
      accentColor: '#163832',
      borderClass: 'border-[#163832]/30 hover:border-[#163832]',
      badgeBg: 'bg-[#163832] text-[#FFFFFF]',
      bgTint: 'bg-[#163832]/5',
      icon: Shield,
      buttonBg: 'bg-[#163832] hover:bg-[#0F2622] text-[#FFFFFF]',
      demoAccount: 'admin@karwaan.in (Operations Lead)',
    },
    {
      id: 'business' as UserRole,
      title: 'Business / Shipper',
      subtitle: 'Farms, Packhouses & Perishable Exporters',
      description: 'Submit new cold-chain shipment requests, track your consolidated consignments, monitor biological freshness decay, and audit transparent cost & carbon savings.',
      accentColor: '#5C7A50',
      borderClass: 'border-[#5C7A50]/30 hover:border-[#5C7A50]',
      badgeBg: 'bg-[#5C7A50] text-[#FFFFFF]',
      bgTint: 'bg-[#5C7A50]/5',
      icon: Briefcase,
      buttonBg: 'bg-[#5C7A50] hover:bg-[#435A3A] text-[#FFFFFF]',
      demoAccount: 'logistics@sahyadri.in (Sahyadri Agro)',
    },
    {
      id: 'agent' as UserRole,
      title: 'Delivery Agent',
      subtitle: 'Reefer Route Fleet Captain (Mobile Interface)',
      description: 'Mobile-first stop checklist for active delivery runs, real-time reefer temperature monitoring, quick stop completion, and one-tap mid-transit incident reporting.',
      accentColor: '#D98E2B',
      borderClass: 'border-[#D98E2B]/40 hover:border-[#D98E2B]',
      badgeBg: 'bg-[#D98E2B] text-[#FFFFFF]',
      bgTint: 'bg-[#D98E2B]/5',
      icon: Navigation,
      buttonBg: 'bg-[#D98E2B] hover:bg-[#B5721C] text-[#FFFFFF]',
      demoAccount: 'agent1@karwaan.in (Reefer Captain)',
    },
  ];

  const visibleRoles = roles; // All three roles are now active

  return (
    <div className="min-h-screen bg-[#F3F5F2] text-[#1A211E] flex flex-col">
      {/* Header */}
      <header className="bg-[#163832] text-[#FFFFFF] py-4 px-4 sm:px-8 border-b border-[#245249]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white shadow-sm border border-white/20 flex-shrink-0 flex items-center justify-center p-0.5">
              <img src="/karwaan-logo.png" alt="Karwaan Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-xl text-[#FFFFFF]">KARWAAN</span>
          </Link>

          <Link
            to="/"
            className="text-xs text-white/80 hover:text-white flex items-center gap-1 font-sans"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="font-mono text-xs uppercase font-bold text-[#5C7A50] tracking-widest">
            Role-Based Access Control
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#163832]">
            Select your operational role
          </h1>
          <p className="text-sm text-[#596560] leading-relaxed">
            Karwaan provides purpose-built interfaces for platform administrators,
            agricultural shippers, and reefer fleet drivers.
          </p>
        </div>

        {/* 3 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          {visibleRoles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                onClick={() => navigate(`/login/${role.id}`)}
                className={`bg-[#FFFFFF] border-2 ${role.borderClass} rounded-[8px] p-8 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group select-none`}
              >
                <div className="space-y-4">
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl ${role.badgeBg} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#596560]">
                      ROLE: {role.id.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-2xl text-[#163832] group-hover:text-[#0F2622]">
                      {role.title}
                    </h3>
                    <p className="text-xs font-mono font-medium text-[#596560] mt-0.5">
                      {role.subtitle}
                    </p>
                  </div>

                  <p className="text-sm text-[#596560] leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-[#E5EBE3] space-y-3">
                  <div className="text-[12px] font-mono text-[#596560]">
                    <span className="text-[#1A211E] font-semibold">Account:</span> {role.demoAccount}
                  </div>

                  <button
                    type="button"
                    className={`w-full py-3 px-4 rounded-xl ${role.buttonBg} text-sm font-sans font-semibold tracking-wide flex items-center justify-center gap-2 transition-colors shadow-sm`}
                  >
                    <span>Proceed as {role.title.split('/')[0].trim()}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
