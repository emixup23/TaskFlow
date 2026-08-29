import React, { useState, useEffect, useMemo } from 'react';
import Prism from 'prismjs';
// Import Prism language definitions
import 'prismjs/components/prism-markup'; // HTML, XML, SVG
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';

import {
  Code,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  FileCode,
  Layers,
  Sparkles,
  Terminal,
  Maximize2,
  Minimize2,
  FileText
} from 'lucide-react';
import { Task, CodeLanguage, TaskCodeSnippet } from '../types';

interface CodeEditorTabProps {
  task: Task;
  canEdit: boolean;
  onUpdateCode: (data: {
    codeSnippets?: TaskCodeSnippet[];
    codeSnippet?: string;
    codeLanguage?: CodeLanguage;
  }) => Promise<void> | void;
}

const LANGUAGE_OPTIONS: { id: CodeLanguage; label: string; ext: string; prismGrammar: string }[] = [
  { id: 'html', label: 'HTML', ext: '.html', prismGrammar: 'markup' },
  { id: 'css', label: 'CSS', ext: '.css', prismGrammar: 'css' },
  { id: 'javascript', label: 'JavaScript', ext: '.js', prismGrammar: 'javascript' },
  { id: 'python', label: 'Python', ext: '.py', prismGrammar: 'python' },
  { id: 'xml', label: 'XML', ext: '.xml', prismGrammar: 'markup' },
  { id: 'typescript', label: 'TypeScript', ext: '.ts', prismGrammar: 'typescript' },
  { id: 'json', label: 'JSON', ext: '.json', prismGrammar: 'json' },
  { id: 'sql', label: 'SQL', ext: '.sql', prismGrammar: 'sql' }
];

const STARTER_SNIPPETS: Partial<Record<CodeLanguage, { title: string; code: string; desc: string }>> = {
  html: {
    title: 'index.html',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TaskFlow Component</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app" class="container">
    <header class="app-header">
      <h1>Workflow Integration</h1>
      <p>Real-time RBAC task management</p>
    </header>
  </div>
</body>
</html>`,
    desc: 'HTML template structure for web task views'
  },
  css: {
    title: 'styles.css',
    code: `/* Component Design Tokens & Layout */
:root {
  --primary-color: #3b82f6;
  --surface-dark: #141414;
  --border-subtle: #262626;
  --radius-card: 12px;
}

.task-card {
  background-color: var(--surface-dark);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  padding: 1.25rem;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.task-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
}`,
    desc: 'CSS rules & design token variables'
  },
  javascript: {
    title: 'handler.js',
    code: `// Async Task Handler & Token Verifier
async function executeTaskPipeline(taskId, userContext) {
  console.log(\`[TaskFlow] Initiating pipeline for task: \${taskId}\`);
  
  if (!userContext || !userContext.id) {
    throw new Error('Authentication required: userContext is undefined');
  }

  const payload = {
    taskId,
    executedBy: userContext.id,
    timestamp: new Date().toISOString(),
    status: 'IN_PROGRESS'
  };

  return { success: true, payload };
}`,
    desc: 'JavaScript execution pipeline & async verification'
  },
  python: {
    title: 'task_processor.py',
    code: `import json
from datetime import datetime
from typing import Dict, Any

class TaskProcessor:
    def __init__(self, task_id: str, assignees: list):
        self.task_id = task_id
        self.assignees = assignees
        self.created_at = datetime.utcnow().isoformat()

    def validate_permissions(self, user_role: str) -> bool:
        """Validates if the user role has administrative execution clearance."""
        return user_role in ["admin", "superadmin"]

    def export_summary(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "total_assignees": len(self.assignees),
            "timestamp": self.created_at
        }

if __name__ == "__main__":
    processor = TaskProcessor("task-101", ["Alex", "Sarah"])
    print(f"Task Processor Ready: {processor.export_summary()}")`,
    desc: 'Python utility class for task processing & validation'
  },
  xml: {
    title: 'config.xml',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<WorkflowSpecification xmlns="http://taskflow.io/schema/workflow/v1">
  <Metadata>
    <SchemaVersion>2.4.0</SchemaVersion>
    <Environment>production</Environment>
  </Metadata>
  <TaskDefinition id="TASK-AUTO-01">
    <Name>Deploy RBAC Security Module</Name>
    <Urgency level="urgent" />
    <SecurityPolicies>
      <Policy name="enforce_token_signing" enabled="true" />
      <Policy name="validate_file_attachments" maxKb="1024" />
      <Policy name="block_executable_files" enabled="true" />
    </SecurityPolicies>
  </TaskDefinition>
</WorkflowSpecification>`,
    desc: 'XML schema & system security policies'
  },
  typescript: {
    title: 'types.ts',
    code: `export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'basic';
  privileges: {
    canCreateTask: boolean;
    canManageUsers: boolean;
    canUploadAttachments: boolean;
  };
}

export type StatusStage = 'todo' | 'in_progress' | 'in_review' | 'done';`,
    desc: 'TypeScript interfaces and type declarations'
  },
  json: {
    title: 'manifest.json',
    code: `{
  "taskFlowVersion": "2.4.0",
  "security": {
    "attachmentSizeLimitKb": 1024,
    "allowedExtensions": ["txt", "csv", "png", "jpg"],
    "blockExecutables": true
  },
  "supportedLanguages": [
    "html",
    "css",
    "javascript",
    "python",
    "xml",
    "typescript",
    "sql"
  ]
}`,
    desc: 'JSON configuration manifest'
  },
  sql: {
    title: 'queries.sql',
    code: `-- TaskFlow Analytics & User Workload Query
SELECT 
    u.id AS user_id,
    u.name,
    u.role,
    COUNT(t.id) AS total_assigned_tasks,
    SUM(CASE WHEN s.is_done = TRUE THEN 1 ELSE 0 END) AS completed_tasks
FROM users u
LEFT JOIN task_assignees ta ON u.id = ta.user_id
LEFT JOIN tasks t ON ta.task_id = t.id
LEFT JOIN statuses s ON t.status_id = s.id
GROUP BY u.id, u.name, u.role
ORDER BY total_assigned_tasks DESC;`,
    desc: 'SQL data aggregation query'
  }
};

export const CodeEditorTab: React.FC<CodeEditorTabProps> = ({
  task,
  canEdit,
  onUpdateCode
}) => {
  // Normalize initial snippets list
  const initialSnippets = useMemo<TaskCodeSnippet[]>(() => {
    if (task.codeSnippets && task.codeSnippets.length > 0) {
      return task.codeSnippets;
    }
    if (task.codeSnippet) {
      return [
        {
          id: 'snip-default',
          title: `snippet.${task.codeLanguage === 'python' ? 'py' : task.codeLanguage === 'html' ? 'html' : task.codeLanguage === 'css' ? 'css' : task.codeLanguage === 'xml' ? 'xml' : 'js'}`,
          language: task.codeLanguage || 'javascript',
          code: task.codeSnippet,
          description: 'Primary task code implementation'
        }
      ];
    }
    return [
      {
        id: `snip-${Date.now()}`,
        title: 'implementation.js',
        language: 'javascript',
        code: STARTER_SNIPPETS.javascript.code,
        description: STARTER_SNIPPETS.javascript.desc
      }
    ];
  }, [task.id]);

  const [snippets, setSnippets] = useState<TaskCodeSnippet[]>(initialSnippets);
  const [activeSnippetIndex, setActiveSnippetIndex] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'both' | 'code' | 'preview'>('both');
  const [isAddingSnippet, setIsAddingSnippet] = useState<boolean>(false);
  const [newSnippetTitle, setNewSnippetTitle] = useState<string>('');
  const [newSnippetLang, setNewSnippetLang] = useState<CodeLanguage>('javascript');

  useEffect(() => {
    setSnippets(initialSnippets);
    setActiveSnippetIndex(0);
  }, [task.id]);

  const currentSnippet = snippets[activeSnippetIndex] || snippets[0] || {
    id: 'fallback',
    title: 'code.js',
    language: 'javascript',
    code: '',
    description: ''
  };

  const currentLangConfig = LANGUAGE_OPTIONS.find((l) => l.id === currentSnippet.language) || LANGUAGE_OPTIONS[2];

  // Syntax highlighted HTML via Prism
  const highlightedCode = useMemo(() => {
    const code = currentSnippet.code || '';
    const grammar = Prism.languages[currentLangConfig.prismGrammar] || Prism.languages.javascript;
    try {
      return Prism.highlight(code, grammar, currentLangConfig.prismGrammar);
    } catch {
      return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }, [currentSnippet.code, currentLangConfig.prismGrammar]);

  const lineCount = useMemo(() => {
    return (currentSnippet.code || '').split('\n').length;
  }, [currentSnippet.code]);

  const handleCodeChange = (newCode: string) => {
    const updated = [...snippets];
    updated[activeSnippetIndex] = {
      ...updated[activeSnippetIndex],
      code: newCode
    };
    setSnippets(updated);
    saveChanges(updated);
  };

  const handleLanguageChange = (newLang: CodeLanguage) => {
    const updated = [...snippets];
    const oldSnippet = updated[activeSnippetIndex];
    const langOpt = LANGUAGE_OPTIONS.find((l) => l.id === newLang);
    let title = oldSnippet.title;
    if (title.includes('.')) {
      title = `${title.split('.')[0]}${langOpt?.ext || '.txt'}`;
    }
    updated[activeSnippetIndex] = {
      ...oldSnippet,
      language: newLang,
      title
    };
    setSnippets(updated);
    saveChanges(updated);
  };

  const handleTitleChange = (newTitle: string) => {
    const updated = [...snippets];
    updated[activeSnippetIndex] = {
      ...updated[activeSnippetIndex],
      title: newTitle.trim() || 'snippet.txt'
    };
    setSnippets(updated);
    saveChanges(updated);
  };

  const handleAddSnippet = () => {
    const langDef = LANGUAGE_OPTIONS.find((l) => l.id === newSnippetLang) || LANGUAGE_OPTIONS[0];
    const starter = STARTER_SNIPPETS[newSnippetLang] || STARTER_SNIPPETS.javascript;
    const title = newSnippetTitle.trim() || `snippet_${snippets.length + 1}${langDef.ext}`;

    const newSnip: TaskCodeSnippet = {
      id: `snip-${Date.now()}`,
      title,
      language: newSnippetLang,
      code: starter.code,
      description: starter.desc
    };

    const updated = [...snippets, newSnip];
    setSnippets(updated);
    setActiveSnippetIndex(updated.length - 1);
    setIsAddingSnippet(false);
    setNewSnippetTitle('');
    saveChanges(updated);
  };

  const handleDeleteSnippet = (index: number) => {
    if (snippets.length <= 1) return;
    const updated = snippets.filter((_, i) => i !== index);
    setSnippets(updated);
    setActiveSnippetIndex(Math.max(0, index - 1));
    saveChanges(updated);
  };

  const saveChanges = async (updatedList: TaskCodeSnippet[]) => {
    const primary = updatedList[0];
    try {
      await onUpdateCode({
        codeSnippets: updatedList,
        codeSnippet: primary?.code || '',
        codeLanguage: primary?.language || 'javascript'
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('Failed to sync code snippets:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentSnippet.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleLoadStarterTemplate = () => {
    const starter = STARTER_SNIPPETS[currentSnippet.language];
    if (starter) {
      handleCodeChange(starter.code);
    }
  };

  return (
    <div id="task-code-tab-container" className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#181818] rounded border border-[#262626]">
        
        {/* Language Selection & Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-300">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>Language:</span>
          </div>

          <select
            id="code-language-selector"
            value={currentSnippet.language}
            disabled={!canEdit}
            onChange={(e) => handleLanguageChange(e.target.value as CodeLanguage)}
            className="px-3 py-1.5 text-xs font-semibold bg-[#222222] border border-[#383838] rounded text-white focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label} ({lang.ext})
              </option>
            ))}
          </select>

          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-800/80">
            {currentLangConfig.prismGrammar}
          </span>

          {isSaved && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold animate-pulse">
              <Check className="w-3 h-3" /> Auto-saved
            </span>
          )}
        </div>

        {/* View and Copy Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#222222] border border-[#333333] rounded p-0.5 text-xs">
            <button
              type="button"
              id="viewmode-both"
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'both' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Split View: Editor & Syntax Highlighted Output"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>

            <button
              type="button"
              id="viewmode-code"
              onClick={() => setViewMode('code')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'code' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Syntax Highlighted Colored View"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Syntax Highlighting</span>
            </button>

            {(currentSnippet.language === 'html' || currentSnippet.language === 'css') && (
              <button
                type="button"
                id="viewmode-preview"
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'preview' ? 'bg-emerald-600 text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Live Rendered HTML/CSS Preview"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Preview</span>
              </button>
            )}
          </div>

          {/* Quick template button */}
          {canEdit && (
            <button
              type="button"
              id="btn-load-template"
              onClick={handleLoadStarterTemplate}
              title="Insert canonical starter template for this language"
              className="px-2.5 py-1 text-[11px] font-medium text-neutral-300 bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Template</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            id="btn-copy-code"
            onClick={handleCopyCode}
            className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isCopied
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'bg-[#222222] hover:bg-[#2c2c2c] text-white border-[#383838]'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Snippet Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#262626]">
        {snippets.map((snip, index) => {
          const isActive = index === activeSnippetIndex;
          return (
            <div
              key={snip.id}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-mono transition-colors ${
                isActive
                  ? 'bg-[#1e1e1e] text-white border-t border-x border-[#333333] font-bold shadow-xs'
                  : 'bg-[#141414] text-neutral-400 hover:bg-[#1a1a1a] hover:text-neutral-200 border-t border-x border-transparent'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveSnippetIndex(index)}
                className="flex items-center gap-1.5 cursor-pointer text-left"
              >
                <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-neutral-500'}`} />
                <span>{snip.title}</span>
              </button>

              {canEdit && snippets.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteSnippet(index)}
                  title="Remove snippet"
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 rounded transition-opacity cursor-pointer ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Snippet Tab Button */}
        {canEdit && !isAddingSnippet && (
          <button
            type="button"
            id="btn-add-snippet-tab"
            onClick={() => setIsAddingSnippet(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-400 hover:text-blue-400 hover:bg-[#1a1a1a] rounded transition-colors cursor-pointer"
            title="Add another code file snippet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New File</span>
          </button>
        )}
      </div>

      {/* Add New Snippet Inline Form */}
      {isAddingSnippet && (
        <div className="p-3 bg-[#181818] rounded border border-blue-500/40 space-y-2.5 animate-in fade-in duration-100">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-200">
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              Add Code File Snippet
            </span>
            <button
              type="button"
              onClick={() => setIsAddingSnippet(false)}
              className="text-neutral-400 hover:text-neutral-200 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Filename (e.g. index.html, styles.css, script.js)"
                value={newSnippetTitle}
                onChange={(e) => setNewSnippetTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#222222] border border-[#333333] rounded text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={newSnippetLang}
                onChange={(e) => setNewSnippetLang(e.target.value as CodeLanguage)}
                className="w-full px-3 py-1.5 text-xs bg-[#222222] border border-[#333333] rounded text-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddSnippet}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              Create Snippet
            </button>
          </div>
        </div>
      )}

      {/* Editor & Highlighted Preview Canvas */}
      <div className="relative rounded border border-[#2c2c2c] bg-[#0d0d0d] overflow-hidden shadow-inner">
        {/* Editor Top Status Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#171717] border-b border-[#262626] text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-neutral-300 font-semibold ml-2">{currentSnippet.title}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>{lineCount} lines</span>
            <span>UTF-8</span>
            <span className="uppercase text-blue-400 font-bold">{currentSnippet.language}</span>
          </div>
        </div>

        {/* Editor Views: Dual Mode / Full Syntax / Live Preview */}
        {viewMode === 'preview' && (currentSnippet.language === 'html' || currentSnippet.language === 'css') ? (
          <div className="bg-[#111111] p-4 min-h-[380px] flex flex-col">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 pb-2 flex items-center justify-between border-b border-[#262626] mb-3">
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                Live Component Preview Canvas
              </span>
              <span className="text-[10px] text-neutral-400">Sandboxed Preview</span>
            </div>
            <div className="flex-1 bg-white rounded p-4 text-black overflow-auto min-h-[300px] border border-neutral-700">
              <iframe
                title="code-live-preview"
                srcDoc={
                  currentSnippet.language === 'html'
                    ? currentSnippet.code
                    : `<html><head><style>${currentSnippet.code}</style></head><body><div class="task-card"><h3>Live Preview Component</h3><p>Custom CSS applied successfully.</p><button style="margin-top:8px;padding:6px 12px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;">Action Button</button></div></body></html>`
                }
                sandbox="allow-scripts"
                className="w-full h-full min-h-[280px] border-0"
              />
            </div>
          </div>
        ) : viewMode === 'code' ? (
          /* Full Syntax Highlighted Colored View */
          <div className="flex flex-col bg-[#0b0f17] p-4 min-h-[360px] overflow-hidden">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 pb-2.5 flex items-center justify-between border-b border-[#1e293b]">
              <span className="flex items-center gap-1.5 text-blue-300">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Syntax Highlighted Output ({currentLangConfig.label})
              </span>
              <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Keywords
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Strings
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Functions
                </span>
              </div>
            </div>

            <div className="flex-1 bg-[#06090e] border border-[#1e293b] rounded p-3 overflow-x-auto max-h-[460px] text-xs font-mono select-text mt-3 shadow-inner">
              <div className="divide-y divide-transparent">
                {highlightedCode.split('\n').map((lineHtml, lineIdx) => (
                  <div
                    key={lineIdx}
                    className="flex leading-relaxed hover:bg-blue-500/10 px-1 rounded transition-colors group"
                  >
                    <span className="select-none text-right pr-4 text-neutral-600 group-hover:text-blue-400 font-mono text-[11px] w-8 shrink-0 border-r border-[#1e293b] mr-3">
                      {lineIdx + 1}
                    </span>
                    <span
                      className="flex-1 font-mono text-xs overflow-x-visible text-neutral-200"
                      dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Split View: Live Editor on Left / Syntax Highlighted Code Viewer on Right */
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#262626] min-h-[340px]">
            
            {/* Editable Code Input */}
            <div className="flex flex-col bg-[#111111] p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-1.5 flex items-center justify-between">
                <span>Live Code Editor {canEdit ? '(Editable)' : '(Read Only)'}</span>
              </div>
              <textarea
                id="task-code-editor-textarea"
                value={currentSnippet.code}
                disabled={!canEdit}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder={`Write ${currentLangConfig.label} code snippet here...`}
                rows={15}
                spellCheck={false}
                className="w-full flex-1 p-3 bg-[#0a0a0a] text-neutral-200 font-mono text-xs leading-relaxed border border-[#222222] rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-y disabled:opacity-80 shadow-inner"
              />
            </div>

            {/* Syntax Highlighted Output Box with Prism */}
            <div className="flex flex-col bg-[#0a0e17] p-3 overflow-hidden">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1 text-blue-300">
                  <Sparkles className="w-3 h-3 text-blue-400" /> Syntax Highlighting ({currentLangConfig.label})
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Real-time Tokens</span>
              </div>

              <div className="flex-1 bg-[#06090e] border border-[#1e293b] rounded p-3 overflow-x-auto max-h-[380px] text-xs font-mono shadow-inner select-text">
                <div className="divide-y divide-transparent">
                  {highlightedCode.split('\n').map((lineHtml, lineIdx) => (
                    <div
                      key={lineIdx}
                      className="flex leading-relaxed hover:bg-blue-500/10 px-1 rounded transition-colors group"
                    >
                      <span className="select-none text-right pr-3 text-neutral-600 group-hover:text-blue-400 font-mono text-[10px] w-6 shrink-0 border-r border-[#1e293b] mr-2.5">
                        {lineIdx + 1}
                      </span>
                      <span
                        className="flex-1 font-mono text-xs overflow-x-visible text-neutral-200"
                        dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Snippet Description / Notes Footer */}
        {canEdit && (
          <div className="p-3 bg-[#141414] border-t border-[#262626] flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Add optional snippet notes or instructions..."
              value={currentSnippet.description || ''}
              onChange={(e) => {
                const updated = [...snippets];
                updated[activeSnippetIndex] = {
                  ...updated[activeSnippetIndex],
                  description: e.target.value
                };
                setSnippets(updated);
                saveChanges(updated);
              }}
              className="flex-1 bg-transparent text-xs text-neutral-300 placeholder:text-neutral-600 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Language Quick Cheatsheet Tags */}
      <div className="p-3 bg-[#141414] rounded border border-[#222222] flex items-center justify-between flex-wrap gap-2 text-[11px] text-neutral-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-neutral-300">Supported Languages:</span>
          {LANGUAGE_OPTIONS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => canEdit && handleLanguageChange(l.id)}
              className={`px-2 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                currentSnippet.language === l.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-[#1f1f1f] text-neutral-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-neutral-500">
          Powered by PrismJS Syntax Engine
        </span>
      </div>
    </div>
  );
};
