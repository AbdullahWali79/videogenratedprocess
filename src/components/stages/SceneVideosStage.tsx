import React, { useState } from 'react';
import { Scene, Prompt, Asset } from '../../types';
import { useToast } from '../Toast';
import { PromptCard } from '../PromptCard';
import { PromptModal } from '../PromptModal';
import { MediaUploader } from '../MediaUploader';
import { ConfirmModal } from '../ConfirmModal';
import { 
  Film, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Check, 
  Trash2, 
  Star, 
  Layers, 
  Image as ImageIcon, 
  Mic, 
  Clock, 
  Play, 
  Download, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface SceneVideosStageProps {
  userId: string;
  projectId: string;
  scenes: Scene[];
  prompts: Prompt[];
  assets: Asset[];
  currentSceneId?: string;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
  onCreatePrompt: (data: any) => Promise<any>;
  onUpdatePrompt: (promptId: string, updates: any) => Promise<void>;
  onDeletePrompt: (promptId: string) => Promise<void>;
  onDuplicatePrompt: (prompt: Prompt) => Promise<any>;
  onDeleteAsset: (assetId: string, storagePath: string) => Promise<void>;
  onGoToFinalVideoStage: () => void;
}

export const SceneVideosStage: React.FC<SceneVideosStageProps> = ({
  userId,
  projectId,
  scenes,
  prompts,
  assets,
  currentSceneId,
  onUpdateScene,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onDuplicatePrompt,
  onDeleteAsset,
  onGoToFinalVideoStage,
}) => {
  const { showToast } = useToast();

  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  // Active scene selector
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    currentSceneId || (sortedScenes.length > 0 ? sortedScenes[0].id : '')
  );

  const activeScene = sortedScenes.find((s) => s.id === selectedSceneId) || sortedScenes[0];

  // Prompt modal state
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Delete clip confirmation
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Video preview player modal
  const [videoPreviewAsset, setVideoPreviewAsset] = useState<Asset | null>(null);

  // Find linked primary image & voice for the active scene
  const selectedImageAsset = assets.find((a) => a.id === activeScene?.selectedImageAssetId);
  const selectedVoiceAsset = assets.find((a) => a.id === activeScene?.selectedVoiceAssetId);

  // Filter video prompts & clips for active scene
  const sceneVideoPrompts = prompts.filter(
    (p) => p.sceneId === activeScene?.id && p.category === 'video'
  );
  const sceneVideoAssets = assets.filter(
    (a) => a.sceneId === activeScene?.id && (a.category === 'scene_video' || a.fileType === 'video')
  );

  // Build the dynamic summary required:
  // "Image selected. Voice not required. Video prompt saved. Final clip missing."
  const getSceneStatusSummary = () => {
    if (!activeScene) return '';
    const parts: string[] = [];

    if (activeScene.selectedImageAssetId) {
      parts.push('Image selected.');
    } else {
      parts.push('Image missing.');
    }

    if (activeScene.voiceNotRequired) {
      parts.push('Voice not required.');
    } else if (activeScene.selectedVoiceAssetId) {
      parts.push('Voice selected.');
    } else {
      parts.push('Voice pending.');
    }

    if (sceneVideoPrompts.length > 0) {
      parts.push('Video prompt saved.');
    } else {
      parts.push('Video prompt pending.');
    }

    if (activeScene.selectedVideoAssetId) {
      parts.push('Final clip selected. ✅');
    } else {
      parts.push('Final clip missing.');
    }

    return parts.join(' ');
  };

  const handleSelectFinalSceneClip = async (assetId: string) => {
    if (!activeScene) return;
    const targetId = activeScene.selectedVideoAssetId === assetId ? '' : assetId;
    await onUpdateScene(activeScene.id, { selectedVideoAssetId: targetId });
    showToast(targetId ? 'Selected as Final Scene Clip! 🎬' : 'Cleared final clip selection', 'success');
  };

  const handleDeleteClip = async () => {
    if (!assetToDelete || !activeScene) return;
    try {
      if (activeScene.selectedVideoAssetId === assetToDelete.id) {
        await onUpdateScene(activeScene.id, { selectedVideoAssetId: '' });
      }
      await onDeleteAsset(assetToDelete.id, assetToDelete.storagePath);
      showToast('Video clip deleted');
      setAssetToDelete(null);
    } catch (e: any) {
      showToast('Failed to delete clip', 'error');
    }
  };

  if (sortedScenes.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
        <Film className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No scenes created yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          Please create scenes before attaching video prompts and generated video clips.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
              Stage 5
            </span>
            <span className="text-xs text-slate-400">• Animation & Motion Clips</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Scene Video Prompts & Clips
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Reference your selected image frame, save animation prompts for Runway Gen-3 / Kling / Luma, upload motion clips, and select each scene's final video.
          </p>
        </div>

        {/* Global Action: Add Video Prompt */}
        <button
          onClick={() => {
            setEditingPrompt(null);
            setIsPromptModalOpen(true);
          }}
          className="px-4 py-2.5 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Save Video Prompt</span>
        </button>
      </div>

      {/* Scene Tabs Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sortedScenes.map((scene, idx) => {
          const isCurrent = scene.id === activeScene?.id;
          const hasVideo = Boolean(scene.selectedVideoAssetId);
          return (
            <button
              key={scene.id}
              onClick={() => setSelectedSceneId(scene.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                isCurrent
                  ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-600/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300'
              }`}
            >
              <span>Scene {scene.order || idx + 1}: {scene.title}</span>
              {hasVideo ? (
                <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-emerald-500'}`} />
              ) : (
                <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-pink-200' : 'bg-slate-300'}`} />
              )}
            </button>
          );
        })}
      </div>

      {activeScene && (
        <div className="space-y-6">
          {/* Dynamic Status Summary Banner (Mandated Requirement) */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Scene {activeScene.order} Status Summary
                </span>
                <span className="text-xs sm:text-sm font-semibold text-pink-200">
                  {getSceneStatusSummary()}
                </span>
              </div>
            </div>

            {activeScene.selectedVideoAssetId ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Scene Ready
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Clip Pending
              </span>
            )}
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col (5 cols): References (Selected Image + Selected Voice) & Video Prompts */}
            <div className="lg:col-span-5 space-y-4">
              {/* Scene References Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  Scene Visual & Voice Inputs
                </h4>

                {/* Primary Image Preview */}
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 flex items-center gap-3">
                  <div className="w-16 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {selectedImageAsset?.downloadUrl ? (
                      <img
                        src={selectedImageAsset.downloadUrl}
                        alt="Primary Scene Frame"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Primary Frame (Image-to-Video seed)
                    </span>
                    <span className="text-xs text-slate-500 truncate block">
                      {selectedImageAsset ? selectedImageAsset.name : 'No primary image chosen yet'}
                    </span>
                  </div>
                </div>

                {/* Primary Voice Reference */}
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Scene Voice Track
                    </span>
                    <span className="text-xs text-slate-500 truncate block">
                      {activeScene.voiceNotRequired
                        ? 'Voice marked not required'
                        : selectedVoiceAsset
                        ? selectedVoiceAsset.name
                        : 'No voiceover selected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Prompts Box */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-pink-600" />
                      Video Motion Prompts ({sceneVideoPrompts.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Motion vectors, camera moves, and speed
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPrompt(null);
                      setIsPromptModalOpen(true);
                    }}
                    className="p-1.5 text-xs font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {sceneVideoPrompts.length === 0 ? (
                  <div className="p-5 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Film className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-500">No video prompts saved</p>
                    <p className="text-[11px] text-slate-400 mb-2">
                      e.g. "Slow cinematic push in on character, subtle eye blink, blowing wind."
                    </p>
                    <button
                      onClick={() => {
                        setEditingPrompt(null);
                        setIsPromptModalOpen(true);
                      }}
                      className="px-3 py-1 text-xs font-bold text-pink-700 bg-pink-100 rounded-lg"
                    >
                      + Add Prompt
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sceneVideoPrompts.map((p) => (
                      <PromptCard
                        key={p.id}
                        prompt={p}
                        scene={activeScene}
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
            </div>

            {/* Right Col (7 cols): Uploaded Scene Video Clips & Master Selection */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Film className="w-5 h-5 text-pink-600" />
                      Uploaded Video Clips
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload MP4/WebM renders from Runway, Kling, or Luma. Select the final scene clip.
                    </p>
                  </div>

                  <MediaUploader
                    userId={userId}
                    projectId={projectId}
                    category="scene_video"
                    acceptedTypes="video"
                    sceneId={activeScene.id}
                    buttonLabel="Upload Scene Clip"
                    onUploaded={async (asset) => {
                      if (!activeScene.selectedVideoAssetId) {
                        await onUpdateScene(activeScene.id, { selectedVideoAssetId: asset.id });
                        showToast('Auto-selected as final scene clip! 🎬', 'success');
                      }
                    }}
                  />
                </div>

                {sceneVideoAssets.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Film className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">No video clips uploaded</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
                      Animate your selected scene image in your video generator and upload the resulting MP4.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sceneVideoAssets.map((asset) => {
                      const isSelected = activeScene.selectedVideoAssetId === asset.id;

                      return (
                        <div
                          key={asset.id}
                          className={`rounded-2xl border transition overflow-hidden group flex flex-col justify-between ${
                            isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20'
                              : 'border-slate-200 hover:border-pink-300 bg-white'
                          }`}
                        >
                          {/* Video player embedded */}
                          <div className="relative aspect-video bg-black flex items-center justify-center">
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

                            {/* Top badge */}
                            <div className="absolute top-2 left-2 z-10 pointer-events-auto">
                              <button
                                onClick={() => handleSelectFinalSceneClip(asset.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white/90 text-slate-700 hover:bg-white backdrop-blur-xs'
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 ${isSelected ? 'fill-white text-white' : 'text-slate-400'}`} />
                                <span>{isSelected ? 'Final Scene Clip' : 'Select as Final'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Details & Actions */}
                          <div className="p-3">
                            <h5 className="text-xs font-bold text-slate-900 truncate" title={asset.name}>
                              {asset.name}
                            </h5>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                              <span>{(asset.size / (1024 * 1024)).toFixed(1)} MB</span>
                              <div className="flex items-center gap-1">
                                <a
                                  href={asset.downloadUrl}
                                  download={asset.fileName}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-400 hover:text-pink-600 p-1"
                                  title="Download Clip"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => setAssetToDelete(asset)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                  title="Delete Clip"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Next Step CTA */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-200/60 p-5 shadow-xs flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-0.5">
                    Next: Final Video Timeline & Delivery
                  </h4>
                  <p className="text-xs text-emerald-800/80">
                    Assemble clips in CapCut or Premiere, upload final video render, and review checklist.
                  </p>
                </div>
                <button
                  onClick={onGoToFinalVideoStage}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clip delete confirm modal */}
      {assetToDelete && (
        <ConfirmModal
          isOpen={!!assetToDelete}
          title="Delete Video Clip"
          message={`Are you sure you want to delete "${assetToDelete.name}"?`}
          confirmText="Delete Clip"
          confirmVariant="danger"
          onConfirm={handleDeleteClip}
          onClose={() => setAssetToDelete(null)}
        />
      )}

      {/* Prompt modal */}
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
            await onCreatePrompt({ ...data, sceneId: activeScene.id, category: 'video' });
            showToast('Video prompt saved');
          }
        }}
        initialData={editingPrompt}
        defaultCategory="video"
        defaultSceneId={activeScene.id}
        scenes={scenes}
      />
    </div>
  );
};
