import { useNavigate } from 'react-router-dom';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { Calendar, Users, ClipboardList, UserPlus, Activity, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';

export function TherapistHome() {
  const navigate = useNavigate();

  const [user, setUser] = useState<any>({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const quickActions = [
    { icon: Calendar, label: 'Schedule ADL', path: '/therapist/schedule-adl', color: 'from-[#6328FF] to-[#9E98ED]' },
    { icon: ClipboardList, label: 'View Tasks', path: '/therapist/tasks', color: 'from-[#9E98ED] to-[#FE97CF]' },
    { icon: Users, label: 'View Patients', path: '/therapist/patients', color: 'from-[#C2D738] to-[#EAFCFF]' },
    { icon: UserPlus, label: 'Add New Patient', path: '/therapist/add-patient', color: 'from-[#FE97CF] to-[#FE5C2B]' },
    { icon: Activity, label: 'Patient Logs', path: '/therapist/logs', color: 'from-[#FE5C2B] to-[#C2D738]' },
    { icon: DollarSign, label: 'Billing Details', path: '/therapist/billing', color: 'from-[#EAFCFF] to-[#6328FF]' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6328FF] to-[#9E98ED] text-white p-6 rounded-b-3xl shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }}>Welcome Therapist</h1>
          <p className="text-[#EAFCFF]">{user.name || 'Therapist'}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl mb-4 text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3 border border-gray-100"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm text-center text-gray-700">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <TherapistBottomNav />
    </div>
  );
}
