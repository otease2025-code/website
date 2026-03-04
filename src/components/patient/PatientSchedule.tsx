import { useState, useEffect } from 'react';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { Clock, Calendar, CheckCircle2, Circle, Upload, Loader2, X } from 'lucide-react';
import '../../styles/patient-schedule-background.css';
import { api } from '../../services/api';

type Task = {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  is_completed: boolean;
  verified_by_caregiver?: boolean;
  task_type?: string;
};

export function PatientSchedule() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  });

  // IST time helpers
  const getNowIST = () => {
    const now = new Date();
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    return new Date(istString);
  };

  const isWithinTimeWindow = (task: Task) => {
    const now = getNowIST();
    const [startH, startM] = task.start_time.split(':').map(Number);
    const [endH, endM] = task.end_time.split(':').map(Number);
    const taskDate = new Date(task.scheduled_date + 'T00:00:00');
    const start = new Date(taskDate); start.setHours(startH, startM, 0, 0);
    const end = new Date(taskDate); end.setHours(endH, endM, 0, 0);
    return now >= start && now <= end;
  };

  const isOverdue = (task: Task) => {
    if (task.is_completed) return false;
    const now = getNowIST();
    const [endH, endM] = task.end_time.split(':').map(Number);
    const taskDate = new Date(task.scheduled_date + 'T00:00:00');
    const end = new Date(taskDate); end.setHours(endH, endM, 0, 0);
    return now > end;
  };

  const isBeforeWindow = (task: Task) => {
    const now = getNowIST();
    const [startH, startM] = task.start_time.split(':').map(Number);
    const taskDate = new Date(task.scheduled_date + 'T00:00:00');
    const start = new Date(taskDate); start.setHours(startH, startM, 0, 0);
    return now < start;
  };

  // Task is hidden from view 5 minutes after end time
  const isPastVisibility = (task: Task) => {
    const now = getNowIST();
    const [endH, endM] = task.end_time.split(':').map(Number);
    const taskDate = new Date(task.scheduled_date + 'T00:00:00');
    const end = new Date(taskDate);
    end.setHours(endH, endM, 0, 0);
    end.setMinutes(end.getMinutes() + 5); // 5 min grace after end
    return now > end;
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
          const data = await api.patient.getTasks(user.id);
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

  // Get the logged-in user name
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || 'Patient';

  // Generate next 7 days for date selection
  const getNext7Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
        dayNum: date.getDate(),
        isToday: i === 0
      });
    }
    return dates;
  };

  const availableDates = getNext7Days();
  const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  // Filter tasks for the selected date
  const filteredTasks = tasks.filter(task => task.scheduled_date === selectedDate && task.task_type === 'adl_schedule' && !isPastVisibility(task));

  // Sort tasks by start time
  const sortedTasks = [...filteredTasks].sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Get display name for selected date
  const selectedDateDisplay = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadingTaskId(taskId);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result?.toString().split(',')[1];
        if (base64String && user.id) {
          try {
            // Upload media
            const uploadRes = await api.media.uploadMedia({
              file_name: file.name,
              file_type: file.type.startsWith('image/') ? 'image' : 'video',
              mime_type: file.type,
              file_size: file.size,
              file_data: base64String,
              description: `Proof for task ${taskId}`
            }, user.id);

            // Complete task with proof
            await api.patient.completeTask(taskId, true, uploadRes.id);

            // Update local state
            setTasks(prev => prev.map(t =>
              t.id === taskId ? { ...t, is_completed: true } : t
            ));
            alert('Task completed with proof!');
          } catch (error: any) {
            console.error('Upload failed:', error);
            alert('Failed to upload proof: ' + (error.message || 'Unknown error'));
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && isOverdue(task)) {
      alert('This task is overdue. The completion window has expired.');
      return;
    }
    if (task && isBeforeWindow(task)) {
      alert(`This task is not yet available. It starts at ${task.start_time} IST.`);
      return;
    }
    try {
      await api.patient.completeTask(taskId, true);
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, is_completed: true } : t
      ));
    } catch (error: any) {
      console.error('Failed to complete task:', error);
      alert(error.message || 'Failed to complete task');
    }
  };

  return (
    <div className="min-h-screen patient-schedule-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold mb-1 text-black flex items-center gap-2">
            My Schedule <Calendar className="w-7 h-7 text-[#6328FF]" />
          </h1>
          <p className="text-black font-semibold text-lg">{userName}'s Activity Schedule</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Date Selector */}
        <div className="bg-[#FFF8E7] rounded-3xl p-4 shadow-md border border-[#E8D9B5]">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableDates.map((date) => (
              <button
                key={date.value}
                onClick={() => setSelectedDate(date.value)}
                className={`flex flex-col items-center px-4 py-3 rounded-xl min-w-[60px] transition-all ${selectedDate === date.value
                  ? 'bg-[#C2D738] text-black shadow-md'
                  : date.isToday
                    ? 'bg-[#E8D9B5] text-black border-2 border-[#C2D738]'
                    : 'bg-white text-black hover:bg-[#E8D9B5]'
                  }`}
              >
                <span className="text-xs font-medium">{date.dayName}</span>
                <span className="text-lg font-bold">{date.dayNum}</span>
                {date.isToday && selectedDate !== date.value && (
                  <span className="text-[10px] text-gray-500">Today</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-[#FFF8E7] rounded-3xl p-5 shadow-md border border-[#E8D9B5]">
          {/* Header */}
          <h3 className="text-black mb-4 flex items-center gap-2 font-semibold">
            <Clock className="w-5 h-5 text-[#6328FF]" />
            {selectedDateDisplay}
            {selectedDate === todayDate && <span className="text-xs bg-[#C2D738] text-black px-2 py-1 rounded-full">Today</span>}
          </h3>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-[#6328FF] border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-500">Loading your schedule...</p>
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No activities scheduled</p>
                <p className="text-sm">Check other days for your schedule</p>
              </div>
            ) : (
              sortedTasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`flex flex-col gap-3 p-4 rounded-2xl transition-all ${task.is_completed
                    ? 'bg-[#C2D738]/20 border border-[#C2D738]'
                    : 'bg-white border border-[#E8D9B5]'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${task.is_completed
                      ? 'bg-[#C2D738]'
                      : 'bg-gradient-to-br from-[#6328FF] to-[#9E98ED]'
                      }`}>
                      {task.is_completed ? (
                        <CheckCircle2 className="w-6 h-6 text-black" />
                      ) : (
                        <span className="text-black text-xl font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${task.is_completed ? 'text-gray-500 line-through' : 'text-black'}`}>
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {task.start_time} - {task.end_time} IST
                      </p>
                      {/* Time window status */}
                      {!task.is_completed && isOverdue(task) && (
                        <p className="text-xs text-red-600 font-bold mt-0.5">❌ Overdue</p>
                      )}
                      {!task.is_completed && isBeforeWindow(task) && (
                        <p className="text-xs text-orange-500 font-semibold mt-0.5">⏰ Available at {task.start_time}</p>
                      )}
                      {!task.is_completed && isWithinTimeWindow(task) && (
                        <p className="text-xs text-green-600 font-semibold mt-0.5">🟢 Complete before {task.end_time}</p>
                      )}
                    </div>
                    {task.is_completed && (
                      <span className="text-xs bg-[#C2D738] text-black px-2 py-1 rounded-full font-semibold">Done</span>
                    )}
                    {!task.is_completed && isOverdue(task) && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-semibold">Overdue</span>
                    )}
                  </div>

                  {/* Actions for Pending Tasks - only within time window */}
                  {!task.is_completed && !isOverdue(task) && !isBeforeWindow(task) && (
                    <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-gray-100">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        id={`file-${task.id}`}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, task.id)}
                        disabled={uploadingTaskId === task.id}
                      />
                      <label
                        htmlFor={`file-${task.id}`}
                        className={`px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-gray-200 ${uploadingTaskId === task.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploadingTaskId === task.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" /> Upload Proof
                          </>
                        )}
                      </label>
                      <button
                        onClick={() => handleMarkComplete(task.id)}
                        className="px-3 py-1.5 bg-[#6328FF] text-white rounded-lg text-sm font-medium hover:bg-[#5218ee]"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-[#FFF8E7] rounded-3xl p-5 shadow-md border border-[#E8D9B5]">
          <h3 className="text-black font-semibold mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 text-center border border-[#E8D9B5]">
              <p className="text-2xl font-bold text-[#6328FF]">{sortedTasks.length}</p>
              <p className="text-sm text-gray-600">Total Tasks</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-[#E8D9B5]">
              <p className="text-2xl font-bold text-[#C2D738]">{sortedTasks.filter(t => t.is_completed && t.verified_by_caregiver).length}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <PatientBottomNav />
    </div>
  );
}
