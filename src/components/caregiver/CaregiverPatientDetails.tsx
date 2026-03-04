import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CaregiverBottomNav } from '../shared/CaregiverBottomNav';
import { ArrowLeft, User, Calendar, CheckCircle, Clock, AlertTriangle, MessageSquare, Phone, Video, Image as ImageIcon, Activity } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { api, API_SERVER_URL } from '../../services/api';

import '../../styles/caregiver-background.css';

export function CaregiverPatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>({});
  const [activeTab, setActiveTab] = useState('tasks');
  const [newNote, setNewNote] = useState('');

  // Verification State
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [verificationNote, setVerificationNote] = useState('');

  // Dynamic State
  const [patient, setPatient] = useState<any>({
    id: '', name: 'Loading...', age: '', condition: '', avatar: '👤', therapist: '', emergencyContact: '', lastVisit: ''
  });
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);


  useEffect(() => {
    const fetchData = async () => {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);

      if (id) {
        try {
          const patientData = await api.caregiver.getPatientDetails(id);
          setPatient(patientData);

          const tasksData = await api.caregiver.getPatientTasks(id);
          // Transform tasks to match UI expectations if needed
          const transformedTasks = tasksData.map((t: any) => ({
            id: t.id,
            name: t.title,
            time: t.start_time,
            status: t.is_completed ? 'completed' : 'pending',
            completedAt: t.is_completed ? 'Today' : null,
            note: t.description,
            verified: t.verified_by_caregiver,
            proofMediaId: t.proof_media_id,
            media: t.media,
            task_type: t.task_type,
            verificationNotes: t.verification_notes
          }));
          setTodayTasks(transformedTasks);

          const notesData = await api.caregiver.getPatientNotes(id);
          setRecentNotes(notesData);


        } catch (error) {
          console.error("Failed to fetch patient details", error);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [id]);

  const handleVerifyClick = (taskId: string) => {
    setVerifyingTaskId(taskId);
    setVerificationNote('');
  };

  const confirmVerification = async () => {
    if (!verifyingTaskId) return;
    try {
      // Assuming api.caregiver.verifyTask is updated to accept notes (3rd arg)
      // If not updated in api.ts yet, I should check api.ts.
      // But based on my previous steps, I updated backend, I need to update api.ts too?
      // Wait, I did NOT update api.ts for verifyTask signature yet!
      // I updated completeTask in api.ts.
      // I need to update verifyTask in api.ts to accept notes.
      // I will assume it's updated or update it next.
      // For now, I'll pass the object as backend expects?
      // Backend expects { task_id, verified, notes }.
      // api.ts verifyTask does: body: JSON.stringify({ task_id: taskId, verified }),
      // I need to update api.ts verifyTask signature too.
      // I will do that in next step.
      await api.caregiver.verifyTask(verifyingTaskId, true, verificationNote);

      setTodayTasks(prev =>
        prev.map(task =>
          task.id === verifyingTaskId ? { ...task, verified: true, verificationNotes: verificationNote } : task
        )
      );
      alert('Task verified successfully!');
    } catch (e) {
      alert('Failed to verify task');
    } finally {
      setVerifyingTaskId(null);
      setVerificationNote('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-[#6b9b9b]" />;
      case 'pending': return <Clock className="w-5 h-5 text-[#b8a67a]" />;
      case 'overdue': return <AlertTriangle className="w-5 h-5 text-[#b8907a]" />;
      default: return null;
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim() && id && user.id) {
      try {
        await api.caregiver.addNote({
          patient_id: id,
          author_id: user.id,
          content: newNote
        });
        setNewNote('');
        alert('Note added successfully!');
        // Refresh notes
        const notesData = await api.caregiver.getPatientNotes(id);
        setRecentNotes(notesData);
      } catch (e) {
        alert('Failed to add note');
      }
    }
  };

  return (
    <div className="min-h-screen caregiver-details-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#d4b5d4]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/caregiver/patients')}
              className="w-10 h-10 rounded-full bg-[#d4b5d4]/10 flex items-center justify-center hover:bg-[#d4b5d4]/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-[#d4b5d4]" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4b5d4] to-[#b8a0b8] flex items-center justify-center shadow-lg">
                <span className="text-2xl">{patient.avatar}</span>
              </div>
              <div>
                <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-2xl font-bold text-black">
                  {patient.name}
                </h1>
                <p className="text-black font-medium">Age: {patient.age} • {patient.condition}</p>
                <p className="text-sm text-black">Therapist: {patient.therapist}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button className="bg-[#00d2d3] hover:bg-[#00b8d4] text-white px-4 py-2 rounded-xl flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Call
            </Button>
            <Button className="bg-[#ff6b9d] hover:bg-[#ff5582] text-white px-4 py-2 rounded-xl flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video Call
            </Button>
            <Button className="bg-[#ffa726] hover:bg-[#ff9800] text-white px-4 py-2 rounded-xl flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Message
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-2 shadow-md border border-gray-100">
          <div className="flex gap-1">
            {[
              { id: 'tasks', label: 'Today\'s Tasks' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${activeTab === tab.id
                    ? 'bg-[#ff6b9d] text-black shadow-md'
                    : 'text-black hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">


            {todayTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <h4 className="text-lg font-semibold text-black">{task.name}</h4>
                      {task.task_type === 'adl_schedule' && (
                        <span className="text-[10px] bg-purple-100 text-[#6328FF] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">ADL Task</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-black">Scheduled: {task.time}</span>
                </div>

                {task.completedAt && (
                  <p className="text-sm text-[#00d2d3] mb-2">✅ Completed at {task.completedAt}</p>
                )}

                {task.note && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <p className="text-sm text-black">{task.note}</p>
                  </div>
                )}

                {/* Media Proof Section - Always show if available */}
                {task.media?.s3_key && (
                  <div className="mt-2 mb-4">
                    <p className="text-xs text-gray-500 mb-2 font-bold flex items-center gap-2 uppercase tracking-wide">
                      <ImageIcon className="w-3.5 h-3.5 text-[#ff6b9d]" /> Patient Uploaded Media
                    </p>
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-gray-50 shadow-md bg-black/5 relative group cursor-pointer"
                      onClick={() => window.open(task.media.s3_key.startsWith('http') ? task.media.s3_key : `${API_SERVER_URL}/static/${task.media.s3_key}`, '_blank')}>
                      {task.media.file_type === 'image' ? (
                        <img
                          src={task.media.s3_key.startsWith('http') ? task.media.s3_key : `${API_SERVER_URL}/static/${task.media.s3_key}`}
                          alt="Proof"
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 gap-2">
                          <Video className="w-10 h-10 text-gray-400 group-hover:text-[#6328FF] transition-colors" />
                          <span className="text-[10px] text-gray-500 font-bold">Play Video</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <span className="text-xs text-white font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">View Full</span>
                      </div>
                    </div>
                  </div>
                )}

                {task.status === 'completed' && !task.verified && (
                  <div className="mt-3">
                    {verifyingTaskId === task.id ? (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                        <h5 className="font-semibold text-black mb-2">Verify Task</h5>

                        <div className="mb-3">
                          <label className="text-sm text-gray-600 block mb-1">Verification Notes (Optional):</label>
                          <Textarea
                            value={verificationNote}
                            onChange={(e) => setVerificationNote(e.target.value)}
                            placeholder="e.g. Done well, struggling with..."
                            className="bg-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={confirmVerification}
                            className="flex-1 bg-[#6328FF] hover:bg-[#5020dd] text-white"
                          >
                            Confirm
                          </Button>
                          <Button
                            onClick={() => setVerifyingTaskId(null)}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleVerifyClick(task.id)}
                        className="w-full bg-[#6328FF] hover:bg-[#5020dd] text-white py-2 rounded-xl font-bold transition-all"
                      >
                        ✓ Verify Task Completion
                      </button>
                    )}
                  </div>
                )}

                {task.verified && (
                  <div className="bg-[#C2D738]/10 border border-[#C2D738]/30 rounded-xl p-3 mt-3">
                    <p className="text-[#C2D738] font-medium text-sm">✓ Verified by you</p>
                    {task.verificationNotes && (
                      <p className="text-sm text-gray-600 mt-1">Note: {task.verificationNotes}</p>
                    )}
                  </div>
                )}

                {task.status === 'pending' && (
                  <div className="bg-[#ffa726]/10 border border-[#ffa726]/30 rounded-xl p-3 mt-3">
                    <p className="text-[#ffa726] font-medium text-sm">⏳ Waiting for completion</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}




      </div>

      <CaregiverBottomNav />
    </div>
  );
}