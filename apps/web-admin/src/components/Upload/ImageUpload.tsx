import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import api from '@/api/client';
import toast from 'react-hot-toast';
import './ImageUpload.css';

interface ImageUploadProps {
  productId: string;
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUpload({ productId, images, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    
    setUploading(true);
    const formData = new FormData();
    acceptedFiles.forEach(file => formData.append('images', file));

    try {
      const res = await api.post(`/products/${productId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.data.urls);
      toast.success('Images uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  }, [productId, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
  });

  const removeImage = (url: string) => {
    const newImages = images.filter(i => i !== url);
    onChange(newImages);
    api.patch(`/products/${productId}`, { images: newImages });
  };

  return (
    <div className="image-upload-wrapper">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}>
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 size={24} className="spin text-muted" />
        ) : (
          <>
            <ImagePlus size={24} className="text-muted" />
            <p className="text-sm text-muted">Drag & drop or click to upload</p>
          </>
        )}
      </div>

      {images.length > 0 && (
        <div className="image-grid">
          {images.map(url => (
            <div key={url} className="image-preview">
              <img src={url} alt="Product" />
              <button className="remove-btn" onClick={() => removeImage(url)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
