import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { Prompt, PromptCategory, PromptStatus, Scene, Character } from '../types';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Prompt> & { title: string; fullText: string; category: PromptCategory }) => Promise<void>;
  initialData?: Prompt | null;
  defaultCategory?: PromptCategory;
  defaultSceneId?: string;
  defaultCharacterId?: string;
  scenes?: Scene[];
  characters?: Character[];
  isLoading?: boolean;
}

const CATEGORIES: { value: PromptCategory; label: string }[] = [
  { value: 'story', label: 'Story / Concept' },
  { value: 'character', label: 'Character Consistency' },
  { value: 'image', label: 'Image Prompt' },
  { value: 'voice', label: 'Voice / TTS' },
  { value: 'music', label: 'Background Music' },
  { value: 'video', label: 'Video Clip / Animation' },
  { value: 'editing', label: 'Editing / Pacing' },
  { value: 'other', label: 'Other / Custom' },
];

const COMMON_TOOLS = [
  'Midjourney',
  'Runway Gen-3',
  'Luma Dream Machine',
  'Kling AI',
  'Flux.1',
  'ElevenLabs',
  'Suno AI',
  'Udio',
  'Stable Diffusion',
  'Pika Labs',
  'ChatGPT / Claude',
  'CapCut / DaVinci Resolve',
];

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultCategory = 'image',
  defaultSceneId = '',
  defaultCharacterId = '',
  scenes = [],
  characters = [],
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [fullText, setFullText] = useState('');
  const [category, setCategory] = useState<PromptCategory>(defaultCategory);
  const [externalTool, setExternalTool] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<PromptStatus>('ready');
  const [sceneId, setSceneId] = useState(defaultSceneId);
  const [characterId, setCharacterId] = useState(defaultCharacterId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setFullText(initialData.fullText);
      setCategory(initialData.category);
      setExternalTool(initialData.externalTool || '');
      setNotes(initialData.notes || '');
      setStatus(initialData.status);
      setSceneId(initialData.sceneId || '');
      setCharacterId(initialData.characterId || '');
    } else {
      setTitle('');
      setFullText('');
      setCategory(defaultCategory);
      setExternalTool('');
      setNotes('');
      setStatus('ready');
      setSceneId(defaultSceneId);
      setCharacterId(defaultCharacterId);
    }
  }, [initialData, defaultCategory, defaultSceneId, defaultCharacterId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a prompt title.');
      return;
    }
    if (!fullText.trim()) {
      setError('Please paste the prompt text.');
      return;
    }
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        fullText: fullText.trim(),
        category,
        externalTool: externalTool.trim(),
        notes: notes.trim(),
        status,
        sceneId: sceneId || '',
        characterId: characterId || '',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save prompt');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialData ? 'Edit Prompt' : 'Add New Prompt'}
              </h2>
              <p className="text-xs text-slate-500">
                Store prompts crafted for external generation tools
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Prompt Label / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Master Cinematic Wide Shot - Sunset Golden Hour"
              required
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-medium"
              autoFocus
            />
          </div>

          {/* Full Prompt Text */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Full Prompt Text <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              placeholder="Paste exact prompt parameters, negative prompts, camera angles, lighting instructions, seed numbers..."
              rows={4}
              required
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-y"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PromptCategory)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PromptStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
              >
                <option value="draft">Draft (Work in progress)</option>
                <option value="ready">Ready (Ready to run)</option>
                <option value="used">Used (Generated output)</option>
              </select>
            </div>
          </div>

          {/* External Tool Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              External Tool <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              list="tools-list"
              value={externalTool}
              onChange={(e) => setExternalTool(e.target.value)}
              placeholder="e.g. Midjourney, Runway, Kling, Suno, ElevenLabs"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
            <datalist id="tools-list">
              {COMMON_TOOLS.map((tool) => (
                <option key={tool} value={tool} />
              ))}
            </datalist>
          </div>

          {/* Scene Link (if scenes available) */}
          {scenes.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Associate with Scene <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={sceneId}
                onChange={(e) => setSceneId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
              >
                <option value="">None (Project Level)</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    Scene {s.order}: {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Character Link (if characters available) */}
          {characters.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Associate with Character <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
              >
                <option value="">None</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Generation Notes <span className="text-slate-400 font-normal">(Seeds, settings, aspect flags)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. --ar 16:9 --v 6.1 --s 250, seed 491029"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-md shadow-purple-600/20 flex items-center gap-2 disabled:opacity-60"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {initialData ? 'Update Prompt' : 'Save Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
