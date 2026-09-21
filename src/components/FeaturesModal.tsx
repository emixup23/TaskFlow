import React, { useState, useMemo, useEffect } from 'react';
import {
  Sliders,
  X,
  Search,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
  Workflow,
  CalendarCheck2,
  Ticket,
  Table,
  GitCommit,
  Network,
  MessageSquare,
  Video,
  FileSpreadsheet,
  StickyNote,
  Trophy,
  BarChart3,
  Mic,
  RefreshCw,
  Award,
  Bell,
  PlusCircle,
  Users,
  Shield,
  History,
  Database,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useFeatures, AppFeature, FeatureCategory } from '../context/FeatureContext';
import { useTasks } from '../context/TaskContext';

export const FeaturesModal: React.FC = () => {
  const {
    features,
    isFeatureVisible,
    toggleFeature,
    setFeatureVisible,
    showAllFeatures,
    resetFeatures,
    visibleCount,
    totalCount,
    isFeaturesModalOpen,
    setIsFeaturesModalOpen
  } = useFeatures();

  const { viewMode, setViewMode } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | FeatureCategory>('all');
  const [justToggledId, setJustToggledId] = useState<string | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFeaturesModalOpen) {
        setIsFeaturesModalOpen(false);
      }
    };
    if (isFeaturesModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFeaturesModalOpen, setIsFeaturesModalOpen]);

  // If the current viewMode was toggled to hidden, switch to the first available visible view
  const handleToggle = (feature: AppFeature) => {
    const currentVis = isFeatureVisible(feature.id);
    const willBeVisible = !currentVis;
    toggleFeature(feature.id);

    setJustToggledId(feature.id);
    setTimeout(() => setJustToggledId(null), 1200);

    // If hiding the active view mode, switch to another visible view
    if (!willBeVisible && feature.isViewMode && feature.viewMode === viewMode) {
      const remainingVisibleView = features.find(
        (f) => f.isViewMode && f.id !== feature.id && isFeatureVisible(f.id)
      );
      if (remainingVisibleView && remainingVisibleView.viewMode) {
        setViewMode(remainingVisibleView.viewMode);
      } else {
        setViewMode('kanban');
      }
    }
  };

  // Render appropriate Lucide icon by name
  const renderFeatureIcon = (iconName: string, isVisible: boolean) => {
    const iconClass = `w-4 h-4 ${isVisible ? 'text-blue-400' : 'text-neutral-500'}`;
    switch (iconName) {
      case 'Workflow':
        return <Workflow className={iconClass} />;
      case 'CalendarCheck2':
        return <CalendarCheck2 className={iconClass} />;
      case 'Ticket':
        return <Ticket className={iconClass} />;
      case 'Table':
        return <Table className={iconClass} />;
      case 'GitCommit':
        return <GitCommit className={iconClass} />;
      case 'Network':
        return <Network className={iconClass} />;
      case 'MessageSquare':
        return <MessageSquare className={iconClass} />;
      case 'Video':
        return <Video className={iconClass} />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className={iconClass} />;
      case 'StickyNote':
        return <StickyNote className={iconClass} />;
      case 'Trophy':
        return <Trophy className={iconClass} />;
      case 'BarChart3':
        return <BarChart3 className={iconClass} />;
      case 'Mic':
        return <Mic className={iconClass} />;
      case 'RefreshCw':
        return <RefreshCw className={iconClass} />;
      case 'Award':
        return <Award className={iconClass} />;
      case 'Search':
        return <Search className={iconClass} />;
      case 'Bell':
        return <Bell className={iconClass} />;
      case 'PlusCircle':
        return <PlusCircle className={iconClass} />;
      case 'Users':
        return <Users className={iconClass} />;
      case 'Shield':
        return <Shield className={iconClass} />;
      case 'History':
        return <History className={iconClass} />;
      case 'Database':
        return <Database className={iconClass} />;
      default:
        return <Layers className={iconClass} />;
    }
  };

  const filteredFeatures = useMemo(() => {
    return features.filter((feat) => {
      // Category filter
      if (activeCategory !== 'all' && feat.category !== activeCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          feat.name.toLowerCase().includes(q) ||
          feat.description.toLowerCase().includes(q) ||
          feat.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [features, activeCategory, searchQuery]);

  if (!isFeaturesModalOpen) return null;

  return (
    <div
      id="features-management-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setIsFeaturesModalOpen(false)}
    >
      <div
        id="features-management-modal-container"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#141414] border border-[#2b2b2b] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#242424] bg-[#181818]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">App Features</h2>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  {visibleCount} / {totalCount} Visible
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Show or hide any workspace feature, navigation view, or header tool.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-features-modal"
            onClick={() => setIsFeaturesModalOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#252525] transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="px-5 py-3 border-b border-[#242424] bg-[#161616] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                id="input-search-features"
                placeholder="Search features (e.g. voice, kanban, sync)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#1e1e1e] border border-[#333] rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="btn-show-all-features"
                onClick={showAllFeatures}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#222] hover:bg-[#2b2b2b] text-neutral-200 hover:text-white border border-[#333] transition-colors cursor-pointer"
                title="Show all features"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Show All</span>
              </button>

              <button
                type="button"
                id="btn-reset-default-features"
                onClick={resetFeatures}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#222] hover:bg-[#2b2b2b] text-neutral-300 hover:text-white border border-[#333] transition-colors cursor-pointer"
                title="Reset to factory defaults"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              id="tab-features-category-all"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-[#1f1f1f] text-neutral-400 hover:text-white hover:bg-[#282828]'
              }`}
            >
              All Features ({features.length})
            </button>
            <button
              type="button"
              id="tab-features-category-views"
              onClick={() => setActiveCategory('views')}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'views'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-[#1f1f1f] text-neutral-400 hover:text-white hover:bg-[#282828]'
              }`}
            >
              Core Views ({features.filter((f) => f.category === 'views').length})
            </button>
            <button
              type="button"
              id="tab-features-category-tools"
              onClick={() => setActiveCategory('tools')}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'tools'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-[#1f1f1f] text-neutral-400 hover:text-white hover:bg-[#282828]'
              }`}
            >
              Header &amp; Tools ({features.filter((f) => f.category === 'tools').length})
            </button>
            <button
              type="button"
              id="tab-features-category-admin"
              onClick={() => setActiveCategory('admin')}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'admin'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-[#1f1f1f] text-neutral-400 hover:text-white hover:bg-[#282828]'
              }`}
            >
              Administration ({features.filter((f) => f.category === 'admin').length})
            </button>
          </div>
        </div>

        {/* Feature List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {filteredFeatures.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <Search className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
              <p className="font-semibold text-sm">No features match your search</p>
              <p className="text-xs text-neutral-500 mt-1">Try clearing your search query or choosing another category.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#252525] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredFeatures.map((feature) => {
              const isVisible = isFeatureVisible(feature.id);
              const isJustToggled = justToggledId === feature.id;

              return (
                <div
                  key={feature.id}
                  id={`feature-item-${feature.id}`}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                    isVisible
                      ? 'bg-[#1a1a1a] border-[#2c2c2c] hover:border-[#383838]'
                      : 'bg-[#141414] border-[#202020] opacity-75 hover:opacity-100 hover:border-[#2b2b2b]'
                  } ${isJustToggled ? 'ring-1 ring-blue-500/50' : ''}`}
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3 min-w-0 pr-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isVisible
                          ? 'bg-blue-950/40 border border-blue-500/30 text-blue-400'
                          : 'bg-[#1e1e1e] border border-[#2b2b2b] text-neutral-500'
                      }`}
                    >
                      {renderFeatureIcon(feature.iconName, isVisible)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-semibold text-xs tracking-tight ${
                            isVisible ? 'text-white' : 'text-neutral-400'
                          }`}
                        >
                          {feature.name}
                        </span>

                        {/* Category pill */}
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                            feature.category === 'views'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : feature.category === 'tools'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          }`}
                        >
                          {feature.category === 'views' ? 'View' : feature.category === 'tools' ? 'Tool' : 'Admin'}
                        </span>

                        {feature.isViewMode && feature.viewMode === viewMode && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Current View
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Toggle Switch */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-medium hidden sm:inline ${isVisible ? 'text-blue-400' : 'text-neutral-500'}`}>
                      {isVisible ? 'Visible' : 'Hidden'}
                    </span>

                    <button
                      type="button"
                      id={`toggle-feature-${feature.id}`}
                      onClick={() => handleToggle(feature)}
                      role="switch"
                      aria-checked={isVisible}
                      title={`${isVisible ? 'Hide' : 'Show'} ${feature.name}`}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-[#141414] ${
                        isVisible ? 'bg-blue-600' : 'bg-neutral-700'
                      }`}
                    >
                      <span className="sr-only">Toggle {feature.name}</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                          isVisible ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      >
                        {isVisible ? (
                          <Eye className="w-3 h-3 text-blue-600" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-neutral-500" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#242424] bg-[#181818]/90">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Changes take effect immediately and are saved to your profile.</span>
          </div>

          <button
            type="button"
            id="btn-done-features-modal"
            onClick={() => setIsFeaturesModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
