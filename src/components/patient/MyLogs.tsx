import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { ChevronLeft, Smile, Heart, Calendar, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import '../../styles/patient-home-background.css';
import { api } from '../../services/api';

// Emotion to emoji mapping
const emotionEmojis: { [key: string]: string } = {
  'Happy': '😊',
  'Sad': '😢',
  'Angry': '😠',
  'Anxious': '😰',
  'Calm': '😌',
  'Excited': '🤩',
  'Tired': '😴',
  'Stressed': '😫',
};

export function MyLogs() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('mood');
  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
          const data = await api.patient.getMoodHistory(user.id);

          // Process data into mood logs and journal entries
          const moods = data.filter((entry: any) => entry.primary_emotion);
          const journals = data.filter((entry: any) => !entry.primary_emotion && entry.journal_text && entry.journal_text.length > 0);

          setMoodLogs(moods.map((entry: any) => ({
            id: entry.id,
            date: new Date(entry.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }),
            mood: entry.primary_emotion,
            secondary: entry.secondary_emotion,
            tertiary: entry.tertiary_emotion,
            emoji: emotionEmojis[entry.primary_emotion] || '😊',
            score: entry.mood_score,
            note: entry.journal_text
          })));

          setJournalEntries(journals.map((entry: any) => ({
            id: entry.id,
            date: new Date(entry.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }),
            content: entry.journal_text,
            score: entry.mood_score
          })));
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen patient-home-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate('/patient/account')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <FileText className="w-6 h-6 text-[#6328FF]" />
            <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-2xl font-bold text-black">My Logs 📝</h1>
          </div>
          <p className="text-gray-600 ml-12">View all your progress and entries</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#FFF8E7] shadow-sm rounded-2xl p-1 mb-6 border border-[#E8D9B5]">
            <TabsTrigger value="mood" className="rounded-xl data-[state=active]:bg-[#C2D738] data-[state=active]:text-black">
              <Smile className="w-4 h-4 mr-2" />
              Mood Logs
            </TabsTrigger>
            <TabsTrigger value="journal" className="rounded-xl data-[state=active]:bg-[#C2D738] data-[state=active]:text-black">
              <Heart className="w-4 h-4 mr-2" />
              Journal
            </TabsTrigger>
          </TabsList>

          {/* Mood Logs */}
          <TabsContent value="mood" className="space-y-4">
            {loading ? (
              <div className="bg-[#FFF8E7] rounded-3xl p-12 text-center border border-[#E8D9B5]">
                <div className="animate-spin w-8 h-8 border-4 border-[#6328FF] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading mood logs...</p>
              </div>
            ) : moodLogs.length === 0 ? (
              <div className="bg-[#FFF8E7] rounded-3xl p-12 text-center border border-[#E8D9B5]">
                <Smile className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl text-gray-800 mb-2">No Mood Logs Yet</h3>
                <p className="text-gray-500">Start tracking your mood to see your history here.</p>
              </div>
            ) : (
              moodLogs.map((log) => (
                <div key={log.id} className="bg-[#FFF8E7] rounded-3xl p-5 shadow-sm border border-[#E8D9B5] hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#9E98ED] flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
                      {log.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg text-gray-800 font-semibold">Feeling {log.mood}</h3>
                          {log.secondary && (
                            <p className="text-sm text-gray-500">{log.secondary} {log.tertiary ? `→ ${log.tertiary}` : ''}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {log.date}
                          </div>
                          {log.score && (
                            <span className="text-xs bg-[#9E98ED]/20 text-[#6328FF] px-2 py-1 rounded-full">
                              Score: {log.score}/10
                            </span>
                          )}
                        </div>
                      </div>
                      {log.note && <p className="text-sm text-gray-600 mt-2">{log.note}</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Journal Logs */}
          <TabsContent value="journal" className="space-y-4">
            {loading ? (
              <div className="bg-[#FFF8E7] rounded-3xl p-12 text-center border border-[#E8D9B5]">
                <div className="animate-spin w-8 h-8 border-4 border-[#6328FF] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading journal entries...</p>
              </div>
            ) : journalEntries.length === 0 ? (
              <div className="bg-[#FFF8E7] rounded-3xl p-12 text-center border border-[#E8D9B5]">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl text-gray-800 mb-2">No Journal Entries Yet</h3>
                <p className="text-gray-500">Start writing in your Happy Journal to see entries here.</p>
              </div>
            ) : (
              journalEntries.map((entry) => (
                <div key={entry.id} className="bg-[#FFF8E7] rounded-3xl p-5 shadow-sm border border-[#E8D9B5] hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#FE97CF] flex items-center justify-center shadow-lg flex-shrink-0">
                      <Heart className="w-8 h-8 text-black" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg text-gray-800 font-semibold">Journal Entry</h3>
                          {entry.score && (
                            <span className="inline-block bg-[#FE97CF]/20 text-[#FE97CF] text-xs px-2 py-1 rounded-full mt-1">
                              Day Rating: {entry.score}/10
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {entry.date}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{entry.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PatientBottomNav />
    </div>
  );
}
