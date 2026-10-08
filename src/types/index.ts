export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

export type StageId = 
  | 'story'
  | 'scenes'
  | 'images'
  | 'voice_music'
  | 'scene_videos'
  | 'final_video'
  | 'all_prompts';

export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  language?: string;
  visualStyle?: string;
  aspectRatio?: string; // '16:9' | '9:16' | '1:1' | '4:5' | '21:9'
  targetDuration?: string;
  notes?: string;
  status: ProjectStatus;
  lastOpenedStage?: StageId;
  lastOpenedSceneId?: string;
  storyApproved?: boolean;
  storyText?: string;
  storyNotes?: string;
  musicNotRequired?: boolean;
  selectedMusicAssetId?: string;
  selectedFinalVideoAssetId?: string;
  completionOverrideReason?: string;
  version: number;
  coverAssetUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type SceneStatus = 'pending' | 'in_progress' | 'complete' | 'skipped' | 'review_required';

export interface Scene {
  id: string;
  projectId: string;
  title: string;
  sceneText: string;
  duration?: string;
  notes?: string;
  order: number;
  status: SceneStatus;
  voiceoverText?: string;
  voiceNotRequired?: boolean;
  selectedImageAssetId?: string;
  selectedVoiceAssetId?: string;
  selectedVideoAssetId?: string;
  sceneMusicAssetId?: string;
  upstreamChanged?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PromptCategory = 
  | 'story'
  | 'character'
  | 'image'
  | 'voice'
  | 'music'
  | 'video'
  | 'editing'
  | 'other';

export type PromptStatus = 'draft' | 'ready' | 'used';

export interface Prompt {
  id: string;
  projectId: string;
  title: string;
  fullText: string;
  category: PromptCategory;
  externalTool?: string;
  notes?: string;
  status: PromptStatus;
  order?: number;
  sceneId?: string;
  characterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  appearanceNotes?: string;
  sceneIds?: string[];
  referenceAssetIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type AssetType = 'image' | 'audio' | 'video' | 'other';

export interface Asset {
  id: string;
  projectId: string;
  name: string;
  fileName: string;
  fileType: AssetType;
  mimeType?: string;
  size: number;
  storagePath: string;
  downloadUrl?: string;
  sceneId?: string;
  promptId?: string;
  category?: 'image' | 'voice' | 'music' | 'scene_video' | 'final_video' | 'reference';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'complete' | 'skipped' | 'review_required';

export interface ChecklistItem {
  id: string;
  projectId: string;
  label: string;
  stage: string;
  sceneId?: string;
  required: boolean;
  status: TaskStatus;
  notes?: string;
  manualOrAssetRule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NextTaskRecommendation {
  stage: StageId;
  sceneId?: string;
  title: string;
  description: string;
  actionText: string;
}

export interface ProgressSummary {
  percent: number;
  totalRequired: number;
  completedRequired: number;
  nextTask: NextTaskRecommendation | null;
}
