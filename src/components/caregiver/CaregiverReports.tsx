import { useState, useEffect } from 'react';
import { CaregiverBottomNav } from '../shared/CaregiverBottomNav';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, CheckCircle, Clock, BarChart3, Heart } from 'lucide-react';
import { api } from '../../services/api';
import '../../styles/caregiver-background.css';

export function CaregiverReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const [taskCompletionData, setTaskCompletionData] = useState<any[]>([]);
  const [patientProgressData, setPatientProgressData] = useState<any[]>([]);
  const [taskTypeData, setTaskTypeData] = useState<any[]>([]);
  const [verificationStats, setVerificationStats] = useState<any[]>([
    { icon: CheckCircle, label: 'Tasks Verified', value: '0', change: '+0%', color: 'from-[#a8d8d8] to-[#9bc5c5]' },
    { icon: Clock, label: 'Avg Response Time', value: 'N/A', change: '0%', color: 'from-[#d4b5d4] to-[#b8a0b8]' },
    { icon: BarChart3, label: 'Completion Rate', value: '0%', change: '+0%', color: 'from-[#c4b5e6] to-[#b8a8d9]' },
    { icon: Heart, label: 'Patient Satisfaction', value: 'N/A', change: '0', color: 'from-[#e6d4a8] to-[#d9c79a]' },
  ]);

  useEffect(() => {
    const fetchReports = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        api.caregiver.getReports(user.id).then(data => {
          if (data.taskCompletionData) setTaskCompletionData(data.taskCompletionData);
          if (data.patientProgressData) setPatientProgressData(data.patientProgressData);
          if (data.taskTypeData) setTaskTypeData(data.taskTypeData);
          if (data.verificationStats) {
            // Map icons back
            const mappedStats = data.verificationStats.map((s: any) => ({
              ...s,
              icon: s.label === 'Tasks Verified' ? CheckCircle :
                s.label === 'Completion Rate' ? BarChart3 :
                  s.label.includes('Patients') ? Heart : Clock // Simplified mapping
            }));
            setVerificationStats(mappedStats);
          }
        }).catch(console.error);
      }
    };

    fetchReports();
  }, [selectedPeriod]);

  return (
    <div className="min-h-screen caregiver-reports-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#d4b5d4]">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-black mb-4 flex items-center gap-2">
            Progress Reports <TrendingUp className="w-8 h-8 text-[#d4b5d4]" />
          </h1>

          {/* Period Selector */}
          <div className="flex gap-2">
            {['week', 'month', 'quarter'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${selectedPeriod === period
                  ? 'bg-[#d4b5d4] text-black shadow-md'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {verificationStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-3xl p-5 shadow-lg border-2 border-gray-200">
                <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${stat.color} mb-3 shadow-md`}>
                  <Icon className="w-8 h-8 text-black" strokeWidth={2.5} />
                  <div className="flex flex-col text-black">
                    <span className="text-xl font-bold">{stat.value}</span>
                    <span className="text-xs">{stat.change}</span>
                  </div>
                </div>
                <p className="text-sm text-black font-bold">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Task Completion Trend */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-black font-semibold">Task Completion Trend</h3>
            <div className="flex items-center gap-2 text-sm text-black">
              <Calendar className="w-4 h-4" />
              <span>Last 7 days</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taskCompletionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fill: '#666' }} />
              <YAxis tick={{ fill: '#666' }} />
              <Tooltip />
              <Bar dataKey="completed" fill="#ff6b9d" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" fill="#fecfef" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>



        {/* Task Distribution */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-200">
          <h3 className="text-black font-semibold mb-4">Task Type Distribution</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={taskTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {taskTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {taskTypeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-black">{item.name}</span>
                  <span className="text-sm font-semibold text-black">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total Tasks Completed */}
        <div className="bg-white rounded-3xl p-6 shadow-xl text-center border-2 border-gray-200">
          <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2 text-black">
            <CheckCircle className="w-6 h-6 text-black" />
            Total Tasks Verified
          </h3>
          <p className="text-4xl font-bold mb-2 text-black">{verificationStats.find(s => s.label === 'Tasks Verified')?.value || '0'}</p>
          <p className="text-black text-sm">Overall</p>
        </div>
      </div>

      <CaregiverBottomNav />
    </div>
  );
}