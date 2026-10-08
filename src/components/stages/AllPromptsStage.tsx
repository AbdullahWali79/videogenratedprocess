import React, { useState } from 'react';
import { Prompt, Scene, Character, PromptCategory, PromptStatus } from '../../types';
import { PromptCard } from '../PromptCard';
import { PromptModal } from '../PromptModal';
import { useToast } from '../Toast';
import { 
  Sparkles, 
  Search, 
  Filter, 
  Plus, 
  Copy, 
  Layers, 
  Tag, 
  FolderSearch,
  ExternalLink 
} from 'lucide-react';

interface AllPromptsStageProps {
  prompts: Prompt[];
  scenes: Scene[];
  characters: Character[];
  onCreatePrompt: (data: any) => Promise<any>;
  onUpdatePrompt: (promptId: string, updates: any) => Promise<void>;
  onDeletePrompt: (promptId: string) => Promise<void>;
  onDuplicatePrompt: (prompt: Prompt) => Promise<any>;
}

export const AllPromptsStage: React.FC<AllPromptsStageProps> = ({
  prompts,
  scenes,
  characters,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onDuplicatePrompt,
}) => {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSceneId, setSelectedSceneId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Prompt modal
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Filter prompts
  const filteredPrompts = prompts.filter((p) => {
    // Search
    const term = searchTerm.toLowerCase();
    const matchSearch =
      p.title.toLowerCase().includes(term) ||
      p.fullText.toLowerCase().includes(term) ||
      (p.externalTool && p.externalTool.toLowerCase().includes(term)) ||
      (p.notes && p.notes.toLowerCase().includes(term));
    if (!matchSearch) return false;

    // Category
    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false;
    }

    // Scene
    if (selectedSceneId !== 'all') {
      if (selectedSceneId === 'project_level') {
        if (p.sceneId) return false;
      } else if (p.sceneId !== selectedSceneId) {
        return false;
      }
    }

    // Status
    if (selectedStatus !== 'all' && p.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  const handleCopyAllVisible = () => {
    if (filteredPrompts.length === 0) return;
    const text = filteredPrompts
      .map(
        (p, idx) =>
          `# ${idx + 1}. [${p.category.toUpperCase()}] ${p.title} (${p.externalTool || 'Tool'})\n${p.fullText}`
      )
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(text);
    showToast(`Copied ${filteredPrompts.length} prompts to clipboard! 📋`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
              Prompt Library
            </span>
            <span className="text-xs text-slate-400">• Centralized Repository</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            All Video Prompts ({prompts.length})
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Search, filter, edit, and 1-click copy every prompt created across the entire project pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopyAllVisible}
            disabled={filteredPrompts.length === 0}
            className="px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            title="Copy all currently filtered prompts to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Filtered ({filteredPrompts.length})</span>
          </button>

          <button
            onClick={() => {
              setEditingPrompt(null);
              setIsPromptModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Prompt</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prompt titles, text, tools, or notes..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
        </div>

        {/* Filter dropdowns row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="story">Story</option>
              <option value="character">Character</option>
              <option value="image">Image</option>
              <option value="voice">Voice</option>
              <option value="music">Music</option>
              <option value="video">Video</option>
              <option value="editing">Editing</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Scene Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSceneId}
              onChange={(e) => setSelectedSceneId(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Scopes</option>
              <option value="project_level">Project Level Only</option>
              {sortedScenes.map((s) => (
                <option key={s.id} value={s.id}>
                  Scene {s.order}: {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="ready">Ready</option>
              <option value="draft">Draft</option>
              <option value="used">Used</option>
            </select>
          </div>

          {(searchTerm || selectedCategory !== 'all' || selectedSceneId !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedSceneId('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-purple-600 hover:text-purple-700 underline font-medium px-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Prompts Grid */}
      {filteredPrompts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <FolderSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No prompts match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search terms or filters above, or add a new prompt.
          </p>
          <button
            onClick={() => {
              setEditingPrompt(null);
              setIsPromptModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add New Prompt
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt) => {
            const linkedScene = scenes.find((s) => s.id === prompt.sceneId);

            return (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                scene={linkedScene}
                onEdit={(p) => {
                  setEditingPrompt(p);
                  setIsPromptModalOpen(true);
                }}
                onDuplicate={(p) => onDuplicatePrompt(p)}
                onDelete={(p) => onDeletePrompt(p.id)}
                onStatusChange={(p, status) => onUpdatePrompt(p.id, { status })}
              />
            );
          })}
        </div>
      )}

      {/* Prompt Modal */}
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => {
          setIsPromptModalOpen(false);
          setEditingPrompt(null);
        }}
        onSubmit={async (data) => {
          if (editingPrompt) {
            await onUpdatePrompt(editingPrompt.id, data);
            showToast('Prompt updated');
          } else {
            await onCreatePrompt(data);
            showToast('New prompt added to repository');
          }
        }}
        initialData={editingPrompt}
        scenes={scenes}
        characters={characters}
      />
    </div>
  );
};
