'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function FileUpload() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    // Upload each file
    newFiles.forEach(uploadFile => {
      uploadSingleFile(uploadFile);
    });
  }, []);

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    const formData = new FormData();
    formData.append('document', uploadFile.file);

    try {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadFiles(prev => 
            prev.map(file => 
              file.id === uploadFile.id 
                ? { ...file, progress }
                : file
            )
          );
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        console.log('📡 Upload response:', { status: xhr.status, response: xhr.responseText });
        
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Upload successful:', response);
            setUploadFiles(prev => 
              prev.map(file => 
                file.id === uploadFile.id 
                  ? { ...file, status: 'success' as const, progress: 100 }
                  : file
              )
            );
          } catch (parseError) {
            console.error('❌ Failed to parse response:', parseError);
            setUploadFiles(prev => 
              prev.map(file => 
                file.id === uploadFile.id 
                  ? { ...file, status: 'error' as const, error: 'Invalid response' }
                  : file
              )
            );
          }
        } else {
          console.error('❌ Upload failed with status:', xhr.status, 'Response:', xhr.responseText);
          setUploadFiles(prev => 
            prev.map(file => 
              file.id === uploadFile.id 
                ? { ...file, status: 'error' as const, error: `Upload failed: ${xhr.status}` }
                : file
            )
          );
        }
        
        // Check if all uploads are complete
        setTimeout(() => {
          setUploadFiles(prev => {
            const allComplete = prev.every(file => file.status !== 'uploading');
            if (allComplete) {
              setIsUploading(false);
            }
            return prev;
          });
        }, 1000);
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        setUploadFiles(prev => 
          prev.map(file => 
            file.id === uploadFile.id 
              ? { ...file, status: 'error' as const, error: 'Network error' }
              : file
          )
        );
      });

      // Send the request
      const userEmail = localStorage.getItem('userEmail') || '';
      console.log('📤 Sending upload request:', { 
        file: uploadFile.file.name, 
        size: uploadFile.file.size, 
        type: uploadFile.file.type,
        userEmail 
      });
      
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('x-user-email', userEmail);
      xhr.send(formData);

    } catch (error) {
      setUploadFiles(prev => 
        prev.map(file => 
          file.id === uploadFile.id 
            ? { ...file, status: 'error' as const, error: 'Upload failed' }
            : file
        )
      );
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg', '.mov'],
    },
    multiple: true,
  });

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Drag & Drop Zone */}
      <div {...getRootProps()}>
        <motion.div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input {...getInputProps()} />
        
        <div className="space-y-4">
          <motion.div
            animate={{ rotate: isDragActive ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              stroke="currentColor" 
              fill="none" 
              viewBox="0 0 48 48"
            >
              <path 
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                strokeWidth={2} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </motion.div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to select files
            </p>
          </div>
          
          <p className="text-xs text-gray-400">
            Supports: Images and Videos (max 100MB each)
          </p>
        </div>
        </motion.div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-medium text-gray-900">
              Upload Progress
            </h3>
            
            {uploadFiles.map((uploadFile) => (
              <motion.div
                key={uploadFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {uploadFile.status === 'success' && (
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {uploadFile.status === 'error' && (
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      {uploadFile.status === 'uploading' && (
                        <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadFile.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Status Text */}
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {uploadFile.status === 'uploading' && `${uploadFile.progress}% uploaded`}
                    {uploadFile.status === 'success' && 'Upload complete'}
                    {uploadFile.status === 'error' && uploadFile.error}
                  </span>
                  
                  {uploadFile.status === 'error' && (
                    <button
                      onClick={() => uploadSingleFile(uploadFile)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
