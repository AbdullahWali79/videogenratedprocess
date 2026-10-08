import React, { useState, useEffect, useRef } from 'react';
import { Project, Prompt } from '../../types';
import { useToast } from '../Toast';
import { PromptCard } from '../PromptCard';
import { PromptModal } from '../PromptModal';
import { 
  CheckCircle, 
  Sparkles, 
  Plus, 
  AlignRight, 
  AlignLeft, 
  BookOpen, 
  FileText, 
  Save, 
  RotateCcw,
  Languages,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';

interface StoryStageProps {
  project: Project;
  prompts: Prompt[];
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  onCreatePrompt: (data: any) => Promise<any>;
  onUpdatePrompt: (promptId: string, updates: any) => Promise<void>;
  onDeletePrompt: (promptId: string) => Promise<void>;
  onDuplicatePrompt: (prompt: Prompt) => Promise<any>;
  onGoToNextStage: () => void;
}

export const StoryStage: React.FC<StoryStageProps> = ({
  project,
  prompts,
  onUpdateProject,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onDuplicatePrompt,
  onGoToNextStage,
}) => {
  const { showToast } = useToast();

  const [storyText, setStoryText] = useState(project.storyText || '');
  const [storyNotes, setStoryNotes] = useState(project.storyNotes || '');
  const [isRTL, setIsRTL] = useState(false);
  const [isApproved, setIsApproved] = useState(!!project.storyApproved);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Prompt modal
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Debounced autosave ref
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter story prompts
  const storyPrompts = prompts.filter((p) => p.category === 'story' && !p.sceneId);

  // Detect RTL from text (Urdu, Arabic, Persian)
  useEffect(() => {
    const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
    if (rtlRegex.test(storyText)) {
      setIsRTL(true);
    }
  }, [storyText]);

  const triggerAutosave = (newStory: string, newNotes: string, approved: boolean) => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    setSaveStatus('saving');
    setSaveError(null);

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await onUpdateProject({
          storyText: newStory,
          storyNotes: newNotes,
          storyApproved: approved,
          version: (project.version || 1) + 1,
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (err: any) {
        setSaveStatus('error');
        setSaveError(err.message || 'Save failed');
      }
    }, 800);
  };

  const handleStoryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setStoryText(val);
    triggerAutosave(val, storyNotes, isApproved);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setStoryNotes(val);
    triggerAutosave(storyText, val, isApproved);
  };

  const toggleApproval = () => {
    const nextVal = !isApproved;
    setIsApproved(nextVal);
    triggerAutosave(storyText, storyNotes, nextVal);
    if (nextVal) {
      showToast('Story marked as Approved! ✅', 'success');
    } else {
      showToast('Story approval reverted to pending.', 'info');
    }
  };

  const handlePromptSubmit = async (data: any) => {
    if (editingPrompt) {
      await onUpdatePrompt(editingPrompt.id, data);
      showToast('Story prompt updated', 'success');
    } else {
      await onCreatePrompt(data);
      showToast('Story prompt saved', 'success');
    }
    setEditingPrompt(null);
  };

  return (
    <div className="space-y-6">
      {/* Stage Introduction Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
              Stage 1
            </span>
            <span className="text-xs text-slate-400">• Concept, Script & Narrative</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Story & Master Script
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Paste your full story script from your writing tool. Preserves exact line breaks, Unicode, and Urdu/Roman Urdu text without automatic rewrites.
          </p>
        </div>

        {/* Approval Toggle & Save Status */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Autosave badge */}
          <div className="text-xs font-medium">
            {saveStatus === 'saving' && (
              <span className="text-purple-600 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                Saving changes...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <button
                onClick={() => triggerAutosave(storyText, storyNotes, isApproved)}
                className="text-rose-600 flex items-center gap-1 underline hover:no-underline font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Save failed — Retry
              </button>
            )}
          </div>

          <button
            onClick={toggleApproval}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs ${
              isApproved
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <CheckCircle className={`w-4 h-4 ${isApproved ? 'text-white' : 'text-slate-400'}`} />
            <span>{isApproved ? 'Story Approved' : 'Mark Story Approved'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Story Editor + Prompts Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Story Text & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Story Text Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Full Story Script
              </label>

              {/* Text direction toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setIsRTL(false)}
                  className={`p-1 rounded transition ${!isRTL ? 'bg-white shadow-2xs text-purple-700' : 'text-slate-400'}`}
                  title="Left to Right (LTR)"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsRTL(true)}
                  className={`p-1 rounded transition ${isRTL ? 'bg-white shadow-2xs text-purple-700' : 'text-slate-400'}`}
                  title="Right to Left (RTL) - Urdu / Arabic"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <textarea
              value={storyText}
              onChange={handleStoryChange}
              dir={isRTL ? 'rtl' : 'ltr'}
              placeholder="Paste your story here...
For example:
Once upon a time in a high-tech subterranean laboratory, an ancient artifact was discovered that changed human history forever...

Supports Roman Urdu, Urdu (اردو), Unicode characters, and full formatting."
              rows={14}
              className={`w-full p-4 text-sm sm:text-base border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-y font-normal leading-relaxed text-slate-800 ${
                isRTL ? 'font-serif text-right' : ''
              }`}
            />

            <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
              <span>{storyText.trim() ? `${storyText.trim().split(/\s+/).length} words` : '0 words'}</span>
              <span>{storyText.length} characters</span>
            </div>
          </div>

          {/* Story Notes Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Story Structure & Direction Notes
            </label>
            <textarea
              value={storyNotes}
              onChange={handleNotesChange}
              placeholder="Key plot beats, thematic messages, pacing notes, target tone, character motivation..."
              rows={4}
              className="w-full p-3.5 text-xs sm:text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-y"
            />
          </div>
        </div>

        {/* Right Col: Story Development Prompts */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Story Prompts
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Prompts used to ideate or develop this story
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPrompt(null);
                  setIsPromptModalOpen(true);
                }}
                className="p-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition flex items-center gap-1"
                title="Add Story Prompt"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {storyPrompts.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No story prompts saved yet</p>
                <p className="text-[11px] text-slate-400 mt-1 mb-3">
                  Paste prompts from Claude or ChatGPT used to outline this narrative.
                </p>
                <button
                  onClick={() => {
                    setEditingPrompt(null);
                    setIsPromptModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition"
                >
                  + Add First Prompt
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {storyPrompts.map((p) => (
                  <PromptCard
                    key={p.id}
                    prompt={p}
                    onEdit={(pr) => {
                      setEditingPrompt(pr);
                      setIsPromptModalOpen(true);
                    }}
                    onDuplicate={(pr) => onDuplicatePrompt(pr)}
                    onDelete={(pr) => onDeletePrompt(pr.id)}
                    onStatusChange={(pr, status) => onUpdatePrompt(pr.id, { status })}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Next Stage Navigation CTA */}
          <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-3xl border border-purple-100 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider mb-1">
              Ready for the next step?
            </h4>
            <p className="text-xs text-purple-800/80 mb-3 leading-relaxed">
              Break down this story into scene cards with actions and character consistency guides.
            </p>
            <button
              onClick={onGoToNextStage}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
            >
              <span>Continue to Scenes & Characters</span>
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Prompt Modal */}
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => {
          setIsPromptModalOpen(false);
          setEditingPrompt(null);
        }}
        onSubmit={handlePromptSubmit}
        initialData={editingPrompt}
        defaultCategory="story"
      />
    </div>
  );
};
