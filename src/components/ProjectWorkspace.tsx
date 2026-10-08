import React, { useState, useEffect } from 'react';
import { Project, Scene, Prompt, Character, Asset, ChecklistItem, StageId } from '../types';
import { calculateProjectProgress } from '../services/guidance';
import { exportProjectJSON, exportProjectMarkdown } from '../services/exportService';
import { useToast } from './Toast';
import { StoryStage } from './stages/StoryStage';
import { ScenesStage } from './stages/ScenesStage';
import { ImagesStage } from './stages/ImagesStage';
import { VoiceMusicStage } from './stages/VoiceMusicStage';
import { SceneVideosStage } from './stages/SceneVideosStage';
import { FinalVideoStage } from './stages/FinalVideoStage';
import { AllPromptsStage } from './stages/AllPromptsStage';
import { 
  BookOpen, 
  Users, 
  Image as ImageIcon, 
  Mic, 
  Film, 
  CheckCircle2, 
  FileCode, 
  LayoutGrid, 
  ArrowLeft, 
  FileDown, 
  Share2, 
  Clock, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';

interface ProjectWorkspaceProps {
  userId: string;
  project: Project;
  scenes: Scene[];
  prompts: Prompt[];
  characters: Character[];
  assets: Asset[];
  tasks: ChecklistItem[];
  onBackToDashboard: () => void;
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  // Scene CRUD
  onCreateScene: (data: Partial<Scene>) => Promise<Scene>;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
  onDeleteScene: (sceneId: string) => Promise<void>;
  onDuplicateScene: (scene: Scene) => Promise<Scene>;
  // Prompt CRUD
  onCreatePrompt: (data: any) => Promise<any>;
  onUpdatePrompt: (promptId: string, updates: any) => Promise<void>;
  onDeletePrompt: (promptId: string) => Promise<void>;
  onDuplicatePrompt: (prompt: Prompt) => Promise<any>;
  // Character CRUD
  onCreateCharacter: (data: Partial<Character> & { name: string }) => Promise<Character>;
  onUpdateCharacter: (characterId: string, updates: Partial<Character>) => Promise<void>;
  onDeleteCharacter: (characterId: string) => Promise<void>;
  // Asset CRUD
  onUpdateAsset: (assetId: string, updates: Partial<Asset>) => Promise<void>;
  onDeleteAsset: (assetId: string, storagePath: string) => Promise<void>;
  // Task CRUD
  onUpdateTask: (taskId: string, updates: Partial<ChecklistItem>) => Promise<void>;
}

const STAGES: { id: StageId; title: string; stepNum: string; icon: any }[] = [
  { id: 'story', title: 'Story', stepNum: '1', icon: BookOpen },
  { id: 'scenes', title: 'Scenes & Characters', stepNum: '2', icon: Users },
  { id: 'images', title: 'Images', stepNum: '3', icon: ImageIcon },
  { id: 'voice_music', title: 'Voice & Music', stepNum: '4', icon: Mic },
  { id: 'scene_videos', title: 'Scene Videos', stepNum: '5', icon: Film },
  { id: 'final_video', title: 'Final Video', stepNum: '6', icon: CheckCircle2 },
  { id: 'all_prompts', title: 'All Prompts', stepNum: '★', icon: FileCode },
];

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  userId,
  project,
  scenes,
  prompts,
  characters,
  assets,
  tasks,
  onBackToDashboard,
  onUpdateProject,
  onCreateScene,
  onUpdateScene,
  onDeleteScene,
  onDuplicateScene,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onDuplicatePrompt,
  onCreateCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onUpdateAsset,
  onDeleteAsset,
  onUpdateTask,
}) => {
  const { showToast } = useToast();

  // Active stage (remembered from project doc or default story)
  const [activeStage, setActiveStage] = useState<StageId>(
    project.lastOpenedStage || 'story'
  );

  // Focus scene (remembered from project doc)
  const [focusSceneId, setFocusSceneId] = useState<string | undefined>(
    project.lastOpenedSceneId || (scenes.length > 0 ? scenes[0].id : undefined)
  );

  // Compute progress and recommended next task
  const progressSummary = calculateProjectProgress(
    project,
    scenes,
    prompts,
    assets,
    tasks
  );

  // Sync stage navigation to project doc
  const handleStageChange = (newStage: StageId, newSceneId?: string) => {
    setActiveStage(newStage);
    if (newSceneId) setFocusSceneId(newSceneId);

    // Persist last opened stage in Firestore
    onUpdateProject({
      lastOpenedStage: newStage,
      lastOpenedSceneId: newSceneId || focusSceneId || '',
    }).catch(() => {});
  };

  const handleNextTaskAction = () => {
    if (!progressSummary.nextTask) return;
    handleStageChange(progressSummary.nextTask.stage, progressSummary.nextTask.sceneId);
    showToast(`Jumped to: ${progressSummary.nextTask.title}`, 'info');
  };

  // Warn about missing upstream steps if advancing ahead
  const getUpstreamWarning = (): string | null => {
    if (activeStage === 'images' && scenes.length === 0) {
      return 'No scenes created yet. Consider creating scenes in Stage 2 first.';
    }
    if (activeStage === 'scene_videos' && scenes.every((s) => !s.selectedImageAssetId)) {
      return 'No primary scene images selected yet. Animate images after selecting them in Stage 3.';
    }
    if (activeStage === 'final_video' && scenes.every((s) => !s.selectedVideoAssetId)) {
      return 'No scene video clips generated yet. You can assemble clips once scenes are animated.';
    }
    return null;
  };

  const upstreamWarning = getUpstreamWarning();

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Project Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          {/* Back button & Metadata pills */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button
              onClick={onBackToDashboard}
              className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Projects
            </button>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
              {project.aspectRatio || '16:9'}
            </span>
            {project.visualStyle && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 truncate max-w-xs">
                {project.visualStyle}
              </span>
            )}
            {project.targetDuration && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {project.targetDuration}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {project.title}
          </h1>
          {project.description && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              exportProjectJSON(project, scenes, prompts, characters, assets, tasks);
              showToast('Exported project metadata JSON');
            }}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
            title="Download full project JSON metadata"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          <button
            onClick={() => {
              exportProjectMarkdown(project, scenes, prompts, characters);
              showToast('Exported Story & Prompts Markdown');
            }}
            className="px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition flex items-center gap-1.5"
            title="Download readable Markdown export of story and prompts"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Markdown</span>
          </button>
        </div>
      </div>

      {/* 2. Pipeline Progress Bar & Next Task Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-purple-800/40 space-y-4">
        {/* Top: Progress Percentage & Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Pipeline Progress
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">
                {progressSummary.completedRequired} of {progressSummary.totalRequired} milestones
              </span>
            </div>
            <div className="text-2xl font-black text-white mt-0.5">
              {progressSummary.percent}% Complete
            </div>
          </div>

          {/* Next Task Card */}
          {progressSummary.nextTask ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:px-4 sm:py-3 border border-white/15 flex items-center justify-between gap-4 max-w-md">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider block">
                  Recommended Next Task
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {progressSummary.nextTask.title}
                </span>
                <span className="text-[11px] text-purple-200 truncate block">
                  {progressSummary.nextTask.description}
                </span>
              </div>
              <button
                onClick={handleNextTaskAction}
                className="px-3 py-1.5 text-xs font-extrabold text-slate-900 bg-gradient-to-r from-orange-400 to-amber-300 hover:from-orange-500 hover:to-amber-400 rounded-xl transition shrink-0 shadow-md flex items-center gap-1.5"
              >
                <span>Jump</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-3 flex items-center gap-2 text-xs text-emerald-200 font-semibold">
              <CheckCheck className="w-5 h-5 text-emerald-400" />
              <span>All required workflow milestones completed!</span>
            </div>
          )}
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-400 via-orange-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressSummary.percent}%` }}
          />
        </div>
      </div>

      {/* Upstream Warning (Non-blocking) */}
      {upstreamWarning && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-bold">Missing Upstream Step: </strong>
            <span>{upstreamWarning} You can still work on this stage freely.</span>
          </div>
        </div>
      )}

      {/* 3. Stage Navigation Bar */}
      <nav aria-label="Pipeline Stages" className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-2xs flex items-center gap-1 overflow-x-auto scrollbar-none">
        {STAGES.map((st) => {
          const isActive = activeStage === st.id;
          const Icon = st.icon;

          return (
            <button
              key={st.id}
              onClick={() => handleStageChange(st.id)}
              className={`flex-1 min-w-[130px] sm:min-w-0 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {st.stepNum}
              </span>
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{st.title}</span>
            </button>
          );
        })}
      </nav>

      {/* 4. Active Stage View */}
      {activeStage === 'story' && (
        <StoryStage
          project={project}
          prompts={prompts}
          onUpdateProject={onUpdateProject}
          onCreatePrompt={(data) => onCreatePrompt({ ...data, projectId: project.id })}
          onUpdatePrompt={onUpdatePrompt}
          onDeletePrompt={onDeletePrompt}
          onDuplicatePrompt={onDuplicatePrompt}
          onGoToNextStage={() => handleStageChange('scenes')}
        />
      )}

      {activeStage === 'scenes' && (
        <ScenesStage
          userId={userId}
          projectId={project.id}
          scenes={scenes}
          characters={characters}
          prompts={prompts}
          assets={assets}
          onCreateScene={onCreateScene}
          onUpdateScene={onUpdateScene}
          onDeleteScene={onDeleteScene}
          onDuplicateScene={onDuplicateScene}
          onCreateCharacter={onCreateCharacter}
          onUpdateCharacter={onUpdateCharacter}
          onDeleteCharacter={onDeleteCharacter}
          onCreatePrompt={(data) => onCreatePrompt({ ...data, projectId: project.id })}
          onUpdatePrompt={onUpdatePrompt}
          onDeletePrompt={onDeletePrompt}
          onGoToImagesStage={(sceneId) => handleStageChange('images', sceneId)}
        />
      )}

      {activeStage === 'images' && (
        <ImagesStage
          userId={userId}
          projectId={project.id}
          scenes={scenes}
          prompts={prompts}
          assets={assets}
          currentSceneId={focusSceneId}
          onUpdateScene={onUpdateScene}
          onCreatePrompt={(data) => onCreatePrompt({ ...data, projectId: project.id })}
          onUpdatePrompt={onUpdatePrompt}
          onDeletePrompt={onDeletePrompt}
          onDuplicatePrompt={onDuplicatePrompt}
          onUpdateAsset={onUpdateAsset}
          onDeleteAsset={onDeleteAsset}
          onGoToVoiceMusicStage={() => handleStageChange('voice_music')}
        />
      )}

      {activeStage === 'voice_music' && (
        <VoiceMusicStage
          userId={userId}
          project={project}
          scenes={scenes}
          prompts={prompts}
          assets={assets}
          currentSceneId={focusSceneId}
          onUpdateProject={onUpdateProject}
          onUpdateScene={onUpdateScene}
          onCreatePrompt={(data) => onCreatePrompt({ ...data, projectId: project.id })}
          onUpdatePrompt={onUpdatePrompt}
          onDeletePrompt={onDeletePrompt}
          onDuplicatePrompt={onDuplicatePrompt}
          onDeleteAsset={onDeleteAsset}
          onGoToSceneVideosStage={() => handleStageChange('scene_videos')}
        />
      )}

      {activeStage === 'scene_videos' && (
        <SceneVideosStage
          userId={userId}
          projectId={project.id}
          scenes={scenes}
          prompts={prompts}
          assets={assets}
          currentSceneId={focusSceneId}
          onUpdateScene={onUpdateScene}
          onCreatePrompt={(data) => onCreatePrompt({ ...data, projectId: project.id })}
          onUpdatePrompt={onUpdatePrompt}
          onDeletePrompt={onDeletePrompt}
          onDuplicatePrompt={onDuplicatePrompt}
          onDeleteAsset={onDeleteAsset}
          onGoToFinalVideoStage={() => handleStageChange('final_video')}
        />
      )}

      {activeStage === 'final_video' && (
        <FinalVideoStage
          userId={userId}
          project={project}
          scenes={scenes}
          prompts={prompts}
          assets={assets}
          tasks={tasks}
          onUpdateProject={onUpdateProject}
          onUpdateTask={onUpdateTask}
          onCreatePrompt={(data) => onCreatePrompt({ ...data, projectId: project.id })}
          onUpdatePrompt={onUpdatePrompt}
          onDeletePrompt={onDeletePrompt}
          onDuplicatePrompt={onDuplicatePrompt}
          onDeleteAsset={onDeleteAsset}
        />
      )}

      {activeStage === 'all_prompts' && (
        <AllPromptsStage
          prompts={prompts}
          scenes={scenes}
          characters={characters}
          onCreatePrompt={(data) => onCreatePrompt({ ...data, projectId: project.id })}
          onUpdatePrompt={onUpdatePrompt}
          onDeletePrompt={onDeletePrompt}
          onDuplicatePrompt={onDuplicatePrompt}
        />
      )}
    </div>
  );
};
