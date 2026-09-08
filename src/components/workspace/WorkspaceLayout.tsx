import React from 'react';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { FilterBar } from '../FilterBar';

interface WorkspaceLayoutProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
  showFilterBar: boolean;
  children: React.ReactNode;
}

/**
 * Shell layout for the main TaskFlow workspace.
 * Manages the collapsible dark sidebar, top header bar, contextual filter bar, and view container.
 */
export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
  showFilterBar,
  children
}) => {
  return (
    <div className="flex h-screen w-full bg-[#0d0d0d] text-slate-100 font-sans overflow-hidden antialiased selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Sleek Dark Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={onCloseSidebar} />

      {/* Main Workspace Column */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0d0d0d]">
        {/* Top Header */}
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={onToggleSidebar} />

        {/* Contextual Filter Bar */}
        {showFilterBar && <FilterBar />}

        {/* Dynamic View Body */}
        {children}
      </main>
    </div>
  );
};
