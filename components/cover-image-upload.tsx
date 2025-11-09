'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Loader2, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CoverImageUploadProps {
  currentImage: string;
  onImageUploaded: (url: string) => void;
}

export function CoverImageUpload({ currentImage, onImageUploaded }: CoverImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const file = files[0];

      if (!file.type.startsWith('image/')) {
        toast({
          title: '錯誤',
          description: '請選擇圖片檔案',
          variant: 'destructive',
        });
        setUploading(false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: '錯誤',
          description: '圖片大小必須小於 5MB',
          variant: 'destructive',
        });
        setUploading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(data.path);

      const imageUrl = urlData.publicUrl;

      toast({
        title: '上傳成功',
        description: '圖片已成功上傳',
      });

      onImageUploaded(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: '上傳失敗',
        description: '無法上傳圖片，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    onImageUploaded('');
    setImageUrl('');
  };

  const handleUrlSubmit = () => {
    const trimmedUrl = imageUrl.trim();

    if (!trimmedUrl) {
      toast({
        title: '錯誤',
        description: '請輸入圖片網址',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = new URL(trimmedUrl);
      if (!url.protocol.startsWith('http')) {
        throw new Error('Invalid protocol');
      }

      onImageUploaded(trimmedUrl);
      toast({
        title: '成功',
        description: '圖片網址已設定',
      });
      setImageUrl('');
    } catch (error) {
      toast({
        title: '錯誤',
        description: '請輸入有效的圖片網址（需包含 http:// 或 https://）',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">上傳檔案</TabsTrigger>
          <TabsTrigger value="url">貼上網址</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="cover-image-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  上傳中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {currentImage ? '更換封面' : '上傳封面'}
                </>
              )}
            </Button>
            <span className="text-sm text-gray-500">
              最大 5MB • JPG, PNG, GIF, WebP
            </span>
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">圖片網址</Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleUrlSubmit}
                disabled={!imageUrl.trim()}
                className="gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                設定
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              貼上圖片的完整網址（需包含 http:// 或 https://）
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {currentImage && (
        <div className="relative group max-w-md">
          <img
            src={currentImage}
            alt="Cover"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
