import React, { useState } from 'react';
import { Project, Scene, Prompt, Asset, ChecklistItem } from '../../types';
import { useToast } from '../Toast';
import { PromptCard } from '../PromptCard';
import { PromptModal } from '../PromptModal';
import { MediaUploader } from '../MediaUploader';
import { ConfirmModal } from '../ConfirmModal';
import { 
  CheckCircle2, 
  Film, 
  Sparkles, 
  Plus, 
  Check, 
  Download, 
  Trash2, 
  Play, 
  ListTodo, 
  Star, 
  Layers, 
  RotateCcw, 
  AlertTriangle,
  Award,
  Clock,
  ShieldCheck,
  Music,
  Mic,
  Lock
} from 'lucide-react';

interface FinalVideoStageProps {
  userId: string;
  project: Project;
  scenes: Scene[];
  prompts: Prompt[];
  assets: Asset[];
  tasks: ChecklistItem[];
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<ChecklistItem>) => Promise<void>;
  onCreatePrompt: (data: any) => Promise<any>;
  onUpdatePrompt: (promptId: string, updates: any) => Promise<void>;
  onDeletePrompt: (promptId: string) => Promise<void>;
  onDuplicatePrompt: (prompt: Prompt) => Promise<any>;
  onDeleteAsset: (assetId: string, storagePath: string) => Promise<void>;
}

export const FinalVideoStage: React.FC<FinalVideoStageProps> = ({
  userId,
  project,
  scenes,
  prompts,
  assets,
  tasks,
  onUpdateProject,
  onUpdateTask,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onDuplicatePrompt,
  onDeleteAsset,
}) => {
  const { showToast } = useToast();

  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  // Final video uploads
  const finalVideoAssets = assets.filter(
    (a) => a.category === 'final_video' || (!a.sceneId && a.fileType === 'video')
  );

  // Editing prompts
  const editingPrompts = prompts.filter(
    (p) => !p.sceneId && (p.category === 'editing' || p.category === 'other')
  );

  // Selected final video asset
  const selectedFinalAsset = assets.find((a) => a.id === project.selectedFinalVideoAssetId);

  // Prompt modal
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Asset delete confirm
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Override completion modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState(project.completionOverrideReason || '');

  // Calculate missing tasks
  const requiredTasks = tasks.filter((t) => t.required);
  const uncompletedRequiredTasks = requiredTasks.filter((t) => t.status !== 'complete');
  const hasMissingTasks = uncompletedRequiredTasks.length > 0 || !project.selectedFinalVideoAssetId;

  const isCompleted = project.status === 'completed';

  const handleSelectFinalVideo = async (assetId: string) => {
    const targetId = project.selectedFinalVideoAssetId === assetId ? '' : assetId;
    await onUpdateProject({ selectedFinalVideoAssetId: targetId });
    showToast(targetId ? 'Selected Master Final Video Render! 🏆' : 'Cleared final video selection', 'success');
  };

  const handleToggleTaskStatus = async (task: ChecklistItem) => {
    const nextStatus = task.status === 'complete' ? 'pending' : 'complete';
    await onUpdateTask(task.id, { status: nextStatus });
    showToast(`Marked "${task.label}" as ${nextStatus === 'complete' ? 'Done' : 'Pending'}`);
  };

  const handleToggleTaskRequired = async (task: ChecklistItem) => {
    await onUpdateTask(task.id, { required: !task.required });
    showToast(`Task is now ${!task.required ? 'Required' : 'Optional / Not Required'}`);
  };

  const handleMarkProjectComplete = async () => {
    if (hasMissingTasks) {
      // Prompt user with explicit override reason
      setIsOverrideModalOpen(true);
    } else {
      await onUpdateProject({ status: 'completed' });
      showToast('Congratulations! Video Project marked as Completed! 🎉', 'success');
    }
  };

  const handleConfirmOverrideComplete = async () => {
    if (!overrideReason.trim()) {
      showToast('Please provide an explanation for completing with missing tasks.', 'error');
      return;
    }
    await onUpdateProject({
      status: 'completed',
      completionOverrideReason: overrideReason.trim(),
    });
    setIsOverrideModalOpen(false);
    showToast('Project marked as Completed with saved override explanation! 🎉', 'success');
  };

  const handleReopenProject = async () => {
    await onUpdateProject({ status: 'in_progress' });
    showToast('Project reopened and set back to In Progress.', 'info');
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;
    try {
      if (project.selectedFinalVideoAssetId === assetToDelete.id) {
        await onUpdateProject({ selectedFinalVideoAssetId: '' });
      }
      await onDeleteAsset(assetToDelete.id, assetToDelete.storagePath);
      showToast('Video file deleted');
      setAssetToDelete(null);
    } catch (e: any) {
      showToast('Failed to delete file', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Stage 6
            </span>
            <span className="text-xs text-slate-400">• Assembly, Review & Delivery</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Final Video Assembly & Quality Checklist
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Review your scene clip sequence, upload your finished edit from CapCut or Premiere, and check off final quality milestones.
          </p>
        </div>

        {/* Project Completion Action Button */}
        <div className="shrink-0 flex items-center gap-2">
          {isCompleted ? (
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
                <Award className="w-4 h-4 text-emerald-600" />
                Project Completed
              </span>
              <button
                onClick={handleReopenProject}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition flex items-center gap-1"
                title="Reopen project to make edits"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reopen
              </button>
            </div>
          ) : (
            <button
              onClick={handleMarkProjectComplete}
              className="px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Project Complete</span>
            </button>
          )}
        </div>
      </div>

      {/* Completion Override Notice (if project was completed with override) */}
      {project.completionOverrideReason && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Completed with Explicit Override:</strong>
            <p className="mt-0.5 italic">"{project.completionOverrideReason}"</p>
          </div>
        </div>
      )}

      {/* 1. Ordered Timeline of Selected Scene Clips */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-600" />
              Chronological Scene Clip Sequence ({sortedScenes.length} scenes)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify your assembled sequence before rendering in external video editing software
            </p>
          </div>
        </div>

        {sortedScenes.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No scenes created yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {sortedScenes.map((scene, idx) => {
              const clipAsset = assets.find((a) => a.id === scene.selectedVideoAssetId);
              const imageAsset = assets.find((a) => a.id === scene.selectedImageAssetId);

              return (
                <div
                  key={scene.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5 flex flex-col justify-between space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>#{scene.order || idx + 1}</span>
                    <span className="text-[10px] text-slate-400">{scene.duration || '5s'}</span>
                  </div>

                  {/* Thumbnail */}
                  <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
                    {clipAsset?.downloadUrl ? (
                      <video src={clipAsset.downloadUrl} className="w-full h-full object-cover" />
                    ) : imageAsset?.downloadUrl ? (
                      <img src={imageAsset.downloadUrl} alt={scene.title} className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-6 h-6 text-slate-500" />
                    )}

                    {clipAsset && (
                      <div className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] text-white font-bold">
                        CLIP
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold text-slate-900 truncate" title={scene.title}>
                      {scene.title}
                    </h5>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {clipAsset ? 'Clip Ready ✅' : 'Clip Pending ⏳'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Grid: Final Video Uploads vs Quality Review Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Uploaded Master Final Videos */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Final Video Deliverables
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload exported full video renders and select the master release
                </p>
              </div>

              <MediaUploader
                userId={userId}
                projectId={project.id}
                category="final_video"
                acceptedTypes="video"
                buttonLabel="Upload Final Video"
                onUploaded={async (asset) => {
                  if (!project.selectedFinalVideoAssetId) {
                    await onUpdateProject({ selectedFinalVideoAssetId: asset.id });
                    showToast('Auto-selected as master final video! 🏆', 'success');
                  }
                }}
              />
            </div>

            {finalVideoAssets.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Film className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No final video uploaded yet</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
                  Export the combined timeline from CapCut or DaVinci Resolve and upload the final MP4 here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {finalVideoAssets.map((asset) => {
                  const isMaster = project.selectedFinalVideoAssetId === asset.id;

                  return (
                    <div
                      key={asset.id}
                      className={`rounded-2xl border transition overflow-hidden group p-4 flex flex-col gap-3 ${
                        isMaster
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Video Player */}
                      <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
                        {asset.downloadUrl ? (
                          <video
                            src={asset.downloadUrl}
                            controls
                            preload="metadata"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-white text-xs">Video unavailable</div>
                        )}
                      </div>

                      {/* Info & Master Select */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate" title={asset.name}>
                            {asset.name}
                          </h5>
                          <span className="text-[10px] text-slate-400">
                            {(asset.size / (1024 * 1024)).toFixed(1)} MB • {asset.mimeType}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleSelectFinalVideo(asset.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                              isMaster
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isMaster ? 'fill-white text-white' : 'text-slate-400'}`} />
                            <span>{isMaster ? 'Master Render' : 'Select Master'}</span>
                          </button>

                          <a
                            href={asset.downloadUrl}
                            download={asset.fileName}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-100"
                            title="Download Final Video"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => setAssetToDelete(asset)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Delete Video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (6 cols): Review Checklist */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-purple-600" />
                  Pre-Publish Quality Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify every deliverable before publishing or archiving
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => {
                const isChecked = task.status === 'complete';

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isChecked
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTaskStatus(task)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <span
                          className={`text-xs font-semibold block truncate ${
                            isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {task.label}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">
                          {task.stage.replace('_', ' ')}
                        </span>
                      </div>
                    </label>

                    {/* Required vs Not Required Toggle */}
                    <button
                      onClick={() => handleToggleTaskRequired(task)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition ${
                        task.required
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {task.required ? 'Required' : 'Not Required'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Override Completion Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Mark Complete with Missing Items?
              </h3>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Some required tasks or the final video upload are not yet complete. You can explicitly override this by saving a short explanation.
              </p>

              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Short test video; audio delivered on separate channel; published directly to TikTok..."
                rows={3}
                required
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 mb-4 font-medium"
              />

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOverrideComplete}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs"
                >
                  Save & Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete video confirm */}
      {assetToDelete && (
        <ConfirmModal
          isOpen={!!assetToDelete}
          title="Delete Final Video"
          message={`Are you sure you want to delete "${assetToDelete.name}"?`}
          confirmText="Delete Video"
          confirmVariant="danger"
          onConfirm={handleDeleteAsset}
          onClose={() => setAssetToDelete(null)}
        />
      )}
    </div>
  );
};
