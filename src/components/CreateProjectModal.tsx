import React, { useState } from 'react';
import { X, Sparkles, Film, Clock, Languages, Palette, Ratio, AlignLeft } from 'lucide-react';
import { Project } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Project> & { title: string }) => Promise<void>;
  isLoading: boolean;
}

const COMMON_STYLES = [
  'Cinematic Photorealistic',
  '3D Pixar / Animation',
  'Japanese Anime / Studio Ghibli',
  'Dark Cyberpunk / Sci-Fi',
  'Historical Documentary',
  'Vintage 1970s Film Grain',
  'Watercolor Illustration',
  'Hyper-realistic Commercial',
];

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 Landscape (YouTube, TV)' },
  { value: '9:16', label: '9:16 Vertical (Shorts, Reels, TikTok)' },
  { value: '1:1', label: '1:1 Square (Feed)' },
  { value: '4:5', label: '4:5 Social Portrait' },
  { value: '21:9', label: '21:9 Ultrawide Cinematic' },
];

const COMMON_LANGUAGES = ['English', 'Urdu', 'Roman Urdu', 'Hindi', 'Spanish', 'French', 'Arabic', 'Japanese'];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [visualStyle, setVisualStyle] = useState('Cinematic Photorealistic');
  const [customStyle, setCustomStyle] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [targetDuration, setTargetDuration] = useState('60s');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a video title.');
      return;
    }
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        language: language.trim(),
        visualStyle: (customStyle.trim() || visualStyle).trim(),
        aspectRatio,
        targetDuration: targetDuration.trim(),
        notes: notes.trim(),
      });
      // reset form
      setTitle('');
      setDescription('');
      setNotes('');
      setCustomStyle('');
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-orange-500 flex items-center justify-center text-white shadow-xs">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Video Process</h2>
              <p className="text-xs text-slate-500">Configure project baseline for your manual pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
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

          {/* Title (Required) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Video Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Lost City of Petra: Historical Deep Dive"
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-medium"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Synopsis / Brief Overview <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this video about? Who is the intended audience?"
              rows={2}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-y"
            />
          </div>

          {/* Grid row: Aspect Ratio & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Ratio className="w-3.5 h-3.5 text-purple-600" />
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
              >
                {ASPECT_RATIOS.map((ar) => (
                  <option key={ar.value} value={ar.value}>
                    {ar.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                Target Duration
              </label>
              <input
                type="text"
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value)}
                placeholder="e.g., 60s, 3:30, 10 mins"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>
          </div>

          {/* Grid row: Language & Visual Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-indigo-600" />
                Language
              </label>
              <input
                type="text"
                list="languages-list"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="English / Urdu / etc."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
              <datalist id="languages-list">
                {COMMON_LANGUAGES.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-pink-600" />
                Visual Style
              </label>
              <select
                value={visualStyle}
                onChange={(e) => {
                  setVisualStyle(e.target.value);
                  if (e.target.value !== 'Other') setCustomStyle('');
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
              >
                {COMMON_STYLES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
                <option value="Other">Custom Style...</option>
              </select>
            </div>
          </div>

          {visualStyle === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Visual Style
              </label>
              <input
                type="text"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                placeholder="e.g., Claymation, Noir monochrome, Retro vaporwave"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              General Production Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tools planned (e.g. Midjourney + Runway + ElevenLabs), channel targets, or reminders..."
              rows={2}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

          {/* Modal Footer */}
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
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 rounded-xl transition shadow-md shadow-purple-500/20 flex items-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Start Video Process
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
