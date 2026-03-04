import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { BarChart3, CheckCircle2, Circle, ChevronLeft, ListTodo, TrendingUp } from 'lucide-react';
import '../../styles/patient-progress-background.css';
import { api } from '../../services/api';

type Task = {
  id: string;
  title: string;
  scheduled_date: string;
  is_completed: boolean;
  verified_by_caregiver: boolean;
  task_type?: string;
};

export function TrackProgress() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const verifiedTasks = tasks.filter(t => t.is_completed && t.verified_by_caregiver).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group tasks by date
  const tasksByDate: Record<string, Task[]> = {};
  tasks.forEach(task => {
    const date = task.scheduled_date;
    if (!tasksByDate[date]) tasksByDate[date] = [];
    tasksByDate[date].push(task);
  });

  const sortedDates = Object.keys(tasksByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen patient-progress-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate('/patient/home')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="mb-1 flex items-center gap-2 text-3xl font-bold text-black">
              Track Your Progress <BarChart3 className="w-7 h-7 text-[#6328FF]" />
            </h1>
          </div>
          <p className="text-black font-semibold text-lg ml-12">See how far you've come!</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {loading ? (
          <div className="bg-[#FFF8E7] rounded-3xl p-12 shadow-md text-center border border-[#E8D9B5]">
            <div className="animate-spin w-8 h-8 border-4 border-[#6328FF] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your progress...</p>
          </div>
        ) : totalTasks === 0 ? (
          <div className="bg-[#FFF8E7] rounded-3xl p-12 shadow-md text-center border border-[#E8D9B5]">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl text-black mb-2">No Progress Data Yet</h3>
            <p className="text-gray-600">
              Your progress charts will appear here once you start completing tasks.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5] text-center">
                <div className="w-14 h-14 rounded-full bg-[#C2D738] flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <CheckCircle2 className="w-7 h-7 text-black" />
                </div>
                <p className="text-3xl font-bold text-black">{completedTasks}</p>
                <p className="text-sm text-gray-600 font-medium">Tasks Done</p>
              </div>
              <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5] text-center">
                <div className="w-14 h-14 rounded-full bg-[#9E98ED] flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <ListTodo className="w-7 h-7 text-white" />
                </div>
                <p className="text-3xl font-bold text-black">{totalTasks}</p>
                <p className="text-sm text-gray-600 font-medium">Total Assigned</p>
              </div>
              <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5] text-center">
                <div className="w-14 h-14 rounded-full bg-[#FE97CF] flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Circle className="w-7 h-7 text-black" />
                </div>
                <p className="text-3xl font-bold text-black">{pendingTasks}</p>
                <p className="text-sm text-gray-600 font-medium">Pending</p>
              </div>
              <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5] text-center">
                <div className="w-14 h-14 rounded-full bg-[#6328FF] flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <p className="text-3xl font-bold text-black">{verifiedTasks}</p>
                <p className="text-sm text-gray-600 font-medium">Verified</p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5]">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-black font-semibold">Overall Completion</span>
                <span className="text-black font-bold">{completedTasks}/{totalTasks}</span>
              </div>
              <div className="w-full h-4 bg-[#E8D9B5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C2D738] to-[#9E98ED] transition-all duration-500 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2 font-medium">{completionRate}% Complete</p>
            </div>

            {/* Task History by Date */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-black">Task History</h3>
              {sortedDates.map(date => {
                const dateTasks = tasksByDate[date];
                const done = dateTasks.filter(t => t.is_completed).length;
                return (
                  <div key={date} className="bg-[#FFF8E7] rounded-3xl p-5 shadow-sm border border-[#E8D9B5]">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-semibold text-black">
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <span className="text-sm font-bold text-[#6328FF]">{done}/{dateTasks.length} done</span>
                    </div>
                    <div className="space-y-2">
                      {dateTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3">
                          {task.is_completed ? (
                            <CheckCircle2 className="w-5 h-5 text-[#C2D738] flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${task.is_completed ? 'text-gray-500 line-through' : 'text-black'}`}>
                            {task.title}
                          </span>
                          {task.verified_by_caregiver && (
                            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Verified</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <PatientBottomNav />
    </div>
  );
}
