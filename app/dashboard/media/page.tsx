"use client";
import DashboardContent from '@/components/DashboardContent';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MediaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string>('');

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const { data, error } = await supabase.storage
      .from('media')
      .upload(`public/${file.name}`, file);
    if (error) {
      console.error('Upload error', error);
    } else {
        const { data: publicData } = supabase.storage.from('media').getPublicUrl(data.path);
        const publicUrl = publicData.publicUrl;
        setUrl(publicUrl);
    }
    setUploading(false);
  };

  return (
    <DashboardContent title="Media Upload">
      <div className="flex flex-col gap-4">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="file:rounded-md file:border-0 file:bg-[#222] file:text-[#eee]"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-[#4f46e5] rounded hover:bg-[#4338ca] transition"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        {url && (
          <div className="mt-4">
            <p className="text-sm text-[#aaa]">Uploaded URL:</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#4f46e5] underline">
              {url}
            </a>
          </div>
        )}
      </div>
    </DashboardContent>
  );
}
