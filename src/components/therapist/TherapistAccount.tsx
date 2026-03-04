import { useNavigate } from 'react-router-dom';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ChevronRight, User, Bell, Lock, HelpCircle, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export function TherapistAccount() {
  const navigate = useNavigate();

  const [user, setUser] = useState<any>({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const menuItems = [
    { icon: User, label: 'Profile Information', path: '/therapist/profile' },
    { icon: Bell, label: 'Notifications', path: '/therapist/notifications' },
    { icon: Lock, label: 'Privacy & Security', path: '#' },
    { icon: HelpCircle, label: 'Help & Support', path: '#' },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">Account</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 bg-gradient-to-br from-[#6328FF] to-[#9E98ED]">
              <AvatarFallback className="text-white text-2xl">{user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'T'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl text-gray-800">{user.name || 'Therapist'}</h2>
              <p className="text-sm text-gray-500">Occupational Therapist</p>
              <p className="text-sm text-gray-500">ID: {user.id?.substring(0, 8) || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => item.path !== '#' && navigate(item.path)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <span className="flex-1 text-left text-gray-700">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:bg-red-50 transition-colors flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <span className="flex-1 text-left text-red-600">Logout</span>
        </button>
      </div>

      <TherapistBottomNav />
    </div>
  );
}
