import { Project, Scene, Prompt, Character, Asset, ChecklistItem } from '../types';

export function exportProjectJSON(
  project: Project,
  scenes: Scene[],
  prompts: Prompt[],
  characters: Character[],
  assets: Asset[],
  tasks: ChecklistItem[]
) {
  const exportData = {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    notice: 'This is a metadata and prompt export. Uploaded media files are stored privately in Firebase Storage and are not bundled in this JSON.',
    project,
    scenes,
    prompts,
    characters,
    assets: assets.map(a => ({
      id: a.id,
      name: a.name,
      fileName: a.fileName,
      fileType: a.fileType,
      size: a.size,
      category: a.category,
      sceneId: a.sceneId,
      promptId: a.promptId,
      notes: a.notes,
      createdAt: a.createdAt
    })),
    tasks
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(project.title)}_workflow_export.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportProjectMarkdown(
  project: Project,
  scenes: Scene[],
  prompts: Prompt[],
  characters: Character[]
) {
  let md = `# Video Workflow: ${project.title}\n\n`;
  md += `**Status:** ${project.status.toUpperCase()}  \n`;
  md += `**Aspect Ratio:** ${project.aspectRatio || '16:9'} | **Language:** ${project.language || 'English'} | **Style:** ${project.visualStyle || 'N/A'}  \n`;
  md += `**Target Duration:** ${project.targetDuration || 'N/A'}  \n`;
  if (project.description) {
    md += `\n**Description:**  \n${project.description}\n\n`;
  }
  if (project.notes) {
    md += `\n**Project Notes:**  \n${project.notes}\n\n`;
  }

  md += `---\n\n## 1. Story\n\n`;
  md += `**Story Approval:** ${project.storyApproved ? 'Approved ✅' : 'Pending ⏳'}\n\n`;
  md += `${project.storyText || '*(No story text entered yet)*'}\n\n`;
  if (project.storyNotes) {
    md += `**Story Notes:**\n${project.storyNotes}\n\n`;
  }

  // Story Prompts
  const storyPrompts = prompts.filter(p => p.category === 'story' && !p.sceneId);
  if (storyPrompts.length > 0) {
    md += `### Story Development Prompts\n\n`;
    storyPrompts.forEach(p => {
      md += `#### ${p.title} (${p.externalTool || 'Tool unspecified'})\n`;
      md += `\`\`\`text\n${p.fullText}\n\`\`\`\n`;
      if (p.notes) md += `*Notes: ${p.notes}*\n\n`;
    });
  }

  // Characters
  if (characters.length > 0) {
    md += `---\n\n## 2. Characters\n\n`;
    characters.forEach(c => {
      md += `### ${c.name}\n`;
      if (c.description) md += `**Bio/Role:** ${c.description}\n\n`;
      if (c.appearanceNotes) md += `**Appearance & Consistency:**\n${c.appearanceNotes}\n\n`;
      const charPrompts = prompts.filter(p => p.characterId === c.id);
      if (charPrompts.length > 0) {
        md += `**Character Prompts:**\n`;
        charPrompts.forEach(cp => {
          md += `- **${cp.title}**: \`${cp.fullText}\`\n`;
        });
        md += `\n`;
      }
    });
  }

  // Scenes
  md += `---\n\n## 3. Scenes Breakdown\n\n`;
  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);
  if (sortedScenes.length === 0) {
    md += `*(No scenes created yet)*\n\n`;
  } else {
    sortedScenes.forEach((s, idx) => {
      md += `### Scene ${s.order || idx + 1}: ${s.title}\n`;
      md += `**Status:** ${s.status} | **Duration:** ${s.duration || 'N/A'}\n\n`;
      md += `**Scene Action / Script:**  \n${s.sceneText || '*(No text)*'}\n\n`;
      if (s.voiceoverText) {
        md += `**Voiceover:**  \n> ${s.voiceoverText}\n\n`;
      }
      if (s.notes) {
        md += `**Notes:** ${s.notes}\n\n`;
      }

      // Scene Prompts
      const scenePrompts = prompts.filter(p => p.sceneId === s.id);
      if (scenePrompts.length > 0) {
        md += `#### Scene Prompts:\n`;
        scenePrompts.forEach(p => {
          md += `- **[${p.category.toUpperCase()}] ${p.title}** (${p.externalTool || 'Tool: N/A'}):\n  \`\`\`text\n  ${p.fullText}\n  \`\`\`\n`;
        });
        md += `\n`;
      }
      md += `\n`;
    });
  }

  // Project Music & Editing Prompts
  const otherPrompts = prompts.filter(p => ['music', 'editing', 'other'].includes(p.category) && !p.sceneId);
  if (otherPrompts.length > 0) {
    md += `---\n\n## 4. Audio, Music & Editing Prompts\n\n`;
    otherPrompts.forEach(p => {
      md += `### [${p.category.toUpperCase()}] ${p.title} (${p.externalTool || 'General'})\n`;
      md += `\`\`\`text\n${p.fullText}\n\`\`\`\n`;
      if (p.notes) md += `*Notes: ${p.notes}*\n\n`;
    });
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(project.title)}_workflow.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50) || 'video_project';
}
