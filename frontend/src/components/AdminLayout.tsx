import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { AppHeader } from "./AppHeader";
import { AdminSidebar } from "./AdminSidebar";
import { dataService } from "../services/dataService";

import { IncidentReport, User } from "../types";

export const AdminLayout: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const u = await dataService.getActiveUser();
      if (u) setUser(u);
      setIncidents(await dataService.getIncidents());
    };
    loadData();
  }, []);

  const openIncidentsCount = incidents.filter(
    (incident) => incident.status === "open"
  ).length;

  return (
    <div className="min-h-screen bg-[#F3F5F2] text-[#1A211E] font-sans">
      <AppHeader user={user} activeRole="admin" />

      <div className="flex min-h-[calc(100vh-80px)]">
        <AdminSidebar openIncidentCount={openIncidentsCount} />

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};