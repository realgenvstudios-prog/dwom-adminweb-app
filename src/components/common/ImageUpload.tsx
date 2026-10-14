import React, { useRef, useState } from 'react';
import { ImageOff, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import adminApiClient from '../../services/apiClient';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

const ImageUpload: React.FC<Props> = ({ value, onChange, label = 'Image' }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks which URL failed to load, so a new URL gets a fresh chance to render.
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showPreview = value && brokenUrl !== value;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file (JPG, PNG, WebP…).');
      e.target.value = '';
      return;
    }
    try {
      setUploading(true);
      setError(null);
      const result = await adminApiClient.uploadFile<{ url: string }>('/cloudinary/upload', file);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {showPreview ? (
            <img src={value} alt="" className="size-full object-cover" onError={() => setBrokenUrl(value)} />
          ) : (
            <ImageOff className="size-5 text-muted-foreground" />
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-1 right-1 rounded-full bg-background/90 p-0.5 shadow-sm hover:bg-background"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <div className="grid flex-1 gap-2">
          <Input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste an image URL, or upload" />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              {uploading ? 'Uploading…' : 'Upload image'}
            </Button>
            {error && <span className="text-xs text-destructive">{error}</span>}
            {value && brokenUrl === value && !error && <span className="text-xs text-destructive">This image couldn’t be loaded.</span>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
