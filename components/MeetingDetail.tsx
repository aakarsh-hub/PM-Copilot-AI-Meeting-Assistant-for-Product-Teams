import React, { useState } from 'react';
import { Meeting, ArtifactType, PRD, Roadmap, ChatMessage } from '../types';
import { 
  ArrowLeft, FileText, CheckSquare, Map, Mail, MessageSquare, 
  Sparkles, Download, Send, User, Bot, Layout, List
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generatePRD, generateRoadmap, generateEmail, askMeetingQuestion } from '../services/geminiService';

interface MeetingDetailProps {
  meeting: Meeting;
  onBack: () => void;
  onUpdateMeeting: (updatedMeeting: Meeting) => void;
}

const MeetingDetail: React.FC<MeetingDetailProps> = ({ meeting, onBack, onUpdateMeeting }) => {
  const [activeTab, setActiveTab] = useState<ArtifactType>(ArtifactType.SUMMARY);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  // Email State
  const [emailTone, setEmailTone] = useState<'Executive' | 'Team' | 'Investor'>('Executive');
  const [generatedEmail, setGeneratedEmail] = useState<string>("");

  const handleGeneratePRD = async () => {
    setIsGenerating(true);
    try {
      const prd = await generatePRD(JSON.stringify(meeting.summary) + "\n\nTranscript excerpt: " + meeting.transcript.substring(0, 5000));
      onUpdateMeeting({ ...meeting, prd });
    } catch (e) {
      alert("Failed to generate PRD");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    try {
      const roadmap = await generateRoadmap(JSON.stringify(meeting.summary) + "\n\nDecisions: " + JSON.stringify(meeting.decisions));
      onUpdateMeeting({ ...meeting, roadmap });
    } catch (e) {
      alert("Failed to generate Roadmap");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateEmail = async () => {
    setIsGenerating(true);
    try {
      const email = await generateEmail(JSON.stringify(meeting.summary) + "\nActions: " + JSON.stringify(meeting.actionItems), emailTone);
      setGeneratedEmail(email);
    } catch (e) {
      alert("Failed to generate Email");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: chatInput,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatting(true);

    try {
      // Prepare history for API
      const apiHistory = chatHistory.map(m => ({ role: m.role, content: m.content }));
      const context = `Summary: ${JSON.stringify(meeting.summary)}\nDecisions: ${JSON.stringify(meeting.decisions)}\nFull Content: ${meeting.transcript}`;
      
      const responseText = await askMeetingQuestion(apiHistory, context, userMsg.content);

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  const TabButton = ({ id, icon: Icon, label }: { id: ArtifactType, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        activeTab === id 
          ? 'border-indigo-600 text-indigo-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
            <p className="text-sm text-gray-500">
              {new Date(meeting.date).toLocaleDateString()} • {meeting.participants.length} Participants
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            {/* Contextual Action Button based on Tab could go here */}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 border-b border-gray-100 overflow-x-auto">
        <TabButton id={ArtifactType.SUMMARY} icon={Layout} label="Summary" />
        <TabButton id={ArtifactType.PRD} icon={FileText} label="PRD & Stories" />
        <TabButton id={ArtifactType.ROADMAP} icon={Map} label="Roadmap" />
        <TabButton id={ArtifactType.EMAIL} icon={Mail} label="Comms" />
        <TabButton id={ArtifactType.CHAT} icon={MessageSquare} label="Ask AI" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        
        {/* SUMMARY TAB */}
        {activeTab === ArtifactType.SUMMARY && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Overview Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Executive Overview</h3>
              <p className="text-gray-600 leading-relaxed">{meeting.summary?.overview}</p>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Agenda Discussed</h4>
                  <ul className="space-y-2">
                    {meeting.summary?.agenda.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Risks</h4>
                   <ul className="space-y-2">
                    {meeting.summary?.risks.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Decisions & Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Decisions */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Key Decisions</h3>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                    {meeting.decisions.length} captured
                  </span>
                </div>
                <div className="space-y-4">
                  {meeting.decisions.map((d) => (
                    <div key={d.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex justify-between mb-1">
                        <p className="font-medium text-gray-800 text-sm">{d.description}</p>
                        <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          {d.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{d.rationale}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                        <User size={12} /> {d.owner}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Action Items</h3>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                    {meeting.actionItems.length} tasks
                  </span>
                </div>
                <div className="space-y-3">
                  {meeting.actionItems.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                        ${a.status === 'Done' ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}
                      `}>
                         {a.status === 'Done' && <CheckSquare size={10} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm text-gray-800 ${a.status === 'Done' ? 'line-through text-gray-400' : ''}`}>
                          {a.task}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><User size={10} /> {a.owner}</span>
                          <span className={`px-1.5 rounded ${
                            a.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-gray-100'
                          }`}>{a.priority}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRD TAB */}
        {activeTab === ArtifactType.PRD && (
          <div className="max-w-4xl mx-auto">
             {!meeting.prd ? (
               <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                 <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                 <h3 className="text-lg font-medium text-gray-900 mb-2">No PRD Generated Yet</h3>
                 <p className="text-gray-500 mb-6 max-w-md mx-auto">
                   Use the AI to synthesize a formal Product Requirement Document from the discussion.
                 </p>
                 <button 
                  onClick={handleGeneratePRD}
                  disabled={isGenerating}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                   {isGenerating ? <Sparkles className="animate-spin" size={18} /> : <Sparkles size={18} />}
                   Generate PRD
                 </button>
               </div>
             ) : (
               <div className="space-y-6">
                 <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="border-b border-gray-100 pb-4 mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Product Requirements Document</h2>
                      <p className="text-gray-500 mt-1">Generated based on {meeting.title}</p>
                    </div>

                    <div className="space-y-8">
                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                           <span className="w-1 h-6 bg-indigo-500 rounded-full"/> Problem Statement
                        </h3>
                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{meeting.prd.problemStatement}</p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="w-1 h-6 bg-purple-500 rounded-full"/> Target Personas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {meeting.prd.personas.map((p,i) => (
                            <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100">
                              {p}
                            </span>
                          ))}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="w-1 h-6 bg-blue-500 rounded-full"/> User Stories
                        </h3>
                        <div className="grid gap-4">
                          {meeting.prd.userStories.map((story, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                              <p className="text-gray-800 font-medium mb-2">
                                As a <span className="text-blue-600">{story.role}</span>, 
                                I want to <span className="text-blue-600">{story.capability}</span>, 
                                so that <span className="text-blue-600">{story.outcome}</span>.
                              </p>
                              <div className="bg-gray-50 p-3 rounded text-sm">
                                <span className="font-semibold text-gray-500 text-xs uppercase block mb-1">Acceptance Criteria</span>
                                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                  {story.acceptanceCriteria.map((ac, j) => <li key={j}>{ac}</li>)}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* ROADMAP TAB */}
        {activeTab === ArtifactType.ROADMAP && (
           <div className="max-w-4xl mx-auto">
            {!meeting.roadmap ? (
               <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                 <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                 <h3 className="text-lg font-medium text-gray-900 mb-2">No Roadmap Proposal</h3>
                 <p className="text-gray-500 mb-6 max-w-md mx-auto">
                   Cluster the discussed ideas into Epics and mapped to a Now/Next/Later timeline.
                 </p>
                 <button 
                  onClick={handleGenerateRoadmap}
                  disabled={isGenerating}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                   {isGenerating ? <Sparkles className="animate-spin" size={18} /> : <Sparkles size={18} />}
                   Generate Proposal
                 </button>
               </div>
             ) : (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{meeting.roadmap.strategicTheme}</h2>
                    <p className="text-gray-500 text-sm">Proposed Roadmap Theme</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Now', 'Next', 'Later'].map((phase) => (
                      <div key={phase} className="bg-gray-100/50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
                          {phase}
                        </h3>
                        <div className="space-y-3">
                          {meeting.roadmap?.epics
                            .filter(e => e.phase === phase)
                            .map((epic, i) => (
                              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                <h4 className="font-semibold text-gray-800 mb-1">{epic.title}</h4>
                                <p className="text-xs text-gray-500 mb-3">{epic.description}</p>
                                {epic.dependencies.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {epic.dependencies.map((dep, idx) => (
                                      <span key={idx} className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100">
                                        Dep: {dep}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             )}
           </div>
        )}

        {/* COMMS/EMAIL TAB */}
        {activeTab === ArtifactType.EMAIL && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Stakeholder Updates</h3>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  {(['Executive', 'Team', 'Investor'] as const).map(tone => (
                    <button
                      key={tone}
                      onClick={() => setEmailTone(tone)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        emailTone === tone ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tone} Mode
                    </button>
                  ))}
                </div>
              </div>

              {!generatedEmail ? (
                 <button 
                  onClick={handleGenerateEmail}
                  disabled={isGenerating}
                  className="w-full py-12 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center justify-center text-gray-400 gap-3"
                >
                   {isGenerating ? <Sparkles className="animate-spin text-indigo-500" size={24} /> : <Mail size={24} />}
                   <span className="font-medium">Generate {emailTone} Update Email</span>
                </button>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                     {generatedEmail}
                   </div>
                   <div className="flex justify-end gap-3 mt-4">
                     <button 
                       onClick={() => setGeneratedEmail("")} 
                       className="text-gray-500 text-sm hover:text-gray-700 px-3 py-1.5"
                     >
                       Discard
                     </button>
                     <button 
                      className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-black"
                      onClick={() => navigator.clipboard.writeText(generatedEmail)}
                     >
                       <Download size={14} /> Copy to Clipboard
                     </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === ArtifactType.CHAT && (
          <div className="max-w-3xl mx-auto h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <Bot size={48} className="mb-4 text-indigo-100" />
                    <p className="font-medium text-gray-600 mb-1">Ask questions about this meeting</p>
                    <p className="text-sm">"What was the decision on pricing?"</p>
                    <p className="text-sm">"Who is responsible for the API?"</p>
                  </div>
                )}
                {chatHistory.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3 text-sm rounded-bl-none flex items-center gap-2 text-gray-500">
                      <Loader2Icon /> Thinking...
                    </div>
                  </div>
                )}
             </div>
             <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-100 flex gap-2">
               <input
                 type="text"
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 placeholder="Ask anything about the transcript or decisions..."
                 className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
               />
               <button 
                 type="submit" 
                 disabled={isChatting || !chatInput.trim()}
                 className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
               >
                 <Send size={20} />
               </button>
             </form>
          </div>
        )}
      </div>
    </div>
  );
};

const Loader2Icon = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

export default MeetingDetail;