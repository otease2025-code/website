import { useNavigate } from 'react-router-dom';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  ChevronRight, User, Bell, Lock, HelpCircle, LogOut, Settings,
  FileText, Receipt, ScrollText, BellRing, UserCircle, Shield,
  Smartphone, MessageCircleQuestion, CreditCard
} from 'lucide-react';
import { useState, useEffect } from 'react';
import '../../styles/patient-home-background.css';
import { api } from '../../services/api';

export function PatientAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>({});
  const [stats, setStats] = useState({ tasksCompleted: 0, totalTasks: 0 });
  const [caregiverCode, setCaregiverCode] = useState('');



  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    // Fetch task stats
    if (userData.id) {
      api.patient.getTasks(userData.id).then((tasks: any[]) => {
        const completed = tasks.filter(t => t.is_completed && t.verified_by_caregiver).length;
        setStats({ tasksCompleted: completed, totalTasks: tasks.length });
      }).catch(console.error);

      // Fetch caregiver code
      api.caregiver.getCaregiverCode(userData.id).then((data: any) => {
        setCaregiverCode(data.code);
      }).catch(console.error);
    }
  }, []);

  // Get initials from name or email
  const getInitials = () => {
    if (user.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email ? user.email[0].toUpperCase() : 'P';
  };

  interface MenuItem {
    icon: any;
    label: string;
    path?: string;
    action?: () => void;
    iconBg: string;
  }

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'My Activity',
      items: [
        { icon: ScrollText, label: 'My Logs', path: '/patient/logs', iconBg: '#9E98ED' },
        { icon: BellRing, label: 'Notifications', path: '/patient/notifications', iconBg: '#FE97CF' },
      ]
    },
    {
      title: 'Billing',
      items: [
        { icon: Receipt, label: 'My Bills', path: '/patient/billing', iconBg: '#C2D738' },
      ]
    },
    {
      title: 'Settings',
      items: [
        { icon: UserCircle, label: 'Profile Information', path: '#', iconBg: '#6328FF' },
        { icon: Bell, label: 'Notification Settings', path: '#', iconBg: '#FE5C2B' },
        { icon: Shield, label: 'Privacy & Security', path: '#', iconBg: '#00B8A9' },
        { icon: Smartphone, label: 'App Settings', path: '#', iconBg: '#9E98ED' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: MessageCircleQuestion, label: 'Help & Support', path: '#', iconBg: '#FF6B6B' },
      ]
    }
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout? 😢')) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/');
    }
  };

  const progressPercent = stats.totalTasks > 0 ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen patient-home-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold mb-1 text-black">My Account 👤</h1>
          <p className="text-black font-semibold text-lg">Manage your profile and settings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-lg border border-[#E8D9B5]">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 bg-[#9E98ED] shadow-lg">
              <AvatarFallback className="text-black text-2xl font-bold">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{user.name || user.email || 'Patient'}</h2>
              <p className="text-sm text-gray-600 font-medium">Patient</p>
              <p className="text-sm text-gray-600 font-medium">ID: {user.id?.substring(0, 8) || 'N/A'}</p>
            </div>
          </div>

          {/* Caregiver Linkage Code */}
          <div className="mt-6 pt-4 border-t border-[#E8D9B5]">
            <p className="text-sm text-gray-600 font-medium mb-2">Caregiver Linkage Code</p>
            <div className="bg-white p-3 rounded-xl border border-[#E8D9B5] flex justify-between items-center">
              <span className="text-2xl font-bold text-[#6328FF] tracking-widest font-mono">
                {caregiverCode || 'Loading...'}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Share this code
              </span>
            </div>
          </div>

        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#FFF8E7] rounded-2xl p-4 shadow-lg border border-[#E8D9B5] text-center">
            <div className="text-2xl font-bold mb-1 text-gray-800">{stats.tasksCompleted}</div>
            <div className="text-xs text-gray-600 font-medium">Tasks Done</div>
          </div>
          <div className="bg-[#FFF8E7] rounded-2xl p-4 shadow-lg border border-[#E8D9B5] text-center">
            <div className="text-2xl font-bold mb-1 text-gray-800">{stats.totalTasks}</div>
            <div className="text-xs text-gray-600 font-medium">Total Tasks</div>
          </div>
          <div className="bg-[#FFF8E7] rounded-2xl p-4 shadow-lg border border-[#E8D9B5] text-center">
            <div className="text-2xl font-bold mb-1 text-gray-800">{progressPercent}%</div>
            <div className="text-xs text-gray-600 font-medium">Progress</div>
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h3 className="text-sm text-gray-600 font-semibold mb-3 px-2">{section.title}</h3>
            <div className="bg-[#FFF8E7] rounded-3xl shadow-lg border border-[#E8D9B5] overflow-hidden">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else if (item.path && item.path !== '#') {
                        navigate(item.path);
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[#F5EED6] transition-colors border-b border-[#E8D9B5] last:border-0"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                      style={{ backgroundColor: item.iconBg }}
                    >
                      <Icon className="w-6 h-6 text-black" />
                    </div>
                    <span className="flex-1 text-left text-gray-800 font-medium">{item.label}</span>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-3xl p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-md">
            <LogOut className="w-6 h-6 text-black" />
          </div>
          <span className="flex-1 text-left text-red-600 font-medium">Logout</span>
        </button>
      </div>

      <PatientBottomNav />
    </div>
  );
}
