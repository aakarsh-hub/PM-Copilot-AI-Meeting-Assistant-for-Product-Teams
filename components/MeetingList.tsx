import React from 'react';
import { Meeting } from '../types';
import { Calendar, Users, FileText, Mic, ArrowRight } from 'lucide-react';

interface MeetingListProps {
  meetings: Meeting[];
  onSelectMeeting: (id: string) => void;
}

const MeetingList: React.FC<MeetingListProps> = ({ meetings, onSelectMeeting }) => {
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No meetings yet</h3>
        <p className="mt-1">Upload an audio recording or paste notes to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meetings.map((meeting) => (
        <div
          key={meeting.id}
          onClick={() => onSelectMeeting(meeting.id)}
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${meeting.type === 'Audio' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
              {meeting.type === 'Audio' ? <Mic size={20} /> : <FileText size={20} />}
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {new Date(meeting.date).toLocaleDateString()}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
            {meeting.title}
          </h3>
          
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
            {meeting.summary?.overview || "No summary available."}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <Users size={14} className="mr-1" />
              {meeting.participants.length} Participants
            </div>
            <div className="flex items-center text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              View <ArrowRight size={16} className="ml-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MeetingList;