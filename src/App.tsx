import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import {
  Project,
  Scene,
  Prompt,
  Character,
  Asset,
  ChecklistItem,
} from './types';
import {
  subscribeProjects,
  subscribeProject,
  createProject,
  updateProject,
  deleteProject,
  subscribeScenes,
  createScene,
  updateScene,
  deleteScene,
  duplicateScene,
  subscribePrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  subscribeCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  subscribeAssets,
  updateAsset,
  deleteAsset,
  subscribeTasks,
  updateTask,
} from './services/db';

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Projects list state
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Active project state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Subcollections for active project
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tasks, setTasks] = useState<ChecklistItem[]>([]);

  // 1. Subscribe to projects when user is authenticated
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setProjectsLoading(false);
      return;
    }

    setProjectsLoading(true);
    setProjectsError(null);

    const unsubscribe = subscribeProjects(
      user.uid,
      (list) => {
        setProjects(list);
        setProjectsLoading(false);
        setProjectsError(null);
      },
      (err) => {
        setProjectsError(err.message || 'Failed to load projects');
        setProjectsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 2. Subscribe to active project and subcollections when selected
  useEffect(() => {
    if (!user || !selectedProjectId) {
      setActiveProject(null);
      setScenes([]);
      setPrompts([]);
      setCharacters([]);
      setAssets([]);
      setTasks([]);
      return;
    }

    const unsubProject = subscribeProject(
      user.uid,
      selectedProjectId,
      (proj) => {
        setActiveProject(proj);
      },
      (err) => {
        showToast('Error loading project details', 'error');
      }
    );

    const unsubScenes = subscribeScenes(
      user.uid,
      selectedProjectId,
      (scs) => setScenes(scs),
      (err) => console.error(err)
    );

    const unsubPrompts = subscribePrompts(
      user.uid,
      selectedProjectId,
      (prms) => setPrompts(prms),
      (err) => console.error(err)
    );

    const unsubChars = subscribeCharacters(
      user.uid,
      selectedProjectId,
      (chars) => setCharacters(chars),
      (err) => console.error(err)
    );

    const unsubAssets = subscribeAssets(
      user.uid,
      selectedProjectId,
      (asts) => setAssets(asts),
      (err) => console.error(err)
    );

    const unsubTasks = subscribeTasks(
      user.uid,
      selectedProjectId,
      (tsks) => setTasks(tsks),
      (err) => console.error(err)
    );

    return () => {
      unsubProject();
      unsubScenes();
      unsubPrompts();
      unsubChars();
      unsubAssets();
      unsubTasks();
    };
  }, [user, selectedProjectId]);

  // Handle Project Creation
  const handleCreateProject = async (data: Partial<Project> & { title: string }) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsCreatingProject(true);
    try {
      const newProj = await createProject(user.uid, data);
      setIsCreateModalOpen(false);
      setSelectedProjectId(newProj.id);
      showToast(`Project "${newProj.title}" created! Opening Story stage...`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create project', 'error');
      throw err;
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Archive / Restore project
  const handleArchiveProject = async (project: Project, archive: boolean) => {
    if (!user) return;
    try {
      await updateProject(user.uid, project.id, {
        status: archive ? 'archived' : 'in_progress',
      });
      showToast(archive ? 'Project archived' : 'Project restored');
    } catch (err: any) {
      showToast('Action failed', 'error');
    }
  };

  // Deep delete project
  const handleDeleteProject = async (project: Project) => {
    if (!user) return;
    await deleteProject(user.uid, project.id);
    if (selectedProjectId === project.id) {
      setSelectedProjectId(null);
    }
  };

  // Project prompt duplication
  const handleDuplicatePrompt = async (prompt: Prompt) => {
    if (!user || !selectedProjectId) return;
    return await createPrompt(user.uid, selectedProjectId, {
      ...prompt,
      title: `${prompt.title} (Copy)`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        isInsideProject={!!selectedProjectId && !!activeProject}
        projectTitle={activeProject?.title}
        onGoHome={() => setSelectedProjectId(null)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {authLoading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-purple-600/20 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-slate-500 font-medium">Connecting to secure workspace...</p>
          </div>
        ) : !user ? (
          /* Unauthenticated Landing */
          <div className="py-12 space-y-8">
            <Dashboard
              projects={[]}
              loading={false}
              error={null}
              onRetry={() => {}}
              onOpenCreateModal={() => setIsAuthModalOpen(true)}
              onSelectProject={() => setIsAuthModalOpen(true)}
              onArchiveProject={async () => {}}
              onDeleteProject={async () => {}}
              userId=""
            />
          </div>
        ) : selectedProjectId && activeProject ? (
          /* Active Project Workspace */
          <ProjectWorkspace
            userId={user.uid}
            project={activeProject}
            scenes={scenes}
            prompts={prompts}
            characters={characters}
            assets={assets}
            tasks={tasks}
            onBackToDashboard={() => setSelectedProjectId(null)}
            onUpdateProject={(updates) => updateProject(user.uid, activeProject.id, updates)}
            onCreateScene={(data) => createScene(user.uid, activeProject.id, data)}
            onUpdateScene={(sceneId, updates) => updateScene(user.uid, activeProject.id, sceneId, updates)}
            onDeleteScene={(sceneId) => deleteScene(user.uid, activeProject.id, sceneId)}
            onDuplicateScene={(scene) => duplicateScene(user.uid, activeProject.id, scene, prompts)}
            onCreatePrompt={(data) => createPrompt(user.uid, activeProject.id, data)}
            onUpdatePrompt={(promptId, updates) => updatePrompt(user.uid, activeProject.id, promptId, updates)}
            onDeletePrompt={(promptId) => deletePrompt(user.uid, activeProject.id, promptId)}
            onDuplicatePrompt={handleDuplicatePrompt}
            onCreateCharacter={(data) => createCharacter(user.uid, activeProject.id, data)}
            onUpdateCharacter={(charId, updates) => updateCharacter(user.uid, activeProject.id, charId, updates)}
            onDeleteCharacter={(charId) => deleteCharacter(user.uid, activeProject.id, charId)}
            onUpdateAsset={(assetId, updates) => updateAsset(user.uid, activeProject.id, assetId, updates)}
            onDeleteAsset={(assetId, storagePath) => deleteAsset(user.uid, activeProject.id, assetId, storagePath)}
            onUpdateTask={(taskId, updates) => updateTask(user.uid, activeProject.id, taskId, updates)}
          />
        ) : (
          /* User Dashboard */
          <Dashboard
            projects={projects}
            loading={projectsLoading}
            error={projectsError}
            onRetry={() => {
              setProjectsLoading(true);
              setProjectsError(null);
            }}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onArchiveProject={handleArchiveProject}
            onDeleteProject={handleDeleteProject}
            userId={user.uid}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen || (!user && !authLoading && isCreateModalOpen)}
        onClose={() => setIsAuthModalOpen(false)}
        canDismiss={true}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen && !!user}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        isLoading={isCreatingProject}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
