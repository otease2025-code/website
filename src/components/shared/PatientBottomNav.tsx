import { Home, FileText, Compass, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function PatientBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/patient/home' },
    { icon: FileText, label: 'Report', path: '/patient/report' },
    { icon: Compass, label: 'Discover', path: '/patient/services' },
    { icon: User, label: 'Account', path: '/patient/account' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-[#a8b5ff] px-4 py-3 safe-area-bottom shadow-2xl">
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
                className={`w-7 h-7 ${isActive ? 'text-[#a8b5ff]' : 'text-black'}`}
              />
              <span className={`text-sm font-bold ${isActive ? 'text-[#a8b5ff]' : 'text-black'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
