'use client';

import { useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase, POST_CATEGORIES, type PostCategory } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Image as ImageIcon, Upload, X, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { ImageUpload } from '@/components/image-upload';
import { AudioUpload } from '@/components/audio-upload';
import { RichTextEditor } from '@/components/rich-text-editor';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addMinutes, isBefore, isAfter, formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function AdminCreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [audioFileUrl, setAudioFileUrl] = useState('');
  const [category, setCategory] = useState<PostCategory>('AI News');
  const [keywords, setKeywords] = useState('');
  const [publishType, setPublishType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleImageInsert = (imageUrl: string) => {
    const imageHtml = `<img src="${imageUrl}" alt="Uploaded image" />`;
    setContent(content + imageHtml);
  };

  const handleCoverImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingCover(true);
    setCoverImageFile(file);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `blog-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: 'Error',
        description: 'Failed to upload cover image',
        variant: 'destructive',
      });
      setUploadingCover(false);
      return;
    }

    const { data } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    setCoverImage(data.publicUrl);
    setUploadingCover(false);

    toast({
      title: 'Success',
      description: 'Cover image uploaded successfully',
    });
  };

  const handleRemoveCoverImage = () => {
    setCoverImage('');
    setCoverImageFile(null);
  };

  const handleRemoveAudio = () => {
    setAudioFileUrl('');
  };

  const getScheduledDateTime = (): Date | null => {
    if (!scheduledDate) return null;

    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const dateTime = new Date(scheduledDate);
    dateTime.setHours(hours, minutes, 0, 0);

    return dateTime;
  };

  const validateScheduledTime = (): boolean => {
    if (publishType !== 'scheduled') return true;

    const scheduledDateTime = getScheduledDateTime();
    if (!scheduledDateTime) {
      toast({
        title: 'Error',
        description: 'Please select a date and time for scheduling',
        variant: 'destructive',
      });
      return false;
    }

    const minDateTime = addMinutes(new Date(), 5);
    if (isBefore(scheduledDateTime, minDateTime)) {
      toast({
        title: 'Error',
        description: 'Scheduled time must be at least 5 minutes in the future',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!validateScheduledTime()) {
      setLoading(false);
      return;
    }

    const slug = generateSlug(title) + '-' + Date.now();
    const scheduledDateTime = publishType === 'scheduled' ? getScheduledDateTime() : null;

    const postData: any = {
      author_id: user.id,
      title,
      slug,
      content,
      cover_image: coverImage || null,
      audio_file_url: audioFileUrl || null,
      category,
      keywords: keywords.trim() || null,
      is_published: publishType === 'immediate',
      scheduling_status: publishType === 'immediate' ? 'published' : 'scheduled',
      scheduled_publish_at: scheduledDateTime?.toISOString() || null,
    };

    const { error } = await supabase.from('posts').insert([postData]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const successMessage = publishType === 'immediate'
      ? 'Post published successfully'
      : `Post scheduled for ${scheduledDateTime && format(scheduledDateTime, 'PPp')}`;

    toast({
      title: 'Success',
      description: successMessage,
    });

    router.push('/admin');
    router.refresh();
  };

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/admin">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter your post title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Cover Image (optional)</Label>
                <div className="space-y-3">
                  {coverImage ? (
                    <div className="relative">
                      <img
                        src={coverImage}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveCoverImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleCoverImageFileChange}
                          disabled={uploadingCover}
                          className="flex-1"
                          id="coverImageFile"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('coverImageFile')?.click()}
                          disabled={uploadingCover}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingCover ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">Or use URL</span>
                        </div>
                      </div>
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as PostCategory)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label htmlFor="keywords" className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  SEO Keywords
                </Label>
                <p className="text-sm text-blue-700">
                  Enter keywords separated by commas to improve search engine ranking
                </p>
                <Input
                  id="keywords"
                  type="text"
                  placeholder="AI, machine learning, technology"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {keywords && (
                  <div className="text-xs text-blue-600 mt-2">
                    {keywords.split(',').filter(k => k.trim()).length} keywords added
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <p className="text-sm text-gray-500">
                  Use the toolbar below to format your text, add images, and more.
                </p>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write your story..."
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Upload Images for Article
                </Label>
                <ImageUpload onImageInsert={handleImageInsert} />
              </div>

              <AudioUpload
                audioUrl={audioFileUrl}
                onAudioChange={setAudioFileUrl}
                onAudioRemove={handleRemoveAudio}
              />

              <Card className="border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Publishing Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={publishType} onValueChange={(value: any) => setPublishType(value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                      <RadioGroupItem value="immediate" id="immediate" />
                      <Label htmlFor="immediate" className="flex-1 cursor-pointer">
                        <div className="font-medium">Publish Immediately</div>
                        <div className="text-sm text-slate-500">Make this post live right away</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                      <RadioGroupItem value="scheduled" id="scheduled" />
                      <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                        <div className="font-medium">Schedule for Later</div>
                        <div className="text-sm text-slate-500">Choose a specific date and time to publish</div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {publishType === 'scheduled' && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200 animate-in fade-in-50 duration-300">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Schedule Date & Time</Label>
                        <p className="text-xs text-slate-600">
                          Post will be automatically published at the scheduled time (timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone})
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date" className="text-sm">Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="date"
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !scheduledDate && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={scheduledDate}
                                onSelect={setScheduledDate}
                                disabled={(date) => isBefore(date, new Date()) || isAfter(date, addMinutes(new Date(), 365 * 24 * 60))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="time" className="text-sm">Time</Label>
                          <Select value={scheduledTime} onValueChange={setScheduledTime}>
                            <SelectTrigger id="time">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {scheduledDate && (
                        <div className="p-3 bg-white rounded border border-blue-300">
                          <div className="text-sm font-medium text-blue-900 mb-1">Scheduled Publish Time</div>
                          <div className="text-lg font-semibold text-blue-700">
                            {format(getScheduledDateTime() || new Date(), 'PPpp')}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            {getScheduledDateTime() && formatDistanceToNow(getScheduledDateTime()!, { addSuffix: true })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : publishType === 'immediate' ? 'Publish Now' : 'Schedule Post'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
