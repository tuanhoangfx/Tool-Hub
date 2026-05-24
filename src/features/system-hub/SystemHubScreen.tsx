import { useEffect, useState } from "react";
import { MaterialIcon } from "../../components";
import { DesignTemplateHub } from "./design-template/DesignTemplateHub";
import { SystemTabs, readSystemTab, type SystemTab } from "./components/SystemTabs";
import { SystemOverviewPanel } from "./SystemOverviewPanel";
import "./system-hub.css";

export function SystemHubScreen() {
  const [tab, setTab] = useState<SystemTab>(() => readSystemTab());

  useEffect(() => {
    const onPop = () => setTab(readSystemTab());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="system-hub anim-fade">
      <div className="system-hub-head">
        <div className="system-hub-title">
          <MaterialIcon name="settings" size={20} />
          <h1>System</h1>
          <span>Overview · Design Template</span>
        </div>
        <SystemTabs tab={tab} onTab={setTab} />
      </div>
      <div className="system-hub-body custom-scrollbar">
        {tab === "overview" && <SystemOverviewPanel />}
        {tab === "template" && <DesignTemplateHub />}
      </div>
    </div>
  );
}
