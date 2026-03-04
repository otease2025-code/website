import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { Music, Activity, Brain, Heart, Gamepad2, Wind } from 'lucide-react';

export function TherapistServices() {
  const services = [
    { icon: Music, label: 'Calming Music', color: 'from-[#6328FF] to-[#9E98ED]', bgColor: 'bg-blue-50' },
    { icon: Activity, label: 'Yoga', color: 'from-[#9E98ED] to-[#FE97CF]', bgColor: 'bg-purple-50' },
    { icon: Brain, label: 'Meditation', color: 'from-[#C2D738] to-[#EAFCFF]', bgColor: 'bg-green-50' },
    { icon: Heart, label: 'Mindfulness', color: 'from-[#FE97CF] to-[#FE5C2B]', bgColor: 'bg-pink-50' },
    { icon: Gamepad2, label: 'Leisure Engagement', color: 'from-[#FE5C2B] to-[#C2D738]', bgColor: 'bg-orange-50' },
    { icon: Wind, label: 'Deep Breathing', color: 'from-[#6328FF] to-[#EAFCFF]', bgColor: 'bg-cyan-50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">Services</h1>
          <p className="text-sm text-gray-500 mt-1">Therapeutic interventions & activities</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-2 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.label}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col items-center gap-3"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm text-center text-gray-700">{service.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <TherapistBottomNav />
    </div>
  );
}
