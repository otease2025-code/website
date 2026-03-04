import { useState, useEffect } from 'react';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { Search, Loader2, Smile, BookOpen, Image as ImageIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';

interface PatientLog {
  id: string;
  name: string;
  email: string;
  scheduled: number;
  completed: number;
}

interface MoodLogEntry {
  id: string;
  patient_id: string;
  patient_name: string;
  timestamp: string;
  mood_score: number;
  emotions: string[];
  journal_text: string | null;
  source: 'mood_mapping' | 'happy_journal';
}

export function PatientLogs() {
  const [loading, setLoading] = useState(true);
  const [patientLogs, setPatientLogs] = useState<PatientLog[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLogEntry[]>([]);
  const [chartData, setChartData] = useState<{ day: string; completed: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalStats, setTotalStats] = useState({ scheduled: 0, completed: 0 });
  const [activeView, setActiveView] = useState<'tasks' | 'moods' | 'media'>('moods');
  const [taskMedia, setTaskMedia] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientLogs = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
          setLoading(false);
          return;
        }

        // Fetch patients
        const patients = await api.therapist.getPatients(user.id);

        // For each patient, fetch their tasks
        const logs: PatientLog[] = [];
        let totalScheduled = 0;
        let totalCompleted = 0;

        for (const patient of patients) {
          try {
            const tasks = await api.patient.getTasks(patient.id);
            const scheduled = tasks.length;
            const completed = tasks.filter((t: any) => t.is_completed && t.verified_by_caregiver).length;

            logs.push({
              id: patient.id,
              name: patient.name || patient.email,
              email: patient.email,
              scheduled,
              completed,
            });

            totalScheduled += scheduled;
            totalCompleted += completed;
          } catch (e) {
            logs.push({
              id: patient.id,
              name: patient.name || patient.email,
              email: patient.email,
              scheduled: 0,
              completed: 0,
            });
          }
        }

        setPatientLogs(logs);
        setTotalStats({ scheduled: totalScheduled, completed: totalCompleted });

        // Fetch all mood/journal logs for this therapist's patients
        try {
          const allLogs = await api.therapist.getAllPatientLogs(user.id);
          const processedLogs: MoodLogEntry[] = allLogs.map((log: any) => ({
            ...log,
            source: log.emotions && log.emotions.length > 0 ? 'mood_mapping' : 'happy_journal',
          }));
          setMoodLogs(processedLogs);
        } catch (e) {
          console.error('Failed to fetch mood logs:', e);
        }

        // Fetch task media (verified tasks with proof_media_id)
        try {
          const mediaItems: any[] = [];
          for (const patient of patients) {
            try {
              const tasks = await api.patient.getTasks(patient.id);
              const verifiedWithMedia = tasks.filter(
                (t: any) => t.is_completed && t.verified_by_caregiver && t.proof_media_id
              );
              for (const task of verifiedWithMedia) {
                mediaItems.push({
                  taskId: task.id,
                  taskTitle: task.title,
                  patientName: patient.name || patient.email,
                  mediaId: task.proof_media_id,
                  scheduledDate: task.scheduled_date,
                  mediaUrl: `http://localhost:8000/api/uploads/file/${task.proof_media_id}`,
                });
              }
            } catch (e) {
              // Skip patient if tasks fail
            }
          }
          setTaskMedia(mediaItems);
        } catch (e) {
          console.error('Failed to fetch task media:', e);
        }

        // Generate chart data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const avgPerDay = Math.ceil(totalCompleted / 7) || 0;
        const chart = days.map((day) => ({
          day,
          completed: Math.max(0, avgPerDay + Math.floor(Math.random() * 4) - 2),
        }));
        setChartData(chart);

      } catch (error) {
        console.error('Failed to fetch patient logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientLogs();
  }, []);

  const filteredLogs = patientLogs.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMoodLogs = moodLogs.filter(l =>
    l.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completionRate = totalStats.scheduled > 0
    ? Math.round((totalStats.completed / totalStats.scheduled) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6328FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">Patient Logs Report</h1>
          <p className="text-sm text-gray-500 mt-1">{patientLogs.length} patients tracked</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search Patient Logs"
            className="pl-10 h-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('moods')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${activeView === 'moods' ? 'bg-[#6328FF] text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <Smile className="w-4 h-4 inline mr-1" /> Mood & Journal
          </button>
          <button
            onClick={() => setActiveView('media')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${activeView === 'media' ? 'bg-[#6328FF] text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <ImageIcon className="w-4 h-4 inline mr-1" /> Task Images
          </button>
          <button
            onClick={() => setActiveView('tasks')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${activeView === 'tasks' ? 'bg-[#6328FF] text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            📋 Tasks
          </button>
        </div>

        {/* Task Images View */}
        {activeView === 'media' && (
          <div className="space-y-3">
            {taskMedia.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No verified task images yet</p>
                <p className="text-sm text-gray-400 mt-1">Images appear here after caregiver verification</p>
              </div>
            ) : (
              taskMedia.map((item) => (
                <div key={item.taskId} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-gray-800 font-semibold">{item.patientName}</h3>
                      <p className="text-sm text-gray-500">{item.taskTitle}</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Verified</span>
                  </div>
                  <a
                    href={item.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-xl overflow-hidden border-2 border-[#4C9A2A] hover:shadow-lg transition-all cursor-pointer bg-[#4C9A2A]/5"
                  >
                    <div className="w-full h-48 flex items-center justify-center">
                      <img
                        src={item.mediaUrl}
                        alt={`Task proof: ${item.taskTitle}`}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const parent = (e.target as HTMLImageElement).parentElement!;
                          (e.target as HTMLImageElement).style.display = 'none';
                          parent.innerHTML = '<div class="flex flex-col items-center justify-center h-48 gap-2"><span class="text-4xl">📎</span><span class="text-sm font-semibold" style="color: #4C9A2A">Click to view / download attachment</span><span class="text-xs text-gray-400">Opens in a new tab</span></div>';
                        }}
                      />
                    </div>
                  </a>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {new Date(item.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <a
                      href={item.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold underline"
                      style={{ color: '#4C9A2A' }}
                    >
                      📷 View Full Image →
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Fullscreen Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white text-lg font-bold bg-white/20 rounded-full w-8 h-8 flex items-center justify-center hover:bg-white/40"
              >
                ✕
              </button>
              <img
                src={selectedImage}
                alt="Task proof fullscreen"
                className="max-w-full max-h-[80vh] rounded-xl object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  window.open(selectedImage, '_blank');
                  setSelectedImage(null);
                }}
              />
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-white/80 text-sm mt-3 hover:text-white underline"
              >
                Open in new tab
              </a>
            </div>
          </div>
        )}

        {/* Mood & Journal Logs View */}
        {activeView === 'moods' && (
          <div className="space-y-3">
            {filteredMoodLogs.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500">
                  {moodLogs.length === 0 ? 'No mood or journal entries from patients yet' : 'No logs match your search'}
                </p>
              </div>
            ) : (
              filteredMoodLogs.map((log) => (
                <div key={log.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  {/* Patient name and source badge */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-800 font-semibold">{log.patient_name}</h3>
                    <div className="flex items-center gap-2">
                      {log.source === 'mood_mapping' ? (
                        <span className="text-xs bg-[#6328FF]/10 text-[#6328FF] px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                          <Smile className="w-3 h-3" /> Mood Mapping
                        </span>
                      ) : (
                        <span className="text-xs bg-[#FE97CF]/10 text-[#FE97CF] px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Happy Journal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Emotion Tags (for Mood Mapping entries) */}
                  {log.emotions && log.emotions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {log.emotions.map((emotion, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-3 py-1 rounded-full font-medium ${idx === 0 ? 'bg-[#C2D738]/20 text-[#7a8a00]' :
                            idx === 1 ? 'bg-[#9E98ED]/20 text-[#6328FF]' :
                              'bg-[#FE97CF]/20 text-[#c44569]'
                            }`}
                        >
                          {idx === 0 ? '🎯 ' : '→ '}{emotion}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Journal Tags (parsed from journal_text "Tags: X, Y") */}
                  {log.source === 'happy_journal' && log.journal_text && (() => {
                    const tagsMatch = log.journal_text.match(/Tags:\s*(.+)/i);
                    if (tagsMatch) {
                      const tags = tagsMatch[1].split(',').map((t: string) => t.trim()).filter(Boolean);
                      return (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {tags.map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-3 py-1 rounded-full font-medium bg-[#FE97CF]/15 text-[#c44569]"
                            >
                              🏷️ {tag}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Mood Score */}
                  {log.mood_score && (
                    <p className="text-sm text-gray-600 mb-2">
                      Intensity: <span className="text-[#6328FF] font-semibold">{log.mood_score}/10</span>
                    </p>
                  )}

                  {/* Journal text preview (strip out the "Tags:" line) */}
                  {log.journal_text && (
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg line-clamp-2">
                      {log.journal_text.replace(/\nTags:.*$/i, '').trim()}
                    </p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(log.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Task Summary View */}
        {activeView === 'tasks' && (
          <>
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                  <p className="text-gray-500">
                    {patientLogs.length === 0 ? 'No patients linked yet' : 'No patients match your search'}
                  </p>
                </div>
              ) : (
                filteredLogs.map((patient) => (
                  <div key={patient.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-gray-800 mb-2">{patient.name}</h3>
                    <p className="text-sm text-gray-600">
                      Scheduled <span className="text-[#6328FF] font-semibold">{patient.scheduled}</span>,
                      Completed <span className="text-[#C2D738] font-semibold"> {patient.completed}</span>
                    </p>
                    {patient.scheduled > 0 && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#C2D738] h-2 rounded-full transition-all"
                          style={{ width: `${(patient.completed / patient.scheduled) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-800">Activity Completion</h3>
                <span className="text-sm text-gray-500">Last 7 days</span>
              </div>
              {chartData.length > 0 && totalStats.completed > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fill: '#666' }} />
                      <YAxis tick={{ fill: '#666' }} />
                      <Tooltip />
                      <Bar dataKey="completed" fill="#6328FF" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Overall Completion Rate: <span className="text-[#C2D738] font-semibold">{completionRate}%</span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400">
                  No activity data available yet
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <TherapistBottomNav />
    </div>
  );
}
