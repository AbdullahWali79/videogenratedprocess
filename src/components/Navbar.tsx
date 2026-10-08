import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Video, ShieldCheck, LogOut, User as UserIcon, LogIn, LayoutGrid } from 'lucide-react';
import { FirebaseSetupGuideModal } from './FirebaseSetupGuideModal';

interface NavbarProps {
  onGoHome?: () => void;
  isInsideProject?: boolean;
  projectTitle?: string;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onGoHome,
  isInsideProject,
  projectTitle,
  onOpenAuth,
}) => {
  const { user, logout } = useAuth();
  const [showConfigModal, setShowConfigModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Branding & Back Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={onGoHome}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
              title="Return to Dashboard"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-orange-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition transform">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-purple-800 via-purple-700 to-orange-600 bg-clip-text text-transparent block">
                  Video Workflow Organizer
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:block -mt-1">
                  Manual Production Hub
                </span>
              </div>
            </button>

            {isInsideProject && (
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200">
                <button
                  onClick={onGoHome}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition flex items-center gap-1.5"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Projects
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold text-slate-800 truncate max-w-xs">
                  {projectTitle || 'Workspace'}
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions & User Info */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition flex items-center gap-1.5 border border-purple-200/60"
              title="View Firebase configuration & security rules"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">Firebase Security & Rules</span>
              <span className="sm:hidden">Rules</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-medium text-slate-700 border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="max-w-[130px] truncate" title={user.email || ''}>
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <FirebaseSetupGuideModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </>
  );
};
