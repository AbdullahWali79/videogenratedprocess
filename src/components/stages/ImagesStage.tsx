import React, { useState } from 'react';
import { Scene, Prompt, Asset } from '../../types';
import { useToast } from '../Toast';
import { PromptCard } from '../PromptCard';
import { PromptModal } from '../PromptModal';
import { MediaUploader } from '../MediaUploader';
import { ConfirmModal } from '../ConfirmModal';
import { 
  Sparkles, 
  Plus, 
  ImageIcon, 
  CheckCircle2, 
  Download, 
  Trash2, 
  Star, 
  Layers, 
  ZoomIn, 
  X, 
  Edit2, 
  Check, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface ImagesStageProps {
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
  onUpdateAsset: (assetId: string, updates: Partial<Asset>) => Promise<void>;
  onDeleteAsset: (assetId: string, storagePath: string) => Promise<void>;
  onGoToVoiceMusicStage: () => void;
}

export const ImagesStage: React.FC<ImagesStageProps> = ({
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
  onUpdateAsset,
  onDeleteAsset,
  onGoToVoiceMusicStage,
}) => {
  const { showToast } = useToast();

  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  // Active scene selector
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    currentSceneId || (sortedScenes.length > 0 ? sortedScenes[0].id : '')
  );

  // Prompt modal state
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Image preview modal
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  // Rename asset state
  const [renamingAssetId, setRenamingAssetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Delete asset confirm
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const activeScene = sortedScenes.find((s) => s.id === selectedSceneId) || sortedScenes[0];

  // Filter image prompts for this scene
  const sceneImagePrompts = prompts.filter(
    (p) => p.sceneId === activeScene?.id && p.category === 'image'
  );

  // Filter image assets for this scene
  const sceneImageAssets = assets.filter(
    (a) => a.sceneId === activeScene?.id && (a.category === 'image' || a.fileType === 'image')
  );

  const handleSelectPrimaryImage = async (assetId: string) => {
    if (!activeScene) return;
    try {
      const isAlreadyPrimary = activeScene.selectedImageAssetId === assetId;
      const targetId = isAlreadyPrimary ? '' : assetId;
      await onUpdateScene(activeScene.id, { selectedImageAssetId: targetId });
      if (targetId) {
        showToast('Selected as Primary Scene Image! ⭐', 'success');
      } else {
        showToast('Cleared primary scene image selection.', 'info');
      }
    } catch (err: any) {
      showToast('Failed to update primary image', 'error');
    }
  };

  const handleSaveRename = async (asset: Asset) => {
    if (!renameValue.trim()) return;
    try {
      await onUpdateAsset(asset.id, { name: renameValue.trim() });
      setRenamingAssetId(null);
      showToast('Image label renamed', 'success');
    } catch (err: any) {
      showToast('Failed to rename', 'error');
    }
  };

  const handleDeleteImage = async () => {
    if (!assetToDelete || !activeScene) return;
    try {
      // If this asset is currently the selected primary image, clear selection
      if (activeScene.selectedImageAssetId === assetToDelete.id) {
        await onUpdateScene(activeScene.id, { selectedImageAssetId: '' });
      }
      await onDeleteAsset(assetToDelete.id, assetToDelete.storagePath);
      showToast('Image deleted and removed from scene', 'info');
      setAssetToDelete(null);
    } catch (err: any) {
      showToast('Failed to delete image', 'error');
    }
  };

  const handleDownload = (asset: Asset) => {
    if (!asset.downloadUrl) return;
    const a = document.createElement('a');
    a.href = asset.downloadUrl;
    a.download = asset.fileName || 'scene_image';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (sortedScenes.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
        <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No scenes created yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          Please add at least one scene in Stage 2 before generating and organizing scene images.
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
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
              Stage 3
            </span>
            <span className="text-xs text-slate-400">• Visual Generation & Selection</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Image Prompts & Primary Frames
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Save your Midjourney, Flux, or Stable Diffusion prompts, upload generated results, and select the master primary image for each scene.
          </p>
        </div>

        {/* Global Action: Add Prompt for this Scene */}
        <button
          onClick={() => {
            setEditingPrompt(null);
            setIsPromptModalOpen(true);
          }}
          className="px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Save Image Prompt</span>
        </button>
      </div>

      {/* Scene Tabs Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sortedScenes.map((scene, idx) => {
          const isCurrent = scene.id === activeScene?.id;
          const hasImage = Boolean(scene.selectedImageAssetId);
          return (
            <button
              key={scene.id}
              onClick={() => setSelectedSceneId(scene.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                isCurrent
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              <span>Scene {scene.order || idx + 1}: {scene.title}</span>
              {hasImage ? (
                <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-emerald-500'}`} />
              ) : (
                <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-orange-300' : 'bg-slate-300'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Grid: Prompts vs Image Alternatives Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Scene Context & Image Prompts */}
        <div className="lg:col-span-5 space-y-4">
          {/* Scene Context Brief */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                Scene {activeScene.order} Script
              </span>
              <span className="text-xs text-slate-400">{activeScene.duration || 'Duration unassigned'}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium mb-3">
              {activeScene.sceneText || '(No scene action scripted yet. Add text in Stage 2.)'}
            </p>
            {activeScene.notes && (
              <p className="text-[11px] text-slate-500 italic">
                Notes: {activeScene.notes}
              </p>
            )}
          </div>

          {/* Image Prompts Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Image Prompts ({sceneImagePrompts.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Targeted prompts for Scene {activeScene.order}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPrompt(null);
                  setIsPromptModalOpen(true);
                }}
                className="p-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                title="Add Image Prompt"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {sceneImagePrompts.length === 0 ? (
              <div className="p-5 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Sparkles className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500 font-medium">No image prompts yet</p>
                <p className="text-[11px] text-slate-400 mb-2">
                  Paste the prompt you ran in Midjourney or Flux.
                </p>
                <button
                  onClick={() => {
                    setEditingPrompt(null);
                    setIsPromptModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition"
                >
                  + Add Prompt
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sceneImagePrompts.map((p) => (
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

        {/* Right Column (7 cols): Uploaded Image Alternatives & Selection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  Generated Image Alternatives
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload multiple generations. Select one as the primary master frame.
                </p>
              </div>

              {/* Upload Button */}
              <MediaUploader
                userId={userId}
                projectId={projectId}
                category="image"
                acceptedTypes="image"
                sceneId={activeScene.id}
                buttonLabel="Upload Image"
                onUploaded={async (asset) => {
                  // If this is the first image for the scene, auto-select it as primary
                  if (!activeScene.selectedImageAssetId) {
                    await onUpdateScene(activeScene.id, { selectedImageAssetId: asset.id });
                    showToast('First image auto-selected as primary! ⭐', 'success');
                  }
                }}
              />
            </div>

            {/* Gallery Grid */}
            {sceneImageAssets.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No images uploaded for this scene</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
                  Run your prompt in your external generator, download the image, and upload it here.
                </p>
                <div className="inline-block">
                  <MediaUploader
                    userId={userId}
                    projectId={projectId}
                    category="image"
                    acceptedTypes="image"
                    sceneId={activeScene.id}
                    buttonLabel="Upload Generated Image"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sceneImageAssets.map((asset) => {
                  const isPrimary = activeScene.selectedImageAssetId === asset.id;
                  const isRenaming = renamingAssetId === asset.id;

                  return (
                    <div
                      key={asset.id}
                      className={`rounded-2xl border transition overflow-hidden group flex flex-col justify-between ${
                        isPrimary
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20'
                          : 'border-slate-200 hover:border-purple-300 bg-white'
                      }`}
                    >
                      {/* Image Thumbnail with Overlay controls */}
                      <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                        {asset.downloadUrl ? (
                          <img
                            src={asset.downloadUrl}
                            alt={asset.name}
                            className="w-full h-full object-cover group-hover:scale-102 transition duration-300 cursor-pointer"
                            onClick={() => setPreviewAsset(asset)}
                          />
                        ) : (
                          <div className="text-white text-xs">Image preview unavailable</div>
                        )}

                        {/* Top primary badge or button */}
                        <div className="absolute top-2.5 left-2.5">
                          <button
                            onClick={() => handleSelectPrimaryImage(asset.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md ${
                              isPrimary
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white/90 text-slate-700 hover:bg-white backdrop-blur-xs'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isPrimary ? 'fill-white text-white' : 'text-slate-400'}`} />
                            <span>{isPrimary ? 'Primary Frame' : 'Set as Primary'}</span>
                          </button>
                        </div>

                        {/* Zoom button */}
                        <button
                          onClick={() => setPreviewAsset(asset)}
                          className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition"
                          title="Preview Fullscreen"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Label & Details */}
                      <div className="p-3 space-y-2">
                        {isRenaming ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-purple-400 rounded-md focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveRename(asset)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setRenamingAssetId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-800 truncate" title={asset.name}>
                              {asset.name}
                            </span>
                            <button
                              onClick={() => {
                                setRenamingAssetId(asset.id);
                                setRenameValue(asset.name);
                              }}
                              className="text-slate-400 hover:text-purple-600 p-0.5"
                              title="Rename label"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{(asset.size / (1024 * 1024)).toFixed(1)} MB</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDownload(asset)}
                              className="text-slate-400 hover:text-purple-600 p-1"
                              title="Download Image"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setAssetToDelete(asset)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete Image"
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

          {/* Next Stage Navigation CTA */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200/60 p-5 shadow-xs flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-0.5">
                Next in the Pipeline: Voice & Music
              </h4>
              <p className="text-xs text-amber-800/80">
                Organize ElevenLabs voiceovers, audio recordings, and background score.
              </p>
            </div>
            <button
              onClick={onGoToVoiceMusicStage}
              className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Preview Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-950/80 flex items-center justify-between text-white text-xs border-b border-white/10">
              <span className="font-semibold truncate max-w-md">{previewAsset.name}</span>
              <button
                onClick={() => setPreviewAsset(null)}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewAsset.downloadUrl}
              alt={previewAsset.name}
              className="max-h-[75vh] w-auto mx-auto object-contain"
            />
            <div className="p-3 bg-slate-950/80 flex items-center justify-between text-white text-xs border-t border-white/10">
              <span className="text-white/60">
                {(previewAsset.size / (1024 * 1024)).toFixed(2)} MB • {previewAsset.mimeType}
              </span>
              <button
                onClick={() => handleDownload(previewAsset)}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Image Confirmation */}
      {assetToDelete && (
        <ConfirmModal
          isOpen={!!assetToDelete}
          title="Delete Image"
          message={`Are you sure you want to delete "${assetToDelete.name}"? If it is selected as the primary frame, the selection will be cleared.`}
          confirmText="Delete File"
          confirmVariant="danger"
          onConfirm={handleDeleteImage}
          onClose={() => setAssetToDelete(null)}
        />
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
            await onCreatePrompt({ ...data, sceneId: activeScene.id });
            showToast('Image prompt saved');
          }
        }}
        initialData={editingPrompt}
        defaultCategory="image"
        defaultSceneId={activeScene.id}
        scenes={scenes}
      />
    </div>
  );
};
