import React, { useState } from 'react';
import { Prompt, Scene } from '../types';
import { Copy, Check, Edit2, CopyPlus, Trash2, Tag, Layers, Sparkles } from 'lucide-react';
import { useToast } from './Toast';

interface PromptCardProps {
  prompt: Prompt;
  scene?: Scene;
  onEdit: (prompt: Prompt) => void;
  onDuplicate: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onStatusChange?: (prompt: Prompt, newStatus: Prompt['status']) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  scene,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.fullText);
    setCopied(true);
    showToast(`Copied "${prompt.title}" to clipboard!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryColor = {
    story: 'bg-purple-100 text-purple-800 border-purple-200',
    character: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    image: 'bg-orange-100 text-orange-800 border-orange-200',
    voice: 'bg-amber-100 text-amber-800 border-amber-200',
    music: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    video: 'bg-pink-100 text-pink-800 border-pink-200',
    editing: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    other: 'bg-slate-100 text-slate-800 border-slate-200',
  }[prompt.category] || 'bg-slate-100 text-slate-800';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-purple-300 hover:shadow-md transition flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${categoryColor}`}>
              {prompt.category}
            </span>
            {prompt.externalTool && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {prompt.externalTool}
              </span>
            )}
            {scene && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Scene {scene.order}
              </span>
            )}
          </div>

          {/* Status selector */}
          <select
            value={prompt.status}
            onChange={(e) => onStatusChange && onStatusChange(prompt, e.target.value as any)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border focus:outline-none cursor-pointer ${
              prompt.status === 'ready'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : prompt.status === 'used'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="used">Used</option>
          </select>
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-1" title={prompt.title}>
          {prompt.title}
        </h4>

        {/* Prompt Text Box */}
        <div className="relative mb-3">
          <pre className="text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 overflow-x-auto whitespace-pre-wrap max-h-36 select-all font-medium leading-relaxed">
            {prompt.fullText}
          </pre>
        </div>

        {/* Notes */}
        {prompt.notes && (
          <p className="text-[11px] text-slate-500 italic mb-2 line-clamp-2">
            💡 {prompt.notes}
          </p>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
        <button
          onClick={handleCopy}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Prompt'}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(prompt)}
            className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-100 transition"
            title="Duplicate Prompt"
          >
            <CopyPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(prompt)}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
            title="Edit Prompt"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(prompt)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
            title="Delete Prompt"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
