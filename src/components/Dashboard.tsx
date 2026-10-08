import React, { useState, useEffect } from 'react';
import { Project, Scene, ChecklistItem, Prompt, Asset } from '../types';
import { WorkflowGuide } from './WorkflowGuide';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from './Toast';
import { exportProjectJSON, exportProjectMarkdown } from '../services/exportService';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Film, 
  Calendar, 
  CheckCircle, 
  Archive, 
  Trash2, 
  FileDown, 
  Clock, 
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Layers,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

interface DashboardProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenCreateModal: () => void;
  onSelectProject: (projectId: string) => void;
  onArchiveProject: (project: Project, archive: boolean) => Promise<void>;
  onDeleteProject: (project: Project) => Promise<void>;
  userId: string;
}

interface ProjectMetadataCache {
  [projectId: string]: {
    sceneCount: number;
    progressPercent: number;
    nextTaskLabel: string;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  loading,
  error,
  onRetry,
  onOpenCreateModal,
  onSelectProject,
  onArchiveProject,
  onDeleteProject,
  userId,
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'draft' | 'completed' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'title' | 'progress'>('updatedAt');

  // Deletion modal state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Metadata cache (scene count, quick progress, next task)
  const [metaCache, setMetaCache] = useState<ProjectMetadataCache>({});

  // Fetch summary metadata for project cards
  useEffect(() => {
    if (!userId || projects.length === 0) return;

    let isMounted = true;
    const fetchMetadata = async () => {
      const updates: ProjectMetadataCache = {};
      for (const p of projects) {
        try {
          const scenesSnap = await getDocs(collection(db, 'users', userId, 'projects', p.id, 'scenes'));
          const sceneCount = scenesSnap.size;

          // Quick progress calculation
          let totalTasks = 3 + sceneCount * 3; // story + scenes + music + (per scene: image, voice, video)
          let doneTasks = 0;
          if (p.storyApproved) doneTasks += 1;
          if (sceneCount > 0) doneTasks += 1;
          if (p.musicNotRequired || p.selectedMusicAssetId) doneTasks += 1;
          if (p.selectedFinalVideoAssetId) doneTasks += 1;

          let missingItem = '';
          if (!p.storyApproved) {
            missingItem = 'Story draft needs review & approval';
          } else if (sceneCount === 0) {
            missingItem = 'Add first scene & script';
          } else {
            let sceneMissing = '';
            scenesSnap.forEach((docSnap) => {
              const data = docSnap.data();
              if (!sceneMissing) {
                if (!data.selectedImageAssetId) sceneMissing = `Scene "${data.title}": generate & select image`;
                else if (!data.selectedVoiceAssetId && !data.voiceNotRequired) sceneMissing = `Scene "${data.title}": record & select voice`;
                else if (!data.selectedVideoAssetId) sceneMissing = `Scene "${data.title}": render & select clip`;
                else doneTasks += 3;
              }
            });
            missingItem = sceneMissing || (p.selectedFinalVideoAssetId ? 'All required tasks done' : 'Assemble and upload final video');
          }

          if (p.status === 'completed') {
            doneTasks = totalTasks;
            missingItem = 'Project marked completed';
          }

          const progressPercent = totalTasks > 0 ? Math.min(100, Math.round((doneTasks / totalTasks) * 100)) : 0;

          updates[p.id] = {
            sceneCount,
            progressPercent,
            nextTaskLabel: missingItem,
          };
        } catch (e) {
          // Fallback if read failed
          updates[p.id] = {
            sceneCount: 0,
            progressPercent: p.status === 'completed' ? 100 : 0,
            nextTaskLabel: p.status === 'completed' ? 'Project completed' : 'Open project to continue',
          };
        }
      }
      if (isMounted) {
        setMetaCache(updates);
      }
    };

    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, [projects, userId]);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    // Search
    const term = searchTerm.toLowerCase();
    const matchSearch =
      p.title.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.language && p.language.toLowerCase().includes(term)) ||
      (p.visualStyle && p.visualStyle.toLowerCase().includes(term));

    if (!matchSearch) return false;

    // Status
    if (statusFilter === 'all') {
      return p.status !== 'archived'; // Do not show archived in default "all"
    }
    return p.status === statusFilter;
  });

  // Sort projects
  filteredProjects.sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'progress') {
      const progA = metaCache[a.id]?.progressPercent ?? 0;
      const progB = metaCache[b.id]?.progressPercent ?? 0;
      return progB - progA;
    }
    // Default updatedAt desc
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleExportFull = async (project: Project, format: 'json' | 'md') => {
    try {
      showToast('Preparing project export...', 'info');
      const [scenesSnap, promptsSnap, charsSnap, assetsSnap, tasksSnap] = await Promise.all([
        getDocs(collection(db, 'users', userId, 'projects', project.id, 'scenes')),
        getDocs(collection(db, 'users', userId, 'projects', project.id, 'prompts')),
        getDocs(collection(db, 'users', userId, 'projects', project.id, 'characters')),
        getDocs(collection(db, 'users', userId, 'projects', project.id, 'assets')),
        getDocs(collection(db, 'users', userId, 'projects', project.id, 'tasks')),
      ]);

      const scenes = scenesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Scene));
      const prompts = promptsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Prompt));
      const chars = charsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
      const assets = assetsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Asset));
      const tasks = tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ChecklistItem));

      if (format === 'json') {
        exportProjectJSON(project, scenes, prompts, chars, assets, tasks);
        showToast('Project JSON exported successfully');
      } else {
        exportProjectMarkdown(project, scenes, prompts, chars);
        showToast('Story & Prompts Markdown exported');
      }
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteProject(projectToDelete);
      showToast(`Project "${projectToDelete.title}" deleted`);
      setProjectToDelete(null);
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Permanent Workflow Guide */}
      <WorkflowGuide />

      {/* 2. Action Bar & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            My Video Projects
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {filteredProjects.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your stories, prompts, media assets, and next tasks
          </p>
        </div>

        {/* Prominent + Add Video Process Button */}
        <button
          onClick={onOpenCreateModal}
          className="px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-purple-700 to-orange-500 hover:from-purple-700 hover:to-orange-600 active:scale-98 rounded-2xl shadow-lg shadow-purple-500/25 transition transform flex items-center justify-center gap-2.5 shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>+ Add Video Process</span>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, description, language, or style..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'in_progress' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'draft' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'completed' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'archived' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Archived
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl text-xs font-semibold text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-0 focus:outline-none text-xs font-semibold text-slate-700 py-1 pr-1 cursor-pointer"
            >
              <option value="updatedAt">Recently Updated</option>
              <option value="title">Alphabetical (A-Z)</option>
              <option value="progress">Highest Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Error State with Honest Retry */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Failed to load video projects</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={onRetry}
            className="px-4 py-2 text-xs font-bold bg-white text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-xl transition flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* 5. Project Grid or Empty States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 animate-pulse shadow-xs"
            >
              <div className="h-6 bg-slate-200 rounded-md w-3/4" />
              <div className="h-4 bg-slate-100 rounded-md w-1/2" />
              <div className="h-2 bg-slate-100 rounded-full w-full" />
              <div className="h-10 bg-slate-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {searchTerm || statusFilter !== 'all' ? 'No matching video projects' : 'No video projects created yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search terms or filters above.'
              : 'Start your first video project to organize stories, scenes, image prompts, voiceovers, and scene clips.'}
          </p>
          <button
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-md shadow-purple-600/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            + Add Video Process
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const meta = metaCache[project.id] || {
              sceneCount: 0,
              progressPercent: project.status === 'completed' ? 100 : 0,
              nextTaskLabel: 'Open to continue',
            };

            const isArchived = project.status === 'archived';

            return (
              <div
                key={project.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 transition duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top */}
                <div className="p-6">
                  {/* Badges row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        project.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : project.status === 'in_progress'
                          ? 'bg-purple-100 text-purple-800'
                          : project.status === 'archived'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {project.status.replace('_', ' ')}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Layers className="w-3.5 h-3.5 text-purple-500" />
                      <span>{meta.sceneCount} {meta.sceneCount === 1 ? 'scene' : 'scenes'}</span>
                    </div>
                  </div>

                  {/* Title & Style */}
                  <h3
                    onClick={() => onSelectProject(project.id)}
                    className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition cursor-pointer line-clamp-1 mb-1"
                    title={project.title}
                  >
                    {project.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                      {project.aspectRatio || '16:9'}
                    </span>
                    {project.visualStyle && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium truncate max-w-[150px]">
                        {project.visualStyle}
                      </span>
                    )}
                    {project.language && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                        {project.language}
                      </span>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {project.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">Pipeline Progress</span>
                      <span className="text-purple-700 font-bold">{meta.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${meta.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Unfinished Task Banner */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5 text-xs">
                    <ListTodo className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
                        Next Unfinished Task
                      </span>
                      <span className="text-slate-600 line-clamp-1 font-medium">
                        {meta.nextTaskLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Timestamps, Action button & Menu */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(project.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Secondary Actions: Export & Archive & Delete */}
                    <div className="flex items-center">
                      <button
                        onClick={() => handleExportFull(project, 'json')}
                        className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-white transition"
                        title="Export JSON Metadata"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onArchiveProject(project, !isArchived)}
                        className={`p-1.5 rounded-lg hover:bg-white transition ${
                          isArchived ? 'text-amber-600' : 'text-slate-400 hover:text-amber-600'
                        }`}
                        title={isArchived ? 'Restore Project' : 'Archive Project'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setProjectToDelete(project)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Continue Video Process Button */}
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <ConfirmModal
          isOpen={!!projectToDelete}
          title="Delete Video Project"
          message={`Are you sure you want to delete "${projectToDelete.title}"? This permanently removes all associated scenes, prompts, characters, task records, and uploaded media files in Firebase Storage.`}
          confirmWord={projectToDelete.title}
          confirmText="Permanently Delete"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setProjectToDelete(null)}
        />
      )}
    </div>
  );
};
