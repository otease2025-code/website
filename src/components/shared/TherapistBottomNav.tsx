import { Home, FileText, User, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function TherapistBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/therapist/home' },
    { icon: FileText, label: 'Report', path: '/therapist/report' },
    { icon: User, label: 'Account', path: '/therapist/account' },
    { icon: Calendar, label: 'Schedule', path: '/therapist/schedule' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
      <div className="flex justify-around items-center max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-3 py-2 transition-colors"
            >
              <Icon 
                className={`w-6 h-6 ${isActive ? 'text-[#6328FF]' : 'text-gray-400'}`}
              />
              <span className={`text-xs ${isActive ? 'text-[#6328FF]' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
