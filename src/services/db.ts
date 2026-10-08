import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { db, storage } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import {
  Project,
  Scene,
  Prompt,
  Character,
  Asset,
  ChecklistItem,
  AssetType
} from '../types';

function generateId(): string {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

// ==========================================
// PROJECTS
// ==========================================

export function subscribeProjects(
  userId: string,
  onData: (projects: Project[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/projects`;
  const colRef = collection(db, 'users', userId, 'projects');
  
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Project);
      });
      // Sort by updatedAt descending
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      onData(list);
    },
    (err) => {
      console.error('Error fetching projects:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export function subscribeProject(
  userId: string,
  projectId: string,
  onData: (project: Project | null) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/projects/${projectId}`;
  const docRef = doc(db, 'users', userId, 'projects', projectId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData({ id: snapshot.id, ...snapshot.data() } as Project);
      } else {
        onData(null);
      }
    },
    (err) => {
      console.error(`Error subscribing to project ${projectId}:`, err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

export async function createProject(
  userId: string,
  data: Partial<Project> & { title: string }
): Promise<Project> {
  const projectId = generateId();
  const path = `users/${userId}/projects/${projectId}`;
  const now = new Date().toISOString();

  const newProject: Project = {
    id: projectId,
    userId,
    title: data.title.trim(),
    description: data.description || '',
    language: data.language || 'English',
    visualStyle: data.visualStyle || 'Cinematic Photorealistic',
    aspectRatio: data.aspectRatio || '16:9',
    targetDuration: data.targetDuration || '60s',
    notes: data.notes || '',
    status: 'draft',
    lastOpenedStage: 'story',
    storyApproved: false,
    storyText: '',
    storyNotes: '',
    musicNotRequired: false,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId);
    await setDoc(docRef, newProject);
    // Seed initial default checklist tasks
    await seedDefaultTasks(userId, projectId);
    return newProject;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProject(
  userId: string,
  projectId: string,
  updates: Partial<Project>
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId);
    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(docRef, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const path = `users/${userId}/projects/${projectId}`;
  try {
    // 1. Delete subcollections: scenes, prompts, characters, assets, tasks
    const subcollections = ['scenes', 'prompts', 'characters', 'assets', 'tasks'];
    for (const sub of subcollections) {
      const subColRef = collection(db, 'users', userId, 'projects', projectId, sub);
      const subSnap = await getDocs(subColRef);
      const batch = writeBatch(db);
      subSnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }

    // 2. Delete parent project doc
    const projectRef = doc(db, 'users', userId, 'projects', projectId);
    await deleteDoc(projectRef);

    // 3. Delete files from Storage under users/{userId}/projects/{projectId}
    try {
      const storageFolderRef = ref(storage, `users/${userId}/projects/${projectId}`);
      const folderList = await listAll(storageFolderRef);
      for (const item of folderList.items) {
        await deleteObject(item).catch(() => {});
      }
    } catch (e) {
      console.warn('Storage cleanup non-critical error:', e);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// SCENES
// ==========================================

export function subscribeScenes(
  userId: string,
  projectId: string,
  onData: (scenes: Scene[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/projects/${projectId}/scenes`;
  const colRef = collection(db, 'users', userId, 'projects', projectId, 'scenes');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Scene[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Scene);
      });
      list.sort((a, b) => a.order - b.order);
      onData(list);
    },
    (err) => {
      console.error(`Error subscribing to scenes in ${projectId}:`, err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function createScene(
  userId: string,
  projectId: string,
  data: Partial<Scene>
): Promise<Scene> {
  const sceneId = generateId();
  const path = `users/${userId}/projects/${projectId}/scenes/${sceneId}`;
  const now = new Date().toISOString();

  const newScene: Scene = {
    id: sceneId,
    projectId,
    title: data.title?.trim() || 'New Scene',
    sceneText: data.sceneText || '',
    duration: data.duration || '',
    notes: data.notes || '',
    order: typeof data.order === 'number' ? data.order : 1,
    status: data.status || 'pending',
    voiceoverText: data.voiceoverText || '',
    voiceNotRequired: !!data.voiceNotRequired,
    selectedImageAssetId: '',
    selectedVoiceAssetId: '',
    selectedVideoAssetId: '',
    sceneMusicAssetId: '',
    upstreamChanged: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'scenes', sceneId);
    await setDoc(docRef, newScene);
    return newScene;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateScene(
  userId: string,
  projectId: string,
  sceneId: string,
  updates: Partial<Scene>
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}/scenes/${sceneId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'scenes', sceneId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteScene(
  userId: string,
  projectId: string,
  sceneId: string
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}/scenes/${sceneId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'scenes', sceneId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function duplicateScene(
  userId: string,
  projectId: string,
  sourceScene: Scene,
  existingPrompts: Prompt[]
): Promise<Scene> {
  const now = new Date().toISOString();
  const newSceneId = generateId();
  const path = `users/${userId}/projects/${projectId}/scenes/${newSceneId}`;

  const duplicatedScene: Scene = {
    ...sourceScene,
    id: newSceneId,
    title: `${sourceScene.title} (Copy)`,
    order: sourceScene.order + 1,
    status: 'pending',
    selectedImageAssetId: '',
    selectedVoiceAssetId: '',
    selectedVideoAssetId: '',
    sceneMusicAssetId: '',
    upstreamChanged: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // 1. Save new scene
    const sceneRef = doc(db, 'users', userId, 'projects', projectId, 'scenes', newSceneId);
    await setDoc(sceneRef, duplicatedScene);

    // 2. Duplicate prompts linked to this scene with new prompt IDs
    const scenePrompts = existingPrompts.filter((p) => p.sceneId === sourceScene.id);
    for (const prompt of scenePrompts) {
      const newPromptId = generateId();
      const newPrompt: Prompt = {
        ...prompt,
        id: newPromptId,
        title: `${prompt.title} (Scene Copy)`,
        sceneId: newSceneId,
        createdAt: now,
        updatedAt: now,
      };
      const promptRef = doc(db, 'users', userId, 'projects', projectId, 'prompts', newPromptId);
      await setDoc(promptRef, newPrompt);
    }

    return duplicatedScene;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ==========================================
// PROMPTS
// ==========================================

export function subscribePrompts(
  userId: string,
  projectId: string,
  onData: (prompts: Prompt[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/projects/${projectId}/prompts`;
  const colRef = collection(db, 'users', userId, 'projects', projectId, 'prompts');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Prompt[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Prompt);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (err) => {
      console.error(`Error subscribing to prompts in ${projectId}:`, err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function createPrompt(
  userId: string,
  projectId: string,
  data: Partial<Prompt> & { title: string; fullText: string; category: Prompt['category'] }
): Promise<Prompt> {
  const promptId = generateId();
  const path = `users/${userId}/projects/${projectId}/prompts/${promptId}`;
  const now = new Date().toISOString();

  const newPrompt: Prompt = {
    id: promptId,
    projectId,
    title: data.title.trim(),
    fullText: data.fullText,
    category: data.category,
    externalTool: data.externalTool || '',
    notes: data.notes || '',
    status: data.status || 'draft',
    order: typeof data.order === 'number' ? data.order : 0,
    sceneId: data.sceneId || '',
    characterId: data.characterId || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'prompts', promptId);
    await setDoc(docRef, newPrompt);
    return newPrompt;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePrompt(
  userId: string,
  projectId: string,
  promptId: string,
  updates: Partial<Prompt>
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}/prompts/${promptId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'prompts', promptId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePrompt(
  userId: string,
  projectId: string,
  promptId: string
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}/prompts/${promptId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'prompts', promptId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// CHARACTERS
// ==========================================

export function subscribeCharacters(
  userId: string,
  projectId: string,
  onData: (characters: Character[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/projects/${projectId}/characters`;
  const colRef = collection(db, 'users', userId, 'projects', projectId, 'characters');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Character[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Character);
      });
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onData(list);
    },
    (err) => {
      console.error(`Error subscribing to characters in ${projectId}:`, err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function createCharacter(
  userId: string,
  projectId: string,
  data: Partial<Character> & { name: string }
): Promise<Character> {
  const characterId = generateId();
  const path = `users/${userId}/projects/${projectId}/characters/${characterId}`;
  const now = new Date().toISOString();

  const newChar: Character = {
    id: characterId,
    projectId,
    name: data.name.trim(),
    description: data.description || '',
    appearanceNotes: data.appearanceNotes || '',
    sceneIds: data.sceneIds || [],
    referenceAssetIds: data.referenceAssetIds || [],
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'characters', characterId);
    await setDoc(docRef, newChar);
    return newChar;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCharacter(
  userId: string,
  projectId: string,
  characterId: string,
  updates: Partial<Character>
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}/characters/${characterId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'characters', characterId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCharacter(
  userId: string,
  projectId: string,
  characterId: string
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}/characters/${characterId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'characters', characterId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// ASSETS & STORAGE UPLOADS
// ==========================================

export function subscribeAssets(
  userId: string,
  projectId: string,
  onData: (assets: Asset[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/projects/${projectId}/assets`;
  const colRef = collection(db, 'users', userId, 'projects', projectId, 'assets');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Asset[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Asset);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (err) => {
      console.error(`Error subscribing to assets in ${projectId}:`, err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function uploadAssetFile(
  userId: string,
  projectId: string,
  file: File,
  category: Asset['category'],
  onProgress?: (percent: number) => void,
  sceneId?: string,
  promptId?: string,
  notes?: string
): Promise<Asset> {
  const assetId = generateId();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `users/${userId}/projects/${projectId}/assets/${assetId}_${sanitizedFileName}`;
  const storageRef = ref(storage, storagePath);

  // Determine fileType
  let fileType: AssetType = 'other';
  if (file.type.startsWith('image/')) fileType = 'image';
  else if (file.type.startsWith('audio/')) fileType = 'audio';
  else if (file.type.startsWith('video/')) fileType = 'video';

  // Resumable upload to Firebase Storage
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  });

  return new Promise<Asset>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Storage upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const now = new Date().toISOString();

          const assetData: Asset = {
            id: assetId,
            projectId,
            name: file.name,
            fileName: sanitizedFileName,
            fileType,
            mimeType: file.type,
            size: file.size,
            storagePath,
            downloadUrl,
            category,
            sceneId: sceneId || '',
            promptId: promptId || '',
            notes: notes || '',
            createdAt: now,
            updatedAt: now,
          };

          // Save metadata into Firestore
          const docRef = doc(db, 'users', userId, 'projects', projectId, 'assets', assetId);
          await setDoc(docRef, assetData);
          resolve(assetData);
        } catch (dbError) {
          // If Firestore write fails, clean up the orphan file in Storage
          try {
            await deleteObject(storageRef);
          } catch (cleanErr) {
            console.warn('Could not clean up orphan storage file:', cleanErr);
          }
          handleFirestoreError(
            dbError,
            OperationType.CREATE,
            `users/${userId}/projects/${projectId}/assets/${assetId}`
          );
        }
      }
    );
  });
}

export async function updateAsset(
  userId: string,
  projectId: string,
  assetId: string,
  updates: Partial<Asset>
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}/assets/${assetId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'assets', assetId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAsset(
  userId: string,
  projectId: string,
  assetId: string,
  storagePath: string
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}/assets/${assetId}`;
  try {
    // 1. Delete from Firestore
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'assets', assetId);
    await deleteDoc(docRef);

    // 2. Delete from Storage
    if (storagePath) {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef).catch((e) => {
        console.warn('Storage file deletion note:', e);
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// TASKS & CHECKLIST
// ==========================================

export const DEFAULT_CHECKLIST = [
  { label: 'Story concept & text approved', stage: 'story', required: true },
  { label: 'All scenes created and scripted', stage: 'scenes', required: true },
  { label: 'Visual consistency & character references confirmed', stage: 'scenes', required: false },
  { label: 'Scene primary images generated and selected', stage: 'images', required: true },
  { label: 'Voiceovers generated and selected (or marked not required)', stage: 'voice_music', required: true },
  { label: 'Background music track selected (or marked not required)', stage: 'voice_music', required: false },
  { label: 'Scene video clips generated and selected', stage: 'scene_videos', required: true },
  { label: 'Scene sequence & clip pacing verified', stage: 'final_video', required: true },
  { label: 'Voice timing & audio levels aligned', stage: 'final_video', required: false },
  { label: 'Subtitles & captions checked', stage: 'final_video', required: false },
  { label: 'Final edited video rendered and uploaded', stage: 'final_video', required: true },
  { label: 'Final video preview reviewed', stage: 'final_video', required: true },
];

export async function seedDefaultTasks(userId: string, projectId: string) {
  const now = new Date().toISOString();
  for (const item of DEFAULT_CHECKLIST) {
    const taskId = generateId();
    const task: ChecklistItem = {
      id: taskId,
      projectId,
      label: item.label,
      stage: item.stage,
      required: item.required,
      status: 'pending',
      notes: '',
      createdAt: now,
      updatedAt: now,
    };
    const taskRef = doc(db, 'users', userId, 'projects', projectId, 'tasks', taskId);
    await setDoc(taskRef, task).catch(() => {});
  }
}

export function subscribeTasks(
  userId: string,
  projectId: string,
  onData: (tasks: ChecklistItem[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/projects/${projectId}/tasks`;
  const colRef = collection(db, 'users', userId, 'projects', projectId, 'tasks');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ChecklistItem[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ChecklistItem);
      });
      onData(list);
    },
    (err) => {
      console.error(`Error subscribing to tasks in ${projectId}:`, err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function updateTask(
  userId: string,
  projectId: string,
  taskId: string,
  updates: Partial<ChecklistItem>
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}/tasks/${taskId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'tasks', taskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
