import { useState, useCallback, useRef } from "react";
import { RoleLayout, type TabDef, type MenuExtra } from "./RoleLayout";
import type { LayoutMode, Role } from "./constants";
import type { ChangeResult } from "./useAuth";
import { ManagerDashboard } from "./ManagerDashboard";
import { ManagerClients } from "./ManagerClients";
import { ManagerProjects } from "./ManagerProjects";
import { ManagerCalculator } from "./ManagerCalculator";
import { ManagerProfile } from "./ManagerProfile";
import { ManagerServiceCatalog } from "./ManagerServiceCatalog";
import { insertProject, type Project } from "./useProjects";

const MENU_EXTRAS: MenuExtra[] = [
  { label: "Creator Profile", Component: ManagerProfile },
  { label: "Service Catalog", Component: ManagerServiceCatalog, interceptClose: true },
];

export function ManagerPage(props: {
  mode: LayoutMode;
  onSignOut: () => void;
  changePassword: (current: string, next: string) => Promise<ChangeResult>;
  switchRole: (target: Role, password?: string) => Promise<{ ok: boolean; needsPassword?: boolean; message?: string }>;
}) {
  const [activeTab,      setActiveTab]      = useState("dashboard");
  const [highlightId,    setHighlightId]    = useState<string | undefined>(undefined);
  const [attachToProject,setAttachToProject]= useState<Project | null>(null);

  const onSaveToProjects = useCallback((id: string) => {
    setHighlightId(id);
    setAttachToProject(null);
    setActiveTab("projects");
  }, []);

  // Called from ProjectRow "Build Quote →" button
  const onOpenCalc = useCallback((pr: Project) => {
    setAttachToProject(pr);
    setActiveTab("calculator");
  }, []);

  const ProjComponent  = useCallback(() => <ManagerProjects  highlightId={highlightId} onOpenCalc={onOpenCalc} />, [highlightId, onOpenCalc]);
  const CalcComponent  = useCallback(() => <ManagerCalculator onSaveToProjects={onSaveToProjects} saveProject={insertProject} attachToProject={attachToProject} />, [onSaveToProjects, attachToProject]);
  const DashComponent  = useCallback(() => <ManagerDashboard />, []);
  const ClntComponent  = useCallback(() => <ManagerClients  />,  []);

  const TABS: TabDef[] = [
    { id: "dashboard",  label: "Dashboard",  Component: DashComponent  },
    { id: "calculator", label: "Calculator", Component: CalcComponent  },
    { id: "projects",   label: "Projects",   Component: ProjComponent  },
    { id: "clients",    label: "Clients",    Component: ClntComponent  },
  ];

  return (
    <RoleLayout
      role="manager"
      tabs={TABS}
      menuExtras={MENU_EXTRAS}
      activeTab={activeTab}
      onTabChange={(id) => {
        setActiveTab(id);
        // Clear highlight when navigating away so next visit is clean
        if (id !== "projects") setHighlightId(undefined);
      }}
      {...props}
    />
  );
}
