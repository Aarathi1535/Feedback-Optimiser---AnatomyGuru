
import React, { ChangeEvent } from 'react';

interface FileUploadProps {
  id: string;
  label: string;
  description: string;
  accept?: string;
  onChange: (file: File | null) => void;
  fileName: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ id, label, description, accept = "application/pdf", onChange, fileName }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${fileName ? 'border-blue-800 bg-blue-50' : 'border-slate-300 hover:border-blue-800 bg-white'}`}>
        <input
          type="file"
          id={id}
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          {fileName ? (
            <>
              <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-blue-900 truncate max-w-xs">{fileName}</p>
            </>
          ) : (
            <>
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-slate-500">{description}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
