import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { Checkbox } from '../ui/checkbox';
import { CheckCircle2, Circle, ListTodo, Play, ChevronDown, ChevronUp, Camera, Mic, X, Loader2, Image as ImageIcon } from 'lucide-react';
import '../../styles/patient-tasks-background.css';
import { api } from '../../services/api';

const API_SERVER_URL = 'http://localhost:8000';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type Task = {
  id: string;
  title: string;
  description: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  is_completed: boolean;
  verified_by_caregiver: boolean;
  proof_media_id?: string;
  task_type?: string;
};

export function PatientTasks() {
  const navigate = useNavigate();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [uploadingTask, setUploadingTask] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<Record<string, string>>({}); // taskId -> mediaId
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadTaskId, setActiveUploadTaskId] = useState<string | null>(null);

  // IST time helpers
  const getNowIST = () => {
    const now = new Date();
    // Convert to IST by using toLocaleString
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    return new Date(istString);
  };

  const isWithinTimeWindow = (task: Task) => {
    if (!task.start_time || !task.end_time) return true;
    const now = getNowIST();
    const [startH, startM] = task.start_time.split(':').map(Number);
    const [endH, endM] = task.end_time.split(':').map(Number);
    const taskDate = new Date(task.scheduled_date + 'T00:00:00');

    const start = new Date(taskDate);
    start.setHours(startH, startM, 0, 0);

    const end = new Date(taskDate);
    end.setHours(endH, endM, 0, 0);
    // No +5min shown to patient (backend has the grace period)

    return now >= start && now <= end;
  };

  const isOverdue = (task: Task) => {
    if (task.is_completed) return false;
    if (!task.end_time) return false;
    const now = getNowIST();
    const [endH, endM] = task.end_time.split(':').map(Number);
    const taskDate = new Date(task.scheduled_date + 'T00:00:00');
    const end = new Date(taskDate);
    end.setHours(endH, endM, 0, 0);
    return now > end;
  };

  // Task is hidden from view 5 minutes after end time
  const isPastVisibility = (task: Task) => {
    if (!task.end_time) return false;
    const now = getNowIST();
    const [endH, endM] = task.end_time.split(':').map(Number);
    const taskDate = new Date(task.scheduled_date + 'T00:00:00');
    const end = new Date(taskDate);
    end.setHours(endH, endM, 0, 0);
    end.setMinutes(end.getMinutes() + 5); // 5 min grace after end
    return now > end;
  };

  const isBeforeWindow = (task: Task) => {
    if (!task.start_time) return false;
    const now = getNowIST();
    const [startH, startM] = task.start_time.split(':').map(Number);
    const taskDate = new Date(task.scheduled_date + 'T00:00:00');
    const start = new Date(taskDate);
    start.setHours(startH, startM, 0, 0);
    return now < start;
  };

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD in IST
  const todayDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });

  useEffect(() => {
    const fetchTasks = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        api.patient.getTasks(user.id).then(setAllTasks).catch(console.error);
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 120000);
    return () => clearInterval(interval);
  }, []);

  const tasks = allTasks.filter(task =>
    task.scheduled_date === today &&
    (task.task_type === 'therapist_task' || task.task_type === 'adl_schedule' || task.task_type === 'general' || !task.task_type)
  );

  const handleFileSelect = async (taskId: string, file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    if (!isImage && !isAudio) {
      alert('Please select an image or audio file.');
      return;
    }

    setUploadingTask(taskId);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const result = await api.media.uploadMedia({
            file_name: file.name,
            file_type: isImage ? 'image' : 'video', // backend expects 'image' or 'video'
            mime_type: file.type,
            file_size: file.size,
            file_data: base64,
            description: `Task proof: ${allTasks.find(t => t.id === taskId)?.title || 'Unknown'}`,
          }, user.id);

          // Link media to task and mark as completed
          await api.patient.completeTask(taskId, true, result.id);

          setUploadedMedia(prev => ({ ...prev, [taskId]: result.id }));
          setAllTasks(allTasks.map(t =>
            t.id === taskId ? { ...t, is_completed: true, proof_media_id: result.id } : t
          ));
          setActiveUploadTaskId(null);
        } catch (err) {
          console.error('Upload failed:', err);
          alert('Failed to upload file. Please try again.');
        } finally {
          setUploadingTask(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to read file:', error);
      setUploadingTask(null);
    }
  };

  const triggerFileInput = (taskId: string) => {
    setActiveUploadTaskId(taskId);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    const task = allTasks.find(t => t.id === id);
    if (task && !currentStatus) {
      // Trying to mark complete — check time window
      if (isOverdue(task)) {
        alert('This task is overdue. The completion window has expired.');
        return;
      }
      if (isBeforeWindow(task)) {
        alert(`This task is not yet available. It starts at ${task.start_time} IST.`);
        return;
      }
    }
    try {
      await api.patient.completeTask(id, !currentStatus);
      setAllTasks(allTasks.map((t) =>
        t.id === id ? { ...t, is_completed: !currentStatus } : t
      ));
    } catch (error: any) {
      console.error("Failed to update task", error);
      alert(error.message || 'Failed to update task');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTask(expandedTask === id ? null : id);
  };

  const completedCount = tasks.filter((t) => t.is_completed && t.verified_by_caregiver).length;

  return (
    <div className="min-h-screen patient-tasks-bg pb-20">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activeUploadTaskId) {
            handleFileSelect(activeUploadTaskId, file);
          }
          e.target.value = '';
        }}
      />

      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold mb-1 text-black flex items-center gap-2">
            Today's Tasks <ListTodo className="w-7 h-7 text-[#6328FF]" />
          </h1>
          <p className="text-black font-semibold text-lg">{todayDisplay} - {completedCount} of {tasks.length} completed</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Progress Bar */}
        <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5]">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-black font-medium">Daily Progress</span>
            <span className="text-black font-semibold">{tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%</span>
          </div>
          <div className="w-full h-3 bg-[#E8D9B5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#9E98ED] transition-all duration-500"
              style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="bg-[#FFF8E7] rounded-3xl p-8 shadow-md border border-[#E8D9B5] text-center">
              <ListTodo className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Tasks for Today</h3>
              <p className="text-gray-500 text-sm">
                You don't have any tasks scheduled for {today}. Check your full schedule for other days.
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`w-full rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-[#E8D9B5] ${task.is_completed ? 'bg-[#E8F5E9]' : 'bg-[#FFF8E7]'
                  }`}
              >
                <div className="p-5 flex items-center gap-4">
                  <button
                    onClick={() => toggleTask(task.id, task.is_completed)}
                    className="flex-shrink-0 focus:outline-none"
                    disabled={!task.is_completed && (isOverdue(task) || isBeforeWindow(task))}
                    style={{ opacity: (!task.is_completed && (isOverdue(task) || isBeforeWindow(task))) ? 0.4 : 1 }}
                  >
                    {task.is_completed ? (
                      <CheckCircle2 className="w-8 h-8 text-[#C2D738]" />
                    ) : isOverdue(task) ? (
                      <X className="w-8 h-8 text-red-400" />
                    ) : (
                      <Circle className="w-8 h-8 text-[#9E98ED]" />
                    )}
                  </button>

                  <div className="flex-1 text-left" onClick={() => toggleExpand(task.id)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">{new Date(task.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p className={`font-medium ${task.is_completed ? 'text-gray-500 line-through' : 'text-black'}`}>
                          {task.title}
                        </p>
                      </div>
                      {expandedTask === task.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mt-1">{task.start_time} - {task.end_time} IST</p>

                    {/* Time window status indicators */}
                    {!task.is_completed && isOverdue(task) && (
                      <p className="text-xs text-red-600 font-bold mt-1">❌ Overdue — completion window has expired</p>
                    )}
                    {!task.is_completed && isBeforeWindow(task) && (
                      <p className="text-xs text-orange-500 font-semibold mt-1">⏰ Available at {task.start_time} IST</p>
                    )}
                    {!task.is_completed && isWithinTimeWindow(task) && (
                      <p className="text-xs text-green-600 font-semibold mt-1">🟢 Available now — complete before {task.end_time}</p>
                    )}
                    {task.is_completed && !task.verified_by_caregiver && (
                      <p className="text-xs text-yellow-600 mt-1">⏳ Awaiting caregiver verification</p>
                    )}
                    {task.verified_by_caregiver && (
                      <p className="text-xs text-green-600 mt-1">✓ Verified by caregiver</p>
                    )}
                    {task.proof_media_id && (
                      <p className="text-xs mt-1" style={{ color: '#4C9A2A' }}>📎 Media attached</p>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTask === task.id && (
                  <div className="px-5 pb-5 pt-0 border-t border-[#E8D9B5] mt-2">
                    <div className="pt-4 space-y-3">
                      {task.description && (
                        <div className="bg-white p-3 rounded-xl border border-[#E8D9B5]">
                          <p className="text-xs font-bold text-gray-700 mb-1">Description:</p>
                          <p className="text-sm text-black">{task.description}</p>
                        </div>
                      )}

                      {/* Upload Media Section */}
                      {!task.is_completed && !isOverdue(task) && !isBeforeWindow(task) && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-600">Attach proof (optional, max 10MB):</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => triggerFileInput(task.id)}
                              disabled={uploadingTask === task.id}
                              className="flex-1 bg-[#C2D738] hover:bg-[#adc12f] rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {uploadingTask === task.id ? (
                                <Loader2 className="w-5 h-5 text-black animate-spin" />
                              ) : (
                                <Camera className="w-5 h-5 text-black" />
                              )}
                              <span className="text-black font-semibold text-sm">
                                {uploadingTask === task.id ? 'Uploading...' : 'Upload Image / Voice'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Show uploaded media preview */}
                      {(task.proof_media_id || uploadedMedia[task.id]) && (
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                          <p className="text-xs font-bold text-blue-700 mb-1">📎 Proof Media Attached</p>
                          <a
                            href={`${API_SERVER_URL}/api/uploads/file/${task.proof_media_id || uploadedMedia[task.id]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 underline"
                          >
                            View Attachment
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <PatientBottomNav />
    </div>
  );
}
