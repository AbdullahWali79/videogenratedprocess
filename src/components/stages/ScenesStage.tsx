import React, { useState } from 'react';
import { Scene, Character, Prompt, Asset } from '../../types';
import { useToast } from '../Toast';
import { ConfirmModal } from '../ConfirmModal';
import { PromptModal } from '../PromptModal';
import { MediaUploader } from '../MediaUploader';
import { 
  Plus, 
  Users, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Sparkles, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  UserPlus,
  Link,
  ImageIcon
} from 'lucide-react';

interface ScenesStageProps {
  userId: string;
  projectId: string;
  scenes: Scene[];
  characters: Character[];
  prompts: Prompt[];
  assets: Asset[];
  onCreateScene: (data: Partial<Scene>) => Promise<Scene>;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
  onDeleteScene: (sceneId: string) => Promise<void>;
  onDuplicateScene: (scene: Scene) => Promise<Scene>;
  onCreateCharacter: (data: Partial<Character> & { name: string }) => Promise<Character>;
  onUpdateCharacter: (characterId: string, updates: Partial<Character>) => Promise<void>;
  onDeleteCharacter: (characterId: string) => Promise<void>;
  onCreatePrompt: (data: any) => Promise<any>;
  onUpdatePrompt: (promptId: string, updates: any) => Promise<void>;
  onDeletePrompt: (promptId: string) => Promise<void>;
  onGoToImagesStage: (sceneId?: string) => void;
}

export const ScenesStage: React.FC<ScenesStageProps> = ({
  userId,
  projectId,
  scenes,
  characters,
  prompts,
  assets,
  onCreateScene,
  onUpdateScene,
  onDeleteScene,
  onDuplicateScene,
  onCreateCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onGoToImagesStage,
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'scenes' | 'characters'>('scenes');
  const [collapsedScenes, setCollapsedScenes] = useState<Record<string, boolean>>({});
  
  // Scene delete modal
  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);

  // Character state
  const [characterModalOpen, setCharacterModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [charName, setCharName] = useState('');
  const [charDesc, setCharDesc] = useState('');
  const [charAppearance, setCharAppearance] = useState('');
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);

  // Character Prompt Modal
  const [charPromptModalOpen, setCharPromptModalOpen] = useState(false);
  const [activeCharIdForPrompt, setActiveCharIdForPrompt] = useState<string>('');

  const toggleCollapse = (id: string) => {
    setCollapsedScenes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddScene = async () => {
    const nextOrder = scenes.length > 0 ? Math.max(...scenes.map((s) => s.order)) + 1 : 1;
    try {
      const newScene = await onCreateScene({
        title: `Scene ${nextOrder}`,
        order: nextOrder,
        sceneText: '',
        duration: '5s',
        status: 'pending',
      });
      showToast(`Added Scene ${nextOrder}`, 'success');
    } catch (err: any) {
      showToast('Failed to add scene', 'error');
    }
  };

  const handleDuplicate = async (scene: Scene) => {
    try {
      await onDuplicateScene(scene);
      showToast(`Duplicated "${scene.title}" with fresh IDs`, 'success');
    } catch (err: any) {
      showToast('Failed to duplicate scene', 'error');
    }
  };

  const handleMoveOrder = async (scene: Scene, direction: 'up' | 'down') => {
    const sorted = [...scenes].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === scene.id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const currentScene = sorted[index];
    const swapScene = sorted[targetIndex];

    const tempOrder = currentScene.order;
    await onUpdateScene(currentScene.id, { order: swapScene.order });
    await onUpdateScene(swapScene.id, { order: tempOrder });
    showToast('Scene order updated', 'info');
  };

  // Character handlers
  const openNewCharacterModal = () => {
    setEditingCharacter(null);
    setCharName('');
    setCharDesc('');
    setCharAppearance('');
    setSelectedSceneIds([]);
    setCharacterModalOpen(true);
  };

  const openEditCharacterModal = (c: Character) => {
    setEditingCharacter(c);
    setCharName(c.name);
    setCharDesc(c.description || '');
    setCharAppearance(c.appearanceNotes || '');
    setSelectedSceneIds(c.sceneIds || []);
    setCharacterModalOpen(true);
  };

  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charName.trim()) return;

    try {
      if (editingCharacter) {
        await onUpdateCharacter(editingCharacter.id, {
          name: charName.trim(),
          description: charDesc.trim(),
          appearanceNotes: charAppearance.trim(),
          sceneIds: selectedSceneIds,
        });
        showToast('Character updated', 'success');
      } else {
        await onCreateCharacter({
          name: charName.trim(),
          description: charDesc.trim(),
          appearanceNotes: charAppearance.trim(),
          sceneIds: selectedSceneIds,
        });
        showToast('Character added', 'success');
      }
      setCharacterModalOpen(false);
    } catch (err: any) {
      showToast('Failed to save character', 'error');
    }
  };

  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              Stage 2
            </span>
            <span className="text-xs text-slate-400">• Structural Breakdown</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Scenes & Character Continuity
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Add scenes, describe the visual camera action, set durations, and keep character appearance details consistent.
          </p>
        </div>

        {/* Tab switchers + Add action */}
        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('scenes')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'scenes' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Scenes ({scenes.length})
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'characters' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Characters ({characters.length})
            </button>
          </div>

          {activeTab === 'scenes' ? (
            <button
              onClick={handleAddScene}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Scene
            </button>
          ) : (
            <button
              onClick={openNewCharacterModal}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Add Character
            </button>
          )}
        </div>
      </div>

      {/* Content depending on tab */}
      {activeTab === 'scenes' ? (
        <div className="space-y-4">
          {sortedScenes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No scenes added yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Divide your story into chronological scenes so you can create image and video prompts for each shot.
              </p>
              <button
                onClick={handleAddScene}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Scene
              </button>
            </div>
          ) : (
            sortedScenes.map((scene, idx) => {
              const isCollapsed = !!collapsedScenes[scene.id];
              const scenePrompts = prompts.filter((p) => p.sceneId === scene.id);

              return (
                <div
                  key={scene.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden"
                >
                  {/* Collapsible Header */}
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-slate-50/60 border-b border-slate-100">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                        {scene.order || idx + 1}
                      </span>

                      {/* Scene Title Input */}
                      <input
                        type="text"
                        value={scene.title}
                        onChange={(e) => onUpdateScene(scene.id, { title: e.target.value })}
                        placeholder="Scene title..."
                        className="text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-600 focus:bg-white focus:outline-none px-1 py-0.5 rounded transition flex-1 min-w-0"
                      />
                    </div>

                    {/* Quick controls: Status, duration, order moves, duplicate, collapse */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status */}
                      <select
                        value={scene.status}
                        onChange={(e) => onUpdateScene(scene.id, { status: e.target.value as any })}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          scene.status === 'complete'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : scene.status === 'in_progress'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : scene.status === 'review_required'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="complete">Complete</option>
                        <option value="skipped">Skipped</option>
                        <option value="review_required">Review Required</option>
                      </select>

                      {/* Move Up/Down */}
                      <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleMoveOrder(scene, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition"
                          title="Move Scene Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(scene, 'down')}
                          disabled={idx === sortedScenes.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition"
                          title="Move Scene Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(scene)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-white transition"
                        title="Duplicate Scene (clones text & prompts with new IDs)"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setSceneToDelete(scene)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
                        title="Delete Scene"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Collapse Toggle */}
                      <button
                        onClick={() => toggleCollapse(scene.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition"
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Scene Body (expanded) */}
                  {!isCollapsed && (
                    <div className="p-5 space-y-4">
                      {/* Grid: Action script + Duration & notes */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Action script */}
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-purple-600" />
                            Visual Action & Shot Script
                          </label>
                          <textarea
                            value={scene.sceneText}
                            onChange={(e) => onUpdateScene(scene.id, { sceneText: e.target.value })}
                            placeholder="Describe the visual camera angle, character actions, background environment, lighting, and movement..."
                            rows={4}
                            className="w-full p-3 text-xs sm:text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-y"
                          />
                        </div>

                        {/* Duration & Notes */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-orange-500" />
                              Estimated Duration
                            </label>
                            <input
                              type="text"
                              value={scene.duration || ''}
                              onChange={(e) => onUpdateScene(scene.id, { duration: e.target.value })}
                              placeholder="e.g. 5s, 0:08"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Scene Notes & Directives
                            </label>
                            <textarea
                              value={scene.notes || ''}
                              onChange={(e) => onUpdateScene(scene.id, { notes: e.target.value })}
                              placeholder="e.g. Needs slow zoom-in; ensure character wears black coat."
                              rows={2}
                              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-y"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Jump to Image Studio for this Scene */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>
                            <strong>{scenePrompts.length}</strong> prompts attached
                          </span>
                          <span>•</span>
                          <span>
                            {scene.selectedImageAssetId ? (
                              <span className="text-emerald-600 font-semibold">Primary image selected ✅</span>
                            ) : (
                              <span className="text-amber-600">Image pending ⏳</span>
                            )}
                          </span>
                        </div>

                        <button
                          onClick={() => onGoToImagesStage(scene.id)}
                          className="px-3.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition flex items-center gap-1.5"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                          <span>Generate Images for this Scene</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {sortedScenes.length > 0 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleAddScene}
                className="px-5 py-2.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Scene
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Characters Tab */
        <div className="space-y-4">
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-900 leading-relaxed flex items-start gap-2.5">
            <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Character Consistency Hub (Optional):</strong>
              <p className="mt-0.5">
                Save character facial traits, recurring clothing, age, and prompt modifiers to keep your AI outputs visually consistent across all scenes.
              </p>
            </div>
          </div>

          {characters.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No characters created</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Characters help keep visual details identical across Midjourney or image generators.
              </p>
              <button
                onClick={openNewCharacterModal}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add First Character
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map((char) => {
                const charPrompts = prompts.filter((p) => p.characterId === char.id);
                return (
                  <div
                    key={char.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-bold text-slate-900">{char.name}</h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditCharacterModal(char)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            title="Edit Character"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCharacterToDelete(char)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Delete Character"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {char.description && (
                        <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                          <strong>Bio:</strong> {char.description}
                        </p>
                      )}

                      {char.appearanceNotes && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 mb-3 font-mono leading-relaxed">
                          <span className="font-sans font-bold text-slate-900 block mb-1">
                            Consistency Attributes:
                          </span>
                          {char.appearanceNotes}
                        </div>
                      )}

                      {char.sceneIds && char.sceneIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <span className="text-[11px] font-semibold text-slate-400">Appears in:</span>
                          {char.sceneIds.map((scId) => {
                            const sc = scenes.find((s) => s.id === scId);
                            return (
                              <span
                                key={scId}
                                className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold"
                              >
                                {sc ? `Scene ${sc.order}` : 'Scene'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        {charPrompts.length} prompt modifiers
                      </span>
                      <button
                        onClick={() => {
                          setActiveCharIdForPrompt(char.id);
                          setCharPromptModalOpen(true);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Consistency Prompt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Scene Confirmation */}
      {sceneToDelete && (
        <ConfirmModal
          isOpen={!!sceneToDelete}
          title="Delete Scene"
          message={`Are you sure you want to delete "${sceneToDelete.title}"? This will not delete prompts or media files from other scenes.`}
          confirmText="Delete Scene"
          confirmVariant="danger"
          onConfirm={async () => {
            await onDeleteScene(sceneToDelete.id);
            showToast(`Deleted ${sceneToDelete.title}`);
            setSceneToDelete(null);
          }}
          onClose={() => setSceneToDelete(null)}
        />
      )}

      {/* Delete Character Confirmation */}
      {characterToDelete && (
        <ConfirmModal
          isOpen={!!characterToDelete}
          title="Delete Character"
          message={`Are you sure you want to delete "${characterToDelete.name}"?`}
          confirmText="Delete Character"
          confirmVariant="danger"
          onConfirm={async () => {
            await onDeleteCharacter(characterToDelete.id);
            showToast(`Deleted ${characterToDelete.name}`);
            setCharacterToDelete(null);
          }}
          onClose={() => setCharacterToDelete(null)}
        />
      )}

      {/* Character Add / Edit Modal */}
      {characterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingCharacter ? 'Edit Character' : 'Add Character'}
                  </h2>
                  <p className="text-xs text-slate-500">Maintain facial and wardrobe consistency</p>
                </div>
              </div>
              <button
                onClick={() => setCharacterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200/60 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCharacter} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Character Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  placeholder="e.g., Professor Evelyn Vance"
                  required
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role / Description
                </label>
                <textarea
                  value={charDesc}
                  onChange={(e) => setCharDesc(e.target.value)}
                  placeholder="Lead archaeologist, intellectual, adventurous..."
                  rows={2}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Appearance & Consistency Modifiers
                </label>
                <textarea
                  value={charAppearance}
                  onChange={(e) => setCharAppearance(e.target.value)}
                  placeholder="e.g. 38-year-old woman, amber eyes, short brown wavy bob hair, wearing leather aviator jacket and round bronze spectacles."
                  rows={3}
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Link to Scenes */}
              {scenes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Appears in Scenes:
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {sortedScenes.map((s) => {
                      const isSelected = selectedSceneIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedSceneIds((prev) =>
                              isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                            );
                          }}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          Scene {s.order}: {s.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCharacterModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
                >
                  Save Character
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Character Prompt Modal */}
      {charPromptModalOpen && (
        <PromptModal
          isOpen={charPromptModalOpen}
          onClose={() => {
            setCharPromptModalOpen(false);
            setActiveCharIdForPrompt('');
          }}
          onSubmit={async (data) => {
            await onCreatePrompt(data);
            showToast('Character prompt saved');
          }}
          defaultCategory="character"
          defaultCharacterId={activeCharIdForPrompt}
          characters={characters}
        />
      )}
    </div>
  );
};
