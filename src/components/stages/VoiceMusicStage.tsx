import React, { useState } from 'react';
import { Project, Scene, Prompt, Asset } from '../../types';
import { useToast } from '../Toast';
import { PromptCard } from '../PromptCard';
import { PromptModal } from '../PromptModal';
import { MediaUploader } from '../MediaUploader';
import { ConfirmModal } from '../ConfirmModal';
import { 
  Mic, 
  Music, 
  Volume2, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Check, 
  Layers, 
  Sparkles, 
  Download, 
  ChevronRight,
  ShieldAlert,
  Edit2
} from 'lucide-react';

interface VoiceMusicStageProps {
  userId: string;
  project: Project;
  scenes: Scene[];
  prompts: Prompt[];
  assets: Asset[];
  currentSceneId?: string;
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
  onCreatePrompt: (data: any) => Promise<any>;
  onUpdatePrompt: (promptId: string, updates: any) => Promise<void>;
  onDeletePrompt: (promptId: string) => Promise<void>;
  onDuplicatePrompt: (prompt: Prompt) => Promise<any>;
  onDeleteAsset: (assetId: string, storagePath: string) => Promise<void>;
  onGoToSceneVideosStage: () => void;
}

export const VoiceMusicStage: React.FC<VoiceMusicStageProps> = ({
  userId,
  project,
  scenes,
  prompts,
  assets,
  currentSceneId,
  onUpdateProject,
  onUpdateScene,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onDuplicatePrompt,
  onDeleteAsset,
  onGoToSceneVideosStage,
}) => {
  const { showToast } = useToast();

  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  // Tab: Scene Voiceover vs Project Background Music
  const [activeTab, setActiveTab] = useState<'voice' | 'music'>('voice');

  // Selected scene for voiceover
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    currentSceneId || (sortedScenes.length > 0 ? sortedScenes[0].id : '')
  );

  const activeScene = sortedScenes.find((s) => s.id === selectedSceneId) || sortedScenes[0];

  // Prompt modal
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [promptCategory, setPromptCategory] = useState<'voice' | 'music'>('voice');

  // Audio player state
  const [playingAssetId, setPlayingAssetId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Asset delete confirm
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Scene voiceover text local edit
  const [voiceoverDraft, setVoiceoverDraft] = useState(activeScene?.voiceoverText || '');

  // Filter scene voice prompts & assets
  const sceneVoicePrompts = prompts.filter(
    (p) => p.sceneId === activeScene?.id && p.category === 'voice'
  );
  const sceneVoiceAssets = assets.filter(
    (a) => a.sceneId === activeScene?.id && (a.category === 'voice' || a.fileType === 'audio')
  );

  // Filter project music prompts & assets
  const projectMusicPrompts = prompts.filter(
    (p) => !p.sceneId && p.category === 'music'
  );
  const projectMusicAssets = assets.filter(
    (a) => (a.category === 'music' || (!a.sceneId && a.fileType === 'audio'))
  );

  // Audio preview toggle
  const togglePlayAudio = (asset: Asset) => {
    if (!asset.downloadUrl) return;

    if (playingAssetId === asset.id) {
      audioElement?.pause();
      setPlayingAssetId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(asset.downloadUrl);
      audio.play();
      audio.onended = () => setPlayingAssetId(null);
      setAudioElement(audio);
      setPlayingAssetId(asset.id);
    }
  };

  const handleToggleVoiceNotRequired = async () => {
    if (!activeScene) return;
    const nextVal = !activeScene.voiceNotRequired;
    await onUpdateScene(activeScene.id, { voiceNotRequired: nextVal });
    showToast(nextVal ? 'Marked: Voiceover Not Required for this scene' : 'Voiceover required for this scene', 'info');
  };

  const handleToggleMusicNotRequired = async () => {
    const nextVal = !project.musicNotRequired;
    await onUpdateProject({ musicNotRequired: nextVal });
    showToast(nextVal ? 'Marked: Background Music Not Required' : 'Background music required for project', 'info');
  };

  const handleSelectPrimaryVoice = async (assetId: string) => {
    if (!activeScene) return;
    const targetId = activeScene.selectedVoiceAssetId === assetId ? '' : assetId;
    await onUpdateScene(activeScene.id, { selectedVoiceAssetId: targetId });
    showToast(targetId ? 'Selected Primary Voiceover! 🎙️' : 'Cleared voiceover selection', 'success');
  };

  const handleSelectPrimaryMusic = async (assetId: string) => {
    const targetId = project.selectedMusicAssetId === assetId ? '' : assetId;
    await onUpdateProject({ selectedMusicAssetId: targetId });
    showToast(targetId ? 'Selected Primary Background Score! 🎵' : 'Cleared music selection', 'success');
  };

  const handleSyncVoiceoverFromSceneText = async () => {
    if (!activeScene) return;
    await onUpdateScene(activeScene.id, { voiceoverText: activeScene.sceneText });
    setVoiceoverDraft(activeScene.sceneText);
    showToast('Copied scene text to voiceover field', 'success');
  };

  const handleDeleteAssetConfirm = async () => {
    if (!assetToDelete) return;
    try {
      if (audioElement && playingAssetId === assetToDelete.id) {
        audioElement.pause();
        setPlayingAssetId(null);
      }
      if (activeScene && activeScene.selectedVoiceAssetId === assetToDelete.id) {
        await onUpdateScene(activeScene.id, { selectedVoiceAssetId: '' });
      }
      if (project.selectedMusicAssetId === assetToDelete.id) {
        await onUpdateProject({ selectedMusicAssetId: '' });
      }
      await onDeleteAsset(assetToDelete.id, assetToDelete.storagePath);
      showToast('Audio file deleted');
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
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Stage 4
            </span>
            <span className="text-xs text-slate-400">• Voiceovers & Soundtrack</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Voice & Music Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Record or generate voice narration for each scene and attach your background musical theme.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('voice')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'voice' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-amber-600" />
              Scene Voiceovers
            </button>
            <button
              onClick={() => setActiveTab('music')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'music' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-purple-600" />
              Background Music
            </button>
          </div>
        </div>
      </div>

      {/* Content depending on tab */}
      {activeTab === 'voice' ? (
        <div className="space-y-6">
          {/* Scene selector carousel */}
          {sortedScenes.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {sortedScenes.map((scene, idx) => {
                const isCurrent = scene.id === activeScene?.id;
                const hasVoice = Boolean(scene.selectedVoiceAssetId || scene.voiceNotRequired);
                return (
                  <button
                    key={scene.id}
                    onClick={() => {
                      setSelectedSceneId(scene.id);
                      setVoiceoverDraft(scene.voiceoverText || '');
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                      isCurrent
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <span>Scene {scene.order || idx + 1}: {scene.title}</span>
                    {hasVoice ? (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-emerald-500'}`} />
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-amber-200' : 'bg-slate-300'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeScene && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (5 cols): Voiceover script & Prompts */}
              <div className="lg:col-span-5 space-y-4">
                {/* Voiceover Script & "Not Required" Toggle */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-amber-600" />
                      Scene {activeScene.order} Narration Script
                    </span>
                    <button
                      onClick={handleSyncVoiceoverFromSceneText}
                      className="text-[11px] font-semibold text-purple-700 hover:text-purple-800 underline"
                      title="Copy from visual scene text"
                    >
                      Copy from Scene Script
                    </button>
                  </div>

                  <textarea
                    value={voiceoverDraft}
                    onChange={(e) => setVoiceoverDraft(e.target.value)}
                    onBlur={() => onUpdateScene(activeScene.id, { voiceoverText: voiceoverDraft })}
                    placeholder="Enter the spoken voiceover dialogue or narration for this scene..."
                    rows={4}
                    className="w-full p-3 text-xs sm:text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 resize-y"
                  />

                  {/* "Voice Not Required" Checkbox */}
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
                    <input
                      type="checkbox"
                      checked={!!activeScene.voiceNotRequired}
                      onChange={handleToggleVoiceNotRequired}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Voice Not Required for this Scene (silent / music-only shot)
                    </span>
                  </label>
                </div>

                {/* Voice Prompts (ElevenLabs, TTS, etc.) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        Voice Prompts ({sceneVoicePrompts.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Voice ID, stability, tone instructions
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingPrompt(null);
                        setPromptCategory('voice');
                        setIsPromptModalOpen(true);
                      }}
                      className="p-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {sceneVoicePrompts.length === 0 ? (
                    <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <p className="text-xs text-slate-500">No voice prompts saved</p>
                      <button
                        onClick={() => {
                          setEditingPrompt(null);
                          setPromptCategory('voice');
                          setIsPromptModalOpen(true);
                        }}
                        className="mt-2 px-3 py-1 text-xs font-bold text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200"
                      >
                        + Add Voice Prompt
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sceneVoicePrompts.map((p) => (
                        <PromptCard
                          key={p.id}
                          prompt={p}
                          onEdit={(pr) => {
                            setEditingPrompt(pr);
                            setPromptCategory('voice');
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

              {/* Right Column (7 cols): Uploaded Audio Files & Selection */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-amber-600" />
                        Scene Audio Takes & Takes
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload MP3 or WAV audio clips and select the primary take
                      </p>
                    </div>

                    <MediaUploader
                      userId={userId}
                      projectId={project.id}
                      category="voice"
                      acceptedTypes="audio"
                      sceneId={activeScene.id}
                      buttonLabel="Upload Audio Take"
                      onUploaded={async (asset) => {
                        if (!activeScene.selectedVoiceAssetId) {
                          await onUpdateScene(activeScene.id, { selectedVoiceAssetId: asset.id });
                          showToast('Auto-selected as primary voiceover! 🎙️', 'success');
                        }
                      }}
                    />
                  </div>

                  {sceneVoiceAssets.length === 0 ? (
                    <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <Mic className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-slate-700">No voiceovers uploaded</h4>
                      <p className="text-[11px] text-slate-400 mt-1 mb-3">
                        Export audio from ElevenLabs or your microphone and upload the MP3/WAV file.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sceneVoiceAssets.map((asset) => {
                        const isPrimary = activeScene.selectedVoiceAssetId === asset.id;
                        const isPlaying = playingAssetId === asset.id;

                        return (
                          <div
                            key={asset.id}
                            className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                              isPrimary
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                onClick={() => togglePlayAudio(asset)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0 ${
                                  isPlaying
                                    ? 'bg-amber-600 text-white animate-pulse'
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                                title={isPlaying ? 'Pause' : 'Play audio preview'}
                              >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                              </button>

                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-slate-900 truncate" title={asset.name}>
                                  {asset.name}
                                </h5>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>{(asset.size / (1024 * 1024)).toFixed(2)} MB</span>
                                  <span>•</span>
                                  <span>{asset.mimeType}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleSelectPrimaryVoice(asset.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                  isPrimary
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isPrimary ? 'Primary Voice' : 'Select'}</span>
                              </button>

                              <button
                                onClick={() => setAssetToDelete(asset)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Delete Audio"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Background Music Tab */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-600" />
                  Project Musical Score & Prompts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save Suno / Udio prompts and upload background audio tracks for the complete project
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Music not required toggle */}
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={!!project.musicNotRequired}
                    onChange={handleToggleMusicNotRequired}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Music Not Required</span>
                </label>

                <MediaUploader
                  userId={userId}
                  projectId={project.id}
                  category="music"
                  acceptedTypes="audio"
                  buttonLabel="Upload Music Track"
                  onUploaded={async (asset) => {
                    if (!project.selectedMusicAssetId) {
                      await onUpdateProject({ selectedMusicAssetId: asset.id });
                      showToast('Auto-selected as primary background track! 🎵', 'success');
                    }
                  }}
                />
              </div>
            </div>

            {/* Grid: Music Prompts vs Uploaded Tracks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Left: Music Prompts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Music Prompts ({projectMusicPrompts.length})
                  </h4>
                  <button
                    onClick={() => {
                      setEditingPrompt(null);
                      setPromptCategory('music');
                      setIsPromptModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg"
                  >
                    + Add Prompt
                  </button>
                </div>

                {projectMusicPrompts.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Music className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-500">No music prompts saved</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Paste prompts used for Suno or Udio (e.g., genre, mood, tempo, instruments).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectMusicPrompts.map((p) => (
                      <PromptCard
                        key={p.id}
                        prompt={p}
                        onEdit={(pr) => {
                          setEditingPrompt(pr);
                          setPromptCategory('music');
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

              {/* Right: Uploaded Music Tracks */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  Uploaded Background Tracks ({projectMusicAssets.length})
                </h4>

                {projectMusicAssets.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-xs text-slate-500">No music tracks uploaded</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 mb-2">
                      Upload exported background score tracks (MP3/WAV).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectMusicAssets.map((asset) => {
                      const isPrimary = project.selectedMusicAssetId === asset.id;
                      const isPlaying = playingAssetId === asset.id;

                      return (
                        <div
                          key={asset.id}
                          className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                            isPrimary
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => togglePlayAudio(asset)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0 ${
                                isPlaying
                                  ? 'bg-purple-600 text-white animate-pulse'
                                  : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              }`}
                              title={isPlaying ? 'Pause' : 'Play audio preview'}
                            >
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>

                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate" title={asset.name}>
                                {asset.name}
                              </h5>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {(asset.size / (1024 * 1024)).toFixed(2)} MB
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleSelectPrimaryMusic(asset.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                isPrimary
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isPrimary ? 'Primary Score' : 'Select'}</span>
                            </button>

                            <button
                              onClick={() => setAssetToDelete(asset)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Delete Music"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Step CTA */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl border border-pink-200/60 p-5 shadow-xs flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-pink-950 uppercase tracking-wider mb-0.5">
            Next in the Pipeline: Scene Video Clips
          </h4>
          <p className="text-xs text-pink-800/80">
            Animate your primary images using Runway, Kling, or Luma, and attach scene video clips.
          </p>
        </div>
        <button
          onClick={onGoToSceneVideosStage}
          className="px-4 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <span>Continue</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Audio delete confirm modal */}
      {assetToDelete && (
        <ConfirmModal
          isOpen={!!assetToDelete}
          title="Delete Audio Asset"
          message={`Are you sure you want to delete "${assetToDelete.name}"?`}
          confirmText="Delete Audio"
          confirmVariant="danger"
          onConfirm={handleDeleteAssetConfirm}
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
            await onCreatePrompt({
              ...data,
              category: promptCategory,
              sceneId: promptCategory === 'voice' ? activeScene?.id : '',
            });
            showToast('Prompt saved');
          }
        }}
        initialData={editingPrompt}
        defaultCategory={promptCategory}
        defaultSceneId={promptCategory === 'voice' ? activeScene?.id : ''}
        scenes={scenes}
      />
    </div>
  );
};
