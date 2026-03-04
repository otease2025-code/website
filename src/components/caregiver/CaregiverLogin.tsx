import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Shield, Heart, LogIn, Stethoscope } from 'lucide-react';
import '../../styles/caregiver-background.css';

export function CaregiverLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in real app, validate credentials
    navigate('/caregiver/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ff6b9d] via-[#c44569] to-[#f8b500] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-[#c4b5e6]">
            <Stethoscope className="w-12 h-12 text-[#c4b5e6]" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Caregiver Portal</h1>
          <p className="text-black font-medium">Monitor and support patient care</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#d4b5d4]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#d4b5d4]"
                required
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#7C3AED',
                color: 'white',
                fontWeight: '700',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                fontSize: '16px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6D28D9';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#7C3AED';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Sign In as Caregiver
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: 'white',
                color: '#7C3AED',
                fontWeight: '700',
                borderRadius: '12px',
                border: '2px solid #7C3AED',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                fontSize: '16px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7C3AED';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#7C3AED';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Back to Main Login
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 bg-white/70 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#d4b5d4]" />
            Caregiver Features
          </h3>
          <ul className="space-y-2 text-sm text-black">
            <li>• Monitor patient task completion</li>
            <li>• Verify daily activities</li>
            <li>• Track patient progress</li>
            <li>• Communicate with therapists</li>
          </ul>
        </div>
      </div>
    </div>
  );
}