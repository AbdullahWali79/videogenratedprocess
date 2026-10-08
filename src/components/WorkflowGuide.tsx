import React from 'react';
import { 
  BookOpen, 
  Users, 
  Image as ImageIcon, 
  Mic, 
  Film, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';

const STEPS = [
  {
    step: '1',
    title: 'Story',
    subtitle: 'Concept & Script',
    icon: BookOpen,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-200',
    desc: 'Paste your full story, development prompts & notes.',
  },
  {
    step: '2',
    title: 'Scenes & Characters',
    subtitle: 'Breakdown & Cast',
    icon: Users,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    border: 'border-indigo-200',
    desc: 'Define scene scripts, orders, durations & character guides.',
  },
  {
    step: '3',
    title: 'Image Prompts & Images',
    subtitle: 'Visual Assets',
    icon: ImageIcon,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-200',
    desc: 'Save image generation prompts and upload primary scene frames.',
  },
  {
    step: '4',
    title: 'Voice & Music',
    subtitle: 'Audio Track',
    icon: Mic,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    desc: 'Store voiceover text, audio recordings, and background score.',
  },
  {
    step: '5',
    title: 'Video Prompts & Clips',
    subtitle: 'Scene Animation',
    icon: Film,
    color: 'text-pink-600',
    bg: 'bg-pink-100',
    border: 'border-pink-200',
    desc: 'Attach video motion prompts and upload rendered scene clips.',
  },
  {
    step: '6',
    title: 'Final Video',
    subtitle: 'Review & Deliver',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
    desc: 'Assemble timeline, upload final video render & check off review items.',
  },
];

export const WorkflowGuide: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-900/50 relative overflow-hidden">
      {/* Background glow ornaments */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main explanation headline */}
      <div className="relative z-10 max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md mb-3 border border-white/10">
          <Sparkles className="w-3.5 h-3.5" />
          The Manual Video Creation Pipeline
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
          Keep every video's manual process organized in one private project.
        </h2>
        <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed font-normal">
          Create your content using your preferred external tools. Paste prompts and upload results here. Track progress, preview files, and always remember your next task.
        </p>
      </div>

      {/* 6-step interactive workflow map */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.step}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 transition transform hover:-translate-y-0.5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-6 h-6 rounded-lg bg-white/15 text-white text-xs font-extrabold flex items-center justify-center">
                    {step.step}
                  </span>
                  <div className={`w-8 h-8 rounded-xl ${step.bg} flex items-center justify-center ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-bold text-sm text-white group-hover:text-orange-300 transition-colors">
                  {step.title}
                </h3>
                <p className="text-[11px] text-purple-200/70 font-medium mb-2">
                  {step.subtitle}
                </p>
                <p className="text-xs text-slate-300 leading-normal">
                  {step.desc}
                </p>
              </div>

              {idx < STEPS.length - 1 && (
                <div className="hidden lg:flex justify-end pt-2 text-white/30">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
