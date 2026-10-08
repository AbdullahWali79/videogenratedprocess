import {
  Project,
  Scene,
  Prompt,
  Asset,
  ChecklistItem,
  NextTaskRecommendation,
  ProgressSummary,
} from '../types';

export function calculateProjectProgress(
  project: Project,
  scenes: Scene[],
  prompts: Prompt[],
  assets: Asset[],
  tasks: ChecklistItem[]
): ProgressSummary {
  let totalRequired = 0;
  let completedRequired = 0;
  let nextTask: NextTaskRecommendation | null = null;

  // 1. STORY STAGE
  totalRequired += 1;
  const isStoryDone = Boolean(project.storyApproved && project.storyText?.trim());
  if (isStoryDone) {
    completedRequired += 1;
  } else if (!nextTask) {
    nextTask = {
      stage: 'story',
      title: 'Finalize and approve story',
      description: project.storyText?.trim()
        ? 'Review story and toggle "Mark Story Approved".'
        : 'Paste your story draft and development prompts.',
      actionText: 'Go to Story',
    };
  }

  // 2. SCENES CREATION
  totalRequired += 1;
  const hasScenes = scenes.length > 0;
  if (hasScenes) {
    completedRequired += 1;
  } else if (!nextTask) {
    nextTask = {
      stage: 'scenes',
      title: 'Add your first scene',
      description: 'Break down your story into distinct visual scenes.',
      actionText: 'Add Scenes',
    };
  }

  // 3. PER-SCENE REQUIREMENTS (sorted by order)
  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  for (let i = 0; i < sortedScenes.length; i++) {
    const scene = sortedScenes[i];
    const sceneNum = scene.order || i + 1;

    // A. Scene script / text
    totalRequired += 1;
    const hasScript = Boolean(scene.sceneText?.trim());
    if (hasScript) {
      completedRequired += 1;
    } else if (!nextTask) {
      nextTask = {
        stage: 'scenes',
        sceneId: scene.id,
        title: `Scene ${sceneNum}: Add scene description`,
        description: `Define visual action and script for "${scene.title}".`,
        actionText: `Edit Scene ${sceneNum}`,
      };
    }

    // B. Scene Primary Image
    totalRequired += 1;
    const hasImage = Boolean(scene.selectedImageAssetId);
    if (hasImage) {
      completedRequired += 1;
    } else if (!nextTask) {
      const hasImagePrompt = prompts.some(
        (p) => p.sceneId === scene.id && p.category === 'image'
      );
      nextTask = {
        stage: 'images',
        sceneId: scene.id,
        title: `Scene ${sceneNum}: ${hasImagePrompt ? 'Upload or select image' : 'Save image prompt'}`,
        description: hasImagePrompt
          ? `Image prompt saved. Generate in your external tool and upload the image.`
          : `Add an image generation prompt for "${scene.title}".`,
        actionText: `Open Images for Scene ${sceneNum}`,
      };
    }

    // C. Scene Voice (unless Voice Not Required)
    if (!scene.voiceNotRequired) {
      totalRequired += 1;
      const hasVoice = Boolean(scene.selectedVoiceAssetId);
      if (hasVoice) {
        completedRequired += 1;
      } else if (!nextTask) {
        nextTask = {
          stage: 'voice_music',
          sceneId: scene.id,
          title: `Scene ${sceneNum}: Select voiceover`,
          description: `Upload voice audio from your TTS tool or mark "Voice Not Required".`,
          actionText: `Voice for Scene ${sceneNum}`,
        };
      }
    }

    // D. Scene Video Clip
    totalRequired += 1;
    const hasVideo = Boolean(scene.selectedVideoAssetId);
    if (hasVideo) {
      completedRequired += 1;
    } else if (!nextTask) {
      const hasVideoPrompt = prompts.some(
        (p) => p.sceneId === scene.id && p.category === 'video'
      );
      nextTask = {
        stage: 'scene_videos',
        sceneId: scene.id,
        title: `Scene ${sceneNum}: ${hasVideoPrompt ? 'Upload scene clip' : 'Add video prompt & clip'}`,
        description: hasVideoPrompt
          ? `Video prompt ready. Animate image externally and upload the scene clip.`
          : `Save video motion prompt and upload the rendered clip.`,
        actionText: `Scene ${sceneNum} Videos`,
      };
    }
  }

  // 4. BACKGROUND MUSIC (unless Music Not Required)
  if (!project.musicNotRequired) {
    totalRequired += 1;
    const hasMusic = Boolean(project.selectedMusicAssetId);
    if (hasMusic) {
      completedRequired += 1;
    } else if (!nextTask) {
      nextTask = {
        stage: 'voice_music',
        title: 'Select background music',
        description: 'Upload your background track or mark "Music Not Required".',
        actionText: 'Configure Music',
      };
    }
  }

  // 5. FINAL ASSEMBLED VIDEO
  totalRequired += 1;
  const hasFinalVideo = Boolean(project.selectedFinalVideoAssetId);
  if (hasFinalVideo) {
    completedRequired += 1;
  } else if (!nextTask) {
    nextTask = {
      stage: 'final_video',
      title: 'Assemble and upload final video',
      description: 'Combine scene clips in your editor and upload the final exported video.',
      actionText: 'Go to Final Video',
    };
  }

  // 6. REQUIRED CHECKLIST TASKS
  const requiredTasks = tasks.filter((t) => t.required);
  for (const t of requiredTasks) {
    totalRequired += 1;
    if (t.status === 'complete') {
      completedRequired += 1;
    } else if (!nextTask) {
      nextTask = {
        stage: 'final_video',
        title: `Checklist: ${t.label}`,
        description: 'Complete all required checklist items before marking project done.',
        actionText: 'Review Checklist',
      };
    }
  }

  // If status is manually set to completed or override provided
  if (project.status === 'completed') {
    completedRequired = totalRequired;
    nextTask = null;
  }

  const percent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  return {
    percent,
    totalRequired,
    completedRequired,
    nextTask,
  };
}
