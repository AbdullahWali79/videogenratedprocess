import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, FileCheck, Film, Image as ImageIcon, Music, Loader2 } from 'lucide-react';
import { Asset } from '../types';
import { uploadAssetFile } from '../services/db';
import { useToast } from './Toast';

interface MediaUploaderProps {
  userId: string;
  projectId: string;
  category: Asset['category'];
  acceptedTypes?: 'image' | 'audio' | 'video' | 'any';
  sceneId?: string;
  promptId?: string;
  buttonLabel?: string;
  onUploaded?: (asset: Asset) => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  userId,
  projectId,
  category,
  acceptedTypes = 'image',
  sceneId,
  promptId,
  buttonLabel = 'Upload File',
  onUploaded,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Maximum file size limits
  const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB
  const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 150MB

  const acceptMime =
    acceptedTypes === 'image'
      ? 'image/png,image/jpeg,image/webp,image/gif'
      : acceptedTypes === 'audio'
      ? 'audio/mpeg,audio/wav,audio/aac,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.m4a'
      : acceptedTypes === 'video'
      ? 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov'
      : 'image/*,audio/*,video/*';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setCurrentFileName(file.name);

    // Validate size
    if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
      setError(`Image exceeds maximum allowed size of 30MB (Selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }
    if (file.type.startsWith('audio/') && file.size > MAX_AUDIO_SIZE) {
      setError(`Audio file exceeds maximum allowed size of 50MB (Selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }
    if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE) {
      setError(`Video file exceeds maximum allowed size of 150MB (Selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);

      const asset = await uploadAssetFile(
        userId,
        projectId,
        file,
        category,
        (pct) => setProgress(pct),
        sceneId,
        promptId
      );

      showToast(`Uploaded "${file.name}" successfully!`, 'success');
      if (onUploaded) onUploaded(asset);
      setProgress(0);
      setCurrentFileName('');
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'File upload failed. Please try again.');
      showToast('File upload failed', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptMime}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!isUploading ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/70 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <Upload className="w-3.5 h-3.5 text-purple-600" />
          <span>{buttonLabel}</span>
        </button>
      ) : (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 max-w-sm space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-900">
            <span className="truncate max-w-[200px]" title={currentFileName}>
              {currentFileName}
            </span>
            <span>{progress}%</span>
          </div>

          <div className="w-full bg-purple-200/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[10px] text-purple-600 flex items-center gap-1 font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            Uploading to private Firebase Storage...
          </p>
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{error}</span>
            <button
              onClick={() => {
                setError(null);
                fileInputRef.current?.click();
              }}
              className="block mt-1 font-bold text-rose-900 underline hover:no-underline"
            >
              Retry upload
            </button>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
