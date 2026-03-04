import { useNavigate } from 'react-router-dom';
import { CaregiverBottomNav } from '../shared/CaregiverBottomNav';
import { Users, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import '../../styles/caregiver-background.css';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export function CaregiverHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any[]>([
    { icon: '👥', label: 'Patients', value: '0', color: 'from-[#d4b5d4] to-[#b8a0b8]' },
    { icon: '✅', label: 'Completed Tasks', value: '0', color: 'from-[#a8d8d8] to-[#9bc5c5]' },
    { icon: '⏰', label: 'Pending Tasks', value: '0', color: 'from-[#e6d4a8] to-[#d9c79a]' },
    { icon: '⚠️', label: 'Overdue', value: '0', color: 'from-[#e6b8a8] to-[#d9a89a]' },
  ]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [user, setUser] = useState<any>({});

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkCode, setLinkCode] = useState('');

  const handleLink = async () => {
    try {
      if (!user.id || !linkCode) return;
      await api.caregiver.linkPatient(user.id, linkCode.trim());
      alert('Successfully connected to patient!');
      setShowLinkInput(false);
      setLinkCode('');
      // Refresh stats
      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Failed to connect');
    }
  };

  useEffect(() => {
    const fetchStats = () => {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
      if (userData.id) {
        api.caregiver.getDashboardStats(userData.id).then(data => {
          if (data.stats) setStats(data.stats);
          if (data.recentActivities) setRecentActivities(data.recentActivities);
        }).catch(console.error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { icon: '👥', label: 'View Patients', path: '/caregiver/patients', color: 'from-[#d4b5d4] to-[#b8a0b8]' },
    { icon: '✅', label: 'Verify Tasks', path: '/caregiver/verify-tasks', color: 'from-[#a8d8d8] to-[#9bc5c5]' },
    { icon: '📊', label: 'Progress Reports', path: '/caregiver/reports', color: 'from-[#c4b5e6] to-[#b8a8d9]' },
    { icon: '➕', label: 'Add New Patient', path: '/caregiver/patients?action=connect', color: 'from-[#e6d4a8] to-[#d9c79a]' },
  ];

  return (
    <div className="min-h-screen caregiver-home-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#d4b5d4]">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-black mb-1">
            Welcome Back 👋
          </h1>
          <p className="text-black font-semibold text-lg">{user.name || user.email}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.filter(s => s.label !== 'Patients').map((stat) => (
            <div key={stat.label} className="bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-200">
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <span className="text-4xl font-black text-black">{stat.value}</span>
              </div>
              <p className="text-base text-black font-bold">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-200">
          <h3 className="text-black font-black mb-8 text-2xl">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-6">
            {quickActions.slice(0, 3).map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`bg-gradient-to-br ${action.color} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:scale-110 border-2 border-white/40 active:scale-95`}
              >
                <div className="w-20 h-20 mx-auto bg-white/40 rounded-3xl flex items-center justify-center shadow-xl mb-6 backdrop-blur-sm">
                  <span className="text-4xl">{action.icon}</span>
                </div>
                <p className="text-base text-center text-black font-black bg-white/80 px-3 py-1 rounded-xl shadow-md">{action.label}</p>
              </button>
            ))}

            {/* Inline Add Patient Action */}
            {!showLinkInput ? (
              <button
                onClick={() => setShowLinkInput(true)}
                className="bg-gradient-to-br from-[#e6d4a8] to-[#d9c79a] rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:scale-110 border-2 border-white/40 active:scale-95"
              >
                <div className="w-20 h-20 mx-auto bg-white/40 rounded-3xl flex items-center justify-center shadow-xl mb-6 backdrop-blur-sm">
                  <span className="text-4xl">➕</span>
                </div>
                <p className="text-base text-center text-black font-black bg-white/80 px-3 py-1 rounded-xl shadow-md">Add New Patient</p>
              </button>
            ) : (
              <div className="bg-gradient-to-br from-[#e6d4a8] to-[#d9c79a] rounded-3xl p-4 shadow-xl border-2 border-white/40 flex flex-col justify-center items-center space-y-3 animate-in fade-in zoom-in duration-200">
                <p className="text-black font-bold text-sm">Enter 6-Char Patient Code</p>
                <input
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                  placeholder="6-CHAR CODE"
                  className="w-full p-3 rounded-xl text-center text-black font-black text-xl uppercase border-2 border-black/10 focus:border-black/30 bg-white/90"
                  autoFocus
                />
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => { setShowLinkInput(false); setLinkCode(''); }}
                    className="flex-1 bg-white/50 text-black py-2 rounded-xl font-bold text-sm hover:bg-white/70 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLink}
                    disabled={!linkCode}
                    className="flex-1 bg-[#C2D738] text-black py-2 rounded-xl font-bold text-sm hover:bg-[#b3c733] transition-colors disabled:opacity-50"
                  >
                    Connect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-200">
          <h3 className="text-black font-black mb-8 text-2xl">Recent Activities</h3>
          <div className="space-y-5">
            {recentActivities.map((activity, index) => (
              <div key={index} className={`flex items-center gap-6 p-6 rounded-3xl shadow-lg border-2 ${activity.status === 'completed' ? 'bg-gradient-to-r from-[#a8d8d8]/10 to-[#9bc5c5]/10 border-[#a8d8d8]/30' :
                activity.status === 'pending' ? 'bg-gradient-to-r from-[#e6d4a8]/10 to-[#d9c79a]/10 border-[#e6d4a8]/30' :
                  'bg-gradient-to-r from-[#e6b8a8]/10 to-[#d9a89a]/10 border-[#e6b8a8]/30'
                }`}>
                <div className={`w-6 h-6 rounded-full shadow-xl ${activity.status === 'completed' ? 'bg-[#a8d8d8]' :
                  activity.status === 'pending' ? 'bg-[#e6d4a8]' : 'bg-[#e6b8a8]'
                  }`} />
                <div className="flex-1">
                  <p className="text-black font-black text-lg">{activity.patient}</p>
                  <p className="text-black font-bold">{activity.task}</p>
                </div>
                <div className="text-right">
                  <p className={`text-base font-black capitalize ${activity.status === 'completed' ? 'text-[#6b9b9b]' :
                    activity.status === 'pending' ? 'text-[#b8a67a]' : 'text-[#b8907a]'
                    }`}>
                    {activity.status}
                  </p>
                  <p className="text-sm text-black font-bold">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>

      <CaregiverBottomNav />
    </div>
  );
}