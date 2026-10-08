import React, { useState } from 'react';
import { X, Check, Copy, Shield, Database, Cloud, Key, Terminal, ExternalLink } from 'lucide-react';
import { firebaseConfig } from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isValidId(id) { return id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$'); }

    match /users/{userId} {
      allow read, write: if isOwner(userId) && isValidId(userId);

      match /projects/{projectId} {
        allow read, write: if isOwner(userId) && isValidId(userId) && isValidId(projectId);

        match /scenes/{sceneId} {
          allow read, write: if isOwner(userId) && isValidId(userId) && isValidId(projectId) && isValidId(sceneId);
        }
        match /prompts/{promptId} {
          allow read, write: if isOwner(userId) && isValidId(userId) && isValidId(projectId) && isValidId(promptId);
        }
        match /characters/{characterId} {
          allow read, write: if isOwner(userId) && isValidId(userId) && isValidId(projectId) && isValidId(characterId);
        }
        match /assets/{assetId} {
          allow read, write: if isOwner(userId) && isValidId(userId) && isValidId(projectId) && isValidId(assetId);
        }
        match /tasks/{taskId} {
          allow read, write: if isOwner(userId) && isValidId(userId) && isValidId(projectId) && isValidId(taskId);
        }
      }
    }
  }
}`;

  const storageRulesText = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false;
    }
    match /users/{userId}/projects/{projectId}/{allPaths=**} {
      allow read, write, delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Firebase Configuration & Security Rules</h2>
              <p className="text-xs text-slate-500">Live configuration, deployment steps, and security guidelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Active Config */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-purple-600" /> Current Connected Firebase Project
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                Live Provisioned
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-slate-600">
              <div><strong className="text-slate-900 font-sans">Project ID:</strong> {firebaseConfig.projectId}</div>
              <div><strong className="text-slate-900 font-sans">Database ID:</strong> {firebaseConfig.firestoreDatabaseId}</div>
              <div><strong className="text-slate-900 font-sans">Storage Bucket:</strong> {firebaseConfig.storageBucket}</div>
              <div><strong className="text-slate-900 font-sans">Auth Domain:</strong> {firebaseConfig.authDomain}</div>
            </div>
          </div>

          {/* Checklist for user in Firebase Console */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-orange-500" />
              Required Firebase Console Settings
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <strong className="text-slate-900">Enable Authentication Providers:</strong>
                  <p className="mt-0.5">In Firebase Console &gt; <em>Authentication &gt; Sign-in method</em>: Enable <strong>Email/Password</strong> and <strong>Google</strong> sign-in providers.</p>
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <strong className="text-slate-900">Firebase Storage Bucket Activation:</strong>
                  <p className="mt-0.5">Ensure Firebase Storage is created in your project region (matches bucket: <code className="bg-slate-100 px-1 py-0.5 rounded">{firebaseConfig.storageBucket}</code>). Deploy the Storage security rules below.</p>
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <strong className="text-slate-900">Firestore Indexes:</strong>
                  <p className="mt-0.5">The app utilizes single-field auto indexes on subcollections ordered by <code className="bg-slate-100 px-1 py-0.5 rounded">order</code> or <code className="bg-slate-100 px-1 py-0.5 rounded">createdAt</code>. No composite index manual creation is needed.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Firestore Security Rules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                Firestore Security Rules (<code className="text-xs">firestore.rules</code>)
              </h3>
              <button
                onClick={() => copyToClipboard(firestoreRulesText, 'firestore')}
                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium"
              >
                {copiedSection === 'firestore' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'firestore' ? 'Copied!' : 'Copy Rules'}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs font-mono overflow-x-auto max-h-48 leading-relaxed">
              {firestoreRulesText}
            </pre>
            <p className="text-xs text-slate-500">Enforces strict user isolation: only the authenticated owner can access <code className="text-purple-600 font-semibold">/users/&#123;uid&#125;/...</code> documents.</p>
          </div>

          {/* Storage Security Rules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-500" />
                Firebase Storage Security Rules (<code className="text-xs">storage.rules</code>)
              </h3>
              <button
                onClick={() => copyToClipboard(storageRulesText, 'storage')}
                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium"
              >
                {copiedSection === 'storage' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'storage' ? 'Copied!' : 'Copy Rules'}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs font-mono overflow-x-auto max-h-36 leading-relaxed">
              {storageRulesText}
            </pre>
          </div>

          {/* Deployment command */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 space-y-2">
            <span className="font-semibold text-purple-900 flex items-center gap-2 text-xs">
              <Terminal className="w-4 h-4 text-purple-700" /> Command Line Deployment
            </span>
            <p className="text-xs text-purple-800">
              To deploy rules and hosting using the Firebase CLI in production:
            </p>
            <div className="bg-slate-950 text-emerald-400 p-2.5 rounded-lg font-mono text-xs select-all">
              firebase deploy --only firestore:rules,storage
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
