import React, { useState, useRef } from 'react';
import { Upload, FileAudio, FileText, X, Loader2 } from 'lucide-react';
import { processMeetingInput } from '../services/geminiService';
import { Meeting, MeetingStatus } from '../types';

interface UploadModalProps {
  onClose: () => void;
  onMeetingCreated: (meeting: Meeting) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onMeetingCreated }) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'text'>('audio');
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Basic validation
      if (selectedFile.size > 20 * 1024 * 1024) { // 20MB limit for demo
        setError("File is too large. Please use a file under 20MB for this demo.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let result: Partial<Meeting>;

      if (activeTab === 'audio' && file) {
        // Convert file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        await new Promise((resolve) => {
            reader.onload = async () => {
                const base64String = (reader.result as string).split(',')[1];
                result = await processMeetingInput(base64String, 'audio', file.type);
                resolve(true);
            };
        });
      } else if (activeTab === 'text' && textInput.trim()) {
        result = await processMeetingInput(textInput, 'text');
      } else {
        throw new Error("Please provide input.");
      }

      // @ts-ignore - result is assigned inside the promise for audio
      if (result) {
          const newMeeting: Meeting = {
            ...result as Meeting,
            status: MeetingStatus.COMPLETED,
            transcript: result.transcript || (activeTab === 'text' ? textInput : "Audio processed."),
            decisions: result.decisions || [],
            actionItems: result.actionItems || []
          };
          onMeetingCreated(newMeeting);
          onClose();
      }

    } catch (err: any) {
      console.error(err);
      setError("Failed to process meeting. Ensure API Key is valid and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">New Meeting Session</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'audio' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileAudio size={18} /> Upload Recording
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'text' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={18} /> Paste Notes
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'audio' ? (
            <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="audio/*"
                onChange={handleFileChange}
              />
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Upload size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {file ? file.name : "Click to upload audio"}
              </h3>
              <p className="text-sm text-gray-500 mt-2">MP3, WAV, M4A (Max 20MB)</p>
            </div>
          ) : (
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Paste raw meeting notes, transcript, or brainstorm dump here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            ></textarea>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing || (activeTab === 'audio' && !file) || (activeTab === 'text' && !textInput)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <><Loader2 className="animate-spin" size={16} /> Processing...</> : "Process Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;