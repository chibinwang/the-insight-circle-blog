'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Music } from 'lucide-react';

interface AudioUploadProps {
  audioUrl?: string;
  onAudioChange: (url: string) => void;
  onAudioRemove: () => void;
}

export function AudioUpload({ audioUrl, onAudioChange, onAudioRemove }: AudioUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Please select an audio file (MP3, WAV, OGG, M4A)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Audio file size must be less than 50MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `blog-audio/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-audio')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: 'Error',
        description: 'Failed to upload audio file',
        variant: 'destructive',
      });
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from('blog-audio')
      .getPublicUrl(filePath);

    onAudioChange(data.publicUrl);
    setUploading(false);

    toast({
      title: 'Success',
      description: 'Audio file uploaded successfully',
    });
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-base">
        <Music className="h-5 w-5" />
        Audio File (optional)
      </Label>
      <p className="text-sm text-gray-500">
        Add an audio file to complement your article. Supported formats: MP3, WAV, OGG, M4A (max 50MB)
      </p>

      {audioUrl ? (
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <audio controls className="w-full" src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onAudioRemove}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Remove Audio File
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/x-m4a"
            onChange={handleAudioFileChange}
            disabled={uploading}
            className="flex-1"
            id="audioFile"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('audioFile')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      )}
    </div>
  );
}
