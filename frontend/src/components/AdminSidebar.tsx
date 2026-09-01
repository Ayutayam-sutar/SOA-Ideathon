import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Route,
  ShieldAlert,
  Map,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  UserPlus,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from "../contexts/AuthContext";

interface AdminSidebarProps {
  shipmentCount?: number;
  clusterCount?: number;
  openIncidentCount: number;
  userName?: string;
  userRole?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  shipmentCount,
  clusterCount,
  openIncidentCount,
  userName = 'Lion Messiah',
  userRole = 'Platform Logistics Admin',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navigation = [
    { path: '/admin', label: 'Dashboard', description: 'Operations command center', icon: LayoutDashboard },
    { path: '/admin/shipments', label: 'Shipments', description: 'Active cargo network', icon: Package, count: shipmentCount },
    { path: '/admin/clusters', label: 'Consolidation', description: 'Cargo clusters', icon: Layers, count: clusterCount },
    { path: '/admin/routes', label: 'Routes', description: 'Decision engine', icon: Route },
    { path: '/admin/incidents', label: 'Incidents', description: 'Disruptions & alerts', icon: ShieldAlert, count: openIncidentCount, danger: openIncidentCount > 0 },
    { path: '/admin/map', label: 'Network Map', description: 'Live logistics network', icon: Map },
  ];

  const accountRequests = [
    { path: '/admin/shipper-requests', label: 'Shipper Requests', description: 'New registrations', icon: UserPlus },
    // { path: '/admin/agent-requests', label: 'Agent Requests', description: 'New driver approvals', icon: UserCheck },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile menu button - sits in the empty space of the AppHeader */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3.5 sm:top-5 z-[60] flex h-9 w-9 items-center justify-center rounded-lg border-none bg-white/10 text-white hover:bg-white/20 backdrop-blur-md shadow-sm transition-colors lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[70] bg-[#102C27]/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed left-0 top-0 z-[80] flex flex-col
          border-r border-[#E0E5DE] bg-[#F7F9F5] shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          transition-all duration-300 ease-out 
          h-screen lg:sticky lg:top-0 lg:z-40 lg:h-[calc(100vh-5rem)] 
          ${collapsed ? 'w-[88px]' : 'w-[280px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        
        {/* Desktop collapse button - Perfectly aligned with the "Operations" text padding */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 hidden h-6 w-6 items-center justify-center rounded-full border border-[#D6DCD4] bg-white text-[#596560] shadow-md transition-all hover:border-[#163832] hover:text-[#163832] hover:scale-110 lg:flex z-50"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Mobile-Only Header - Gives the drawer a polished look on phones */}
        <div className="flex h-16 items-center justify-between border-b border-[#E0E5DE] px-5 lg:hidden bg-white shrink-0">
          <span className="font-display text-lg font-extrabold text-[#163832]">KARWAAN</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-[#596560] hover:bg-[#E5EBE3] hover:text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          {!collapsed && (
            <div className="mb-3 px-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#89938E] mt-1">
              Operations
            </div>
          )}

          <div className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNavigation(item.path)}
                  title={collapsed ? item.label : undefined}
                  className={`
                    group relative flex w-full items-center rounded-xl text-left transition-all duration-200
                    ${collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'}
                    ${active 
                      ? item.danger 
                        ? 'bg-[#FCEBE6] text-[#B3462C] shadow-sm' 
                        : 'bg-gradient-to-r from-[#163832] to-[#1D4A42] text-white shadow-md' 
                      : item.danger 
                        ? 'text-[#B3462C] hover:bg-[#FCEBE6]' 
                        : 'text-[#596560] hover:bg-white hover:text-[#163832] hover:shadow-sm border border-transparent hover:border-[#E0E5DE]'
                    }
                  `}
                >
                  {/* Active Indicator Strip */}
                  {active && (
                    <span className={`absolute left-0 top-1/2 h-7 w-[4px] -translate-y-1/2 rounded-r-full ${item.danger ? 'bg-[#B3462C]' : 'bg-[#D98E2B]'}`} />
                  )}

                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${active ? (item.danger ? 'bg-[#B3462C]/10' : 'bg-white/10') : 'bg-[#E9EEE8] group-hover:bg-[#DCE7DC]'}`}>
                    <Icon className={`h-[18px] w-[18px] ${active ? (item.danger ? 'text-[#B3462C]' : 'text-white') : (item.danger ? 'text-[#B3462C]' : 'text-[#596560] group-hover:text-[#163832]')}`} />
                  </div>

                  {!collapsed && (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className={`truncate text-[13px] font-semibold tracking-wide ${active ? 'font-bold' : ''}`}>
                          {item.label}
                        </div>
                        <div className={`mt-0.5 truncate text-[10px] ${active ? (item.danger ? 'text-[#B3462C]/80' : 'text-white/70') : 'text-[#89938E]'}`}>
                          {item.description}
                        </div>
                      </div>

                      {typeof item.count === 'number' && (
                        <span className={`min-w-[24px] rounded-full px-2 py-0.5 text-center font-mono text-[10px] font-bold shadow-sm ${item.danger && item.count > 0 ? 'bg-[#B3462C] text-white' : active ? 'bg-white/15 text-white' : 'bg-white text-[#163832] border border-[#E0E5DE]'}`}>
                          {item.count}
                        </span>
                      )}
                    </>
                  )}

                  {collapsed && typeof item.count === 'number' && item.count > 0 && (
                    <span className={`absolute right-1 top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 font-mono text-[9px] font-bold shadow-sm ${item.danger ? 'bg-[#B3462C] text-white' : 'bg-[#163832] text-white'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Account Requests */}
          {!collapsed && (
            <div className="mb-3 mt-8 px-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#89938E]">
              Account Requests
            </div>
          )}

          <div className="space-y-1.5 mt-2">
            {accountRequests.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNavigation(item.path)}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex w-full items-center rounded-xl text-left transition-all duration-200 ${collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'} ${active ? 'bg-gradient-to-r from-[#163832] to-[#1D4A42] text-white shadow-md' : 'text-[#596560] hover:bg-white hover:text-[#163832] hover:shadow-sm border border-transparent hover:border-[#E0E5DE]'}`}
                >
                  {active && <span className="absolute left-0 top-1/2 h-7 w-[4px] -translate-y-1/2 rounded-r-full bg-[#D98E2B]" />}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${active ? 'bg-white/10' : 'bg-[#E9EEE8] group-hover:bg-[#DCE7DC]'}`}>
                    <Icon className={`h-[18px] w-[18px] ${active ? 'text-white' : 'text-[#596560] group-hover:text-[#163832]'}`} />
                  </div>
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[13px] font-semibold tracking-wide ${active ? 'font-bold' : ''}`}>{item.label}</div>
                      <div className={`mt-0.5 truncate text-[10px] ${active ? 'text-white/70' : 'text-[#89938E]'}`}>{item.description}</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Footer Profile */}
        <div className="shrink-0 border-t border-[#E0E5DE] bg-white p-4">
          <div className={`flex items-center rounded-2xl border border-[#E0E5DE] bg-[#F7F9F5] hover:bg-[#F0F4EF] transition-colors cursor-pointer ${collapsed ? 'justify-center p-2' : 'gap-3 p-3'}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#163832] text-white font-display text-sm font-bold shadow-sm">
              {userName.split(' ').map((name) => name[0]).slice(0, 2).join('')}
            </div>

            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-extrabold text-[#163832]">{userName}</p>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-[#6B7771]">{userRole}</p>
                </div>
                <button
                  type="button"
                  title="Log out"
                  onClick={handleLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#89938E] hover:bg-[#E5EBE3] hover:text-[#B3462C] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          
          {!collapsed && (
            <div className="mt-3 flex items-center justify-between px-2 opacity-70">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#163832]">KARWAAN SYSTEM</span>
              <span className="font-mono text-[9px] font-bold text-[#89938E]">v2.1.0</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};