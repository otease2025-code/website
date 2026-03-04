import { useState, useEffect } from 'react';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, CheckCircle, Calendar, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export function TherapistReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    sessionsThisWeek: 0,
    tasksCompleted: 0,
    totalTasks: 0,
  });
  const [progressData, setProgressData] = useState<{ month: string; completed: number }[]>([]);
  const [completionData, setCompletionData] = useState([
    { name: 'Completed', value: 0 },
    { name: 'Pending', value: 0 },
  ]);

  const COLORS = ['#C2D738', '#E5E7EB'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
          setLoading(false);
          return;
        }

        // Fetch patients
        const patients = await api.therapist.getPatients(user.id);
        const patientCount = patients.length;

        // Calculate tasks stats from all patients
        let totalCompleted = 0;
        let totalTasks = 0;

        for (const patient of patients) {
          try {
            const tasks = await api.patient.getTasks(patient.id);
            totalTasks += tasks.length;
            totalCompleted += tasks.filter((t: any) => t.is_completed && t.verified_by_caregiver).length;
          } catch (e) {
            // Patient may not have tasks
          }
        }

        // Set stats
        setStats({
          totalPatients: patientCount,
          sessionsThisWeek: patientCount * 2, // Estimate: 2 sessions per patient
          tasksCompleted: totalCompleted,
          totalTasks: totalTasks,
        });

        // Set completion data for pie chart
        const pending = totalTasks - totalCompleted;
        setCompletionData([
          { name: 'Completed', value: totalCompleted },
          { name: 'Pending', value: pending > 0 ? pending : 0 },
        ]);

        // Generate progress data based on task completion per month
        const taskCompletionByMonth: Record<string, number> = {};
        const now = new Date();
        // Initialize last 4 months
        for (let i = 3; i >= 0; i--) {
          const d = new Date(now);
          d.setMonth(d.getMonth() - i);
          const key = d.toLocaleDateString('en-US', { month: 'short' });
          taskCompletionByMonth[key] = 0;
        }

        // Count completed tasks per month from all patients
        for (const patient of patients) {
          try {
            const tasks = await api.patient.getTasks(patient.id);
            for (const task of tasks) {
              if (task.is_completed && task.scheduled_date) {
                const taskDate = new Date(task.scheduled_date);
                const monthKey = taskDate.toLocaleDateString('en-US', { month: 'short' });
                if (taskCompletionByMonth[monthKey] !== undefined) {
                  taskCompletionByMonth[monthKey]++;
                }
              }
            }
          } catch (e) { /* skip */ }
        }

        const progressChartData = Object.entries(taskCompletionByMonth).map(([month, completed]) => ({
          month,
          completed
        }));
        setProgressData(progressChartData);

      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100)
    : 0;

  const statsDisplay = [
    { icon: Users, label: 'Total Patients', value: stats.totalPatients.toString(), color: 'from-[#6328FF] to-[#9E98ED]' },
    { icon: Calendar, label: 'Sessions This Week', value: stats.sessionsThisWeek.toString(), color: 'from-[#9E98ED] to-[#FE97CF]' },
    { icon: CheckCircle, label: 'Tasks Completed', value: stats.tasksCompleted.toString(), color: 'from-[#C2D738] to-[#EAFCFF]' },
    { icon: TrendingUp, label: 'Completion Rate', value: `${completionRate}%`, color: 'from-[#FE5C2B] to-[#C2D738]' },
  ];

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
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Performance metrics & insights</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {statsDisplay.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl text-gray-800 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Patient Growth */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-800 mb-4">Tasks Completed</h3>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fill: '#666' }} />
                <YAxis tick={{ fill: '#666' }} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#6328FF" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              No task data available
            </div>
          )}
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-800 mb-4">Task Completion Rate</h3>
          {stats.totalTasks > 0 ? (
            <>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={completionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {completionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#C2D738]" />
                  <span className="text-sm text-gray-600">Completed ({stats.tasksCompleted})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-sm text-gray-600">Pending ({stats.totalTasks - stats.tasksCompleted})</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              No tasks assigned yet
            </div>
          )}
        </div>
      </div>

      <TherapistBottomNav />
    </div>
  );
}
