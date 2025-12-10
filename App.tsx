import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, Search, Bell } from 'lucide-react';
import MeetingList from './components/MeetingList';
import MeetingDetail from './components/MeetingDetail';
import UploadModal from './components/UploadModal';
import { Meeting } from './types';

const App = () => {
  const [view, setView] = useState<'dashboard' | 'meeting'>('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Persist meetings in local storage to simulate a DB
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem('pm_copilot_meetings');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pm_copilot_meetings', JSON.stringify(meetings));
  }, [meetings]);

  const handleCreateMeeting = (newMeeting: Meeting) => {
    setMeetings(prev => [newMeeting, ...prev]);
    setSelectedMeetingId(newMeeting.id);
    setView('meeting');
  };

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    setMeetings(prev => prev.map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
  };

  const activeMeeting = meetings.find(m => m.id === selectedMeetingId);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">PM Copilot</span>
          </div>

          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 font-medium transition-colors shadow-sm mb-6"
          >
            <Plus size={18} /> New Meeting
          </button>

          <nav className="space-y-1">
            <button 
              onClick={() => { setView('dashboard'); setSelectedMeetingId(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid size={18} /> Dashboard
            </button>
            {/* Future nav items */}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-gray-100">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500"></div>
             <div className="text-sm">
               <p className="font-medium text-gray-900">Demo User</p>
               <p className="text-gray-500 text-xs">Product Lead</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="md:hidden font-bold text-indigo-600">PM Copilot</div>
          <div className="flex-1 max-w-xl mx-auto md:mx-0 pl-4">
             {view === 'dashboard' && (
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                  type="text" 
                  placeholder="Search meetings, decisions, or artifacts..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                />
               </div>
             )}
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* View Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === 'dashboard' ? (
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Recent Sessions</h2>
                <div className="flex gap-2">
                   {/* Filter buttons could go here */}
                </div>
              </div>
              <MeetingList 
                meetings={meetings} 
                onSelectMeeting={(id) => {
                  setSelectedMeetingId(id);
                  setView('meeting');
                }} 
              />
            </div>
          ) : activeMeeting ? (
            <MeetingDetail 
              meeting={activeMeeting} 
              onBack={() => {
                setView('dashboard');
                setSelectedMeetingId(null);
              }}
              onUpdateMeeting={handleUpdateMeeting}
            />
          ) : (
            <div className="flex items-center justify-center h-full">Loading...</div>
          )}
        </div>
      </main>

      {/* Modals */}
      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)} 
          onMeetingCreated={handleCreateMeeting}
        />
      )}
    </div>
  );
};

export default App;