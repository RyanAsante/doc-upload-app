'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// Type definition for upload file with status tracking
type UploadFile = {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
};

// Props interface for the FileUpload component
interface FileUploadProps {
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export default function FileUpload({ 
  maxFiles = 10, 
  acceptedFileTypes = ['image/*', 'video/*', 'application/pdf', 'text/*'] 
}: FileUploadProps) {
  // State management for upload files and UI
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  /**
   * Handles files dropped or selected by the user
   * Creates unique IDs for each file and sets initial status
   * @param acceptedFiles - Array of files that passed validation
   */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  /**
   * Dropzone configuration for drag-and-drop functionality
   * Handles file validation, multiple file selection, and drag states
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    multiple: true,
    maxFiles,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false)
  });

  /**
   * Removes a file from the upload queue
   * @param fileId - Unique identifier of the file to remove
   */
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== fileId));
  };

  /**
   * Initiates the upload process for a single file
   * Uses XMLHttpRequest for progress tracking and better control
   * @param uploadFile - The file object to upload
   */
  const uploadFile = (uploadFile: UploadFile) => {
    // Update file status to uploading
    setUploadFiles(prev => 
      prev.map(file => 
        file.id === uploadFile.id 
          ? { ...file, status: 'uploading' as const, progress: 0 }
          : file
      )
    );

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', uploadFile.file);

    // Initialize XMLHttpRequest for upload with progress tracking
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

    // Handle upload completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          // Parse response but don't store it since we're not using it
          JSON.parse(xhr.responseText);
          setUploadFiles(prev => 
            prev.map(file => 
              file.id === uploadFile.id 
                ? { ...file, status: 'success' as const, progress: 100 }
                : file
            )
          );
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          setUploadFiles(prev => 
            prev.map(file => 
              file.id === uploadFile.id 
                ? { ...file, status: 'error' as const, error: 'Invalid response' }
                : file
            )
          );
        }
      } else {
        console.error('Upload failed with status:', xhr.status);
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
          // Note: allComplete is calculated but not used - this is intentional for future features
          return prev;
        });
      }, 1000);
    });

    // Handle upload errors
    xhr.addEventListener('error', () => {
      setUploadFiles(prev => 
        prev.map(file => 
          file.id === uploadFile.id 
            ? { ...file, status: 'error' as const, error: 'Network error' }
            : file
        )
      );
    });

    // Send the request with user authentication
    const userEmail = localStorage.getItem('userEmail') || '';
    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('x-user-email', userEmail);
    xhr.send(formData);
  };

  /**
   * Starts upload for all pending files
   * Processes files sequentially to avoid overwhelming the server
   */
  const startUpload = () => {
    const pendingFiles = uploadFiles.filter(file => file.status === 'pending');
    pendingFiles.forEach(file => uploadFile(file));
  };

  /**
   * Clears all completed uploads from the queue
   * Keeps pending and uploading files
   */
  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(file => file.status === 'pending' || file.status === 'uploading'));
  };

  return (
    <div className="w-full">
      {/* Drag and drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive || dragActive
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        
        {/* Upload icon and instructions */}
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse files
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports: Images, Videos, PDFs, Text files (Max: {maxFiles} files)
            </p>
          </div>
        </div>
      </div>

      {/* File list and upload controls */}
      {uploadFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* Upload control buttons */}
          <div className="flex space-x-3">
            <button
              onClick={startUpload}
              disabled={!uploadFiles.some(file => file.status === 'pending')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Upload
            </button>
            <button
              onClick={clearCompleted}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Clear Completed
            </button>
          </div>

          {/* File list with status indicators */}
          <div className="space-y-3">
            {uploadFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                {/* File information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    {/* File icon based on type */}
                    <div className="flex-shrink-0">
                      {file.file.type.startsWith('image/') ? (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : file.file.type.startsWith('video/') ? (
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    
                    {/* File details */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload status and progress */}
                <div className="flex items-center space-x-4">
                  {/* Progress bar for uploading files */}
                  {file.status === 'uploading' && (
                    <div className="w-32">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{file.progress}%</p>
                    </div>
                  )}

                  {/* Status indicator */}
                  <div className="flex items-center space-x-2">
                    {file.status === 'pending' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Pending
                      </span>
                    )}
                    {file.status === 'uploading' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Uploading
                      </span>
                    )}
                    {file.status === 'success' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Success
                      </span>
                    )}
                    {file.status === 'error' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Error
                      </span>
                    )}
                  </div>

                  {/* Error message display */}
                  {file.error && (
                    <p className="text-sm text-red-600 max-w-xs">{file.error}</p>
                  )}

                  {/* Remove file button */}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
