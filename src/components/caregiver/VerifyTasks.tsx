import { useState, useEffect } from 'react';
import { CaregiverBottomNav } from '../shared/CaregiverBottomNav';
import { CheckCircle, X, Clock, User, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import '../../styles/caregiver-background.css';
import { api } from '../../services/api';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  patient_id: string;
  patient_name: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  is_completed: boolean;
  verified_by_caregiver: boolean;
  task_type?: string;
  created_at: string;
}

export function VerifyTasks() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  // IST time helpers
  const getNowIST = () => {
    const now = new Date();
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    return new Date(istString);
  };

  const isTaskOverdue = (task: TaskItem) => {
    if (task.is_completed) return false;
    const now = getNowIST();
    const [endH, endM] = task.end_time.split(':').map(Number);
    const taskDate = new Date(task.scheduled_date + 'T00:00:00');
    const end = new Date(taskDate);
    end.setHours(endH, endM, 0, 0);
    return now > end;
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
          const data = await api.caregiver.getTasks(user.id);
          setTasks(data);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Filter tasks: Show completed tasks for verification + overdue uncompleted tasks
  const filteredTasks = tasks.filter(t =>
    t.is_completed || isTaskOverdue(t)
  );

  const handleVerify = async (taskId: string, verified: boolean) => {
    setVerifying(taskId);
    try {
      await api.caregiver.verifyTask(taskId, verified);
      // Update local state
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, verified_by_caregiver: verified } : t
      ));
      setSelectedTask(null);
      setVerificationNote('');
    } catch (error) {
      console.error('Failed to verify task:', error);
      alert('Failed to verify task');
    } finally {
      setVerifying(null);
    }
  };

  const getTaskStatus = (task: TaskItem) => {
    if (task.verified_by_caregiver) return 'verified';
    if (!task.is_completed && isTaskOverdue(task)) return 'overdue';
    if (task.is_completed) return 'completed';
    return 'pending';
  };

  const getPriorityColor = (status: string) => {
    switch (status) {
      case 'verified': return 'from-[#a8d8d8] to-[#9bc5c5]';
      case 'completed': return 'from-[#e6d4a8] to-[#d9c79a]';
      case 'overdue': return 'from-red-400 to-red-500';
      case 'pending': return 'from-[#e6b8a8] to-[#d9a89a]';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="min-h-screen caregiver-verify-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#d4b5d4]">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-black mb-2 flex items-center gap-2">
            Verify Tasks <CheckCircle className="w-8 h-8 text-[#d4b5d4]" />
          </h1>
          <p className="text-black font-semibold text-lg">Review and verify completed patient tasks</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-200">
          <h3 className="text-black font-bold mb-6 text-lg">Verification Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-white rounded-2xl p-4 shadow-md border-2 border-[#a8d8d8]">
              <div className="text-2xl font-bold text-[#6b9b9b]">
                {tasks.filter(t => t.verified_by_caregiver).length}
              </div>
              <div className="text-sm text-black font-semibold">Verified</div>
            </div>
            <div className="text-center bg-white rounded-2xl p-4 shadow-md border-2 border-[#e6d4a8]">
              <div className="text-2xl font-bold text-[#b8a67a]">
                {tasks.filter(t => t.is_completed && !t.verified_by_caregiver).length}
              </div>
              <div className="text-sm text-black font-semibold">Pending Verification</div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#d4b5d4]" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-200 text-center">
            <p className="text-gray-500">No completed tasks requiring verification</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const status = getTaskStatus(task);
            return (
              <div key={task.id} className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-200">
                <div className="flex items-start gap-4">
                  {/* Patient Avatar */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getPriorityColor(status)} flex items-center justify-center shadow-md flex-shrink-0`}>
                    <span className="text-xl">👤</span>
                  </div>

                  {/* Task Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-black">{task.patient_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'verified' ? 'bg-[#a8d8d8]/10 text-[#6b9b9b]' :
                        status === 'completed' ? 'bg-[#e6d4a8]/10 text-[#b8a67a]' :
                          'bg-[#e6b8a8]/10 text-[#b8907a]'
                        }`}>
                        {new Date(task.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-black font-medium mb-2">{task.title}</p>

                    <div className="flex items-center gap-4 text-sm text-black mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Scheduled: {task.start_time} - {task.end_time} IST</span>
                      </div>
                    </div>

                    {task.description && (
                      <div className="bg-gray-50 rounded-xl p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-black" />
                          <span className="text-sm font-medium text-black">Description:</span>
                        </div>
                        <p className="text-sm text-black">{task.description}</p>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status === 'verified' ? 'bg-[#a8d8d8]/10 text-[#6b9b9b]' :
                          status === 'overdue' ? 'bg-red-100 text-red-700' :
                            status === 'completed' ? 'bg-[#e6d4a8]/10 text-[#b8a67a]' :
                              'bg-[#e6b8a8]/10 text-[#b8907a]'
                        }`}>
                        {status === 'verified' ? '✅ Verified' :
                          status === 'overdue' ? '❌ Late / Overdue' :
                            status === 'completed' ? '⏳ Awaiting Verification' : '❌ Pending'}
                      </span>
                    </div>

                    {/* Verification Actions - show for completed but not verified */}
                    {task.is_completed && !task.verified_by_caregiver && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVerify(task.id, true)}
                          disabled={verifying === task.id}
                          style={{
                            flex: '1',
                            backgroundColor: '#7C3AED',
                            color: 'white',
                            fontWeight: '700',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '2px solid #8B5CF6',
                            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.6)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                        >
                          {verifying === task.id ? 'Verifying...' : '✅ Verify Completed'}
                        </button>
                        <button
                          onClick={() => setSelectedTask(task.id)}
                          style={{
                            flex: '1',
                            backgroundColor: 'white',
                            color: 'black',
                            fontWeight: '700',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '2px solid #e6b8a8',
                            boxShadow: '0 4px 16px rgba(230, 184, 168, 0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                        >
                          ❌ Needs Review
                        </button>
                      </div>
                    )}

                    {!task.is_completed && (
                      <div className="bg-[#e6d4a8]/10 border border-[#e6d4a8]/30 rounded-xl p-3">
                        <p className="text-[#b8a67a] font-medium text-sm">⏳ Waiting for patient to complete this task</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Note Modal */}
                {selectedTask === task.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-[#d4b5d4]/30">
                    <h4 className="font-semibold text-black mb-3">Add Verification Note</h4>
                    <Textarea
                      placeholder="Add notes about why this task needs review..."
                      value={verificationNote}
                      onChange={(e) => setVerificationNote(e.target.value)}
                      className="mb-3"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleVerify(task.id, false)}
                        className="bg-[#e6b8a8] hover:bg-[#d9a89a] text-white px-4 py-2 rounded-lg"
                      >
                        Submit Review
                      </Button>
                      <Button
                        onClick={() => setSelectedTask(null)}
                        variant="outline"
                        className="px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <CaregiverBottomNav />
    </div>
  );
}