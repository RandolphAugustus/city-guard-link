"use client";

import { useState } from "react";
import { ReportSubmit } from "./ReportSubmit";
import { ReportList } from "./ReportList";
import { Shield, FileText } from "lucide-react";

export function CityGuardApp() {
  const [activeTab, setActiveTab] = useState<"submit" | "list">("submit");

  return (
    <>
      <div className="tabs">
        <button
          className={`tab ${activeTab === "submit" ? "active" : ""}`}
          onClick={() => setActiveTab("submit")}
        >
          <Shield size={20} />
          <span>Submit Report</span>
        </button>
        <button
          className={`tab ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          <FileText size={20} />
          <span>My Reports</span>
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "submit" && <ReportSubmit />}
        {activeTab === "list" && <ReportList />}
      </div>
    </>
  );
}
