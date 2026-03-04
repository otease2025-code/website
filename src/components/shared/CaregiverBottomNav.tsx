import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, CheckSquare, BarChart3, User } from 'lucide-react';

export function CaregiverBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/caregiver/home' },
    { icon: Users, label: 'Patients', path: '/caregiver/patients' },
    { icon: CheckSquare, label: 'Verify', path: '/caregiver/verify-tasks' },
    { icon: BarChart3, label: 'Reports', path: '/caregiver/reports' },
    { icon: User, label: 'Account', path: '/caregiver/account' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-[#d4b5d4] shadow-2xl">
      <div className="flex justify-around items-center py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-3 px-5 rounded-2xl transition-all transform ${
                isActive 
                  ? 'text-[#d4b5d4] bg-[#d4b5d4]/10 scale-110 shadow-xl' 
                  : 'text-black hover:text-[#d4b5d4] hover:bg-[#d4b5d4]/5 hover:scale-105'
              }`}
            >
              <Icon className={`w-7 h-7 mb-1 ${isActive ? 'text-[#d4b5d4]' : 'text-black'}`} strokeWidth={2.5} />
              <span className={`text-xs font-bold ${isActive ? 'text-[#d4b5d4]' : 'text-black'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}