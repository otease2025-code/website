import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function SignUp() {
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT',
    linkageCode: '',
    specialization: '',
    licenseNumber: ''
  });

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        name: formData.username,
        linkage_code: formData.linkageCode,
        specialization: formData.specialization,
        license_number: formData.licenseNumber
      });

      alert('Account created successfully!');
      navigate('/login');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAFCFF] via-[#9E98ED]/20 to-[#FE97CF]/20 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-24 h-24 bg-[#FE97CF] rounded-full opacity-30 blur-2xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#C2D738] rounded-full opacity-30 blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6 border-2 border-[#6328FF]/10">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-[#2b2b2b]">Create an Account!</h2>
            <p className="text-[#2b2b2b]/60">Join us today</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-12 rounded-xl border-[#6328FF]/20 focus:border-[#6328FF] bg-[#EAFCFF]/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 rounded-xl border-[#6328FF]/20 focus:border-[#6328FF] bg-[#EAFCFF]/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 rounded-xl border-[#6328FF]/20 focus:border-[#6328FF] bg-[#EAFCFF]/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="h-12 rounded-xl border-[#6328FF]/20 focus:border-[#6328FF] bg-[#EAFCFF]/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-12 rounded-xl border-[#6328FF]/20 focus:border-[#6328FF] bg-[#EAFCFF]/30 px-3"
              >
                <option value="PATIENT">Patient</option>
                <option value="THERAPIST">Therapist</option>
                <option value="CAREGIVER">Caregiver</option>
              </select>
            </div>

            {formData.role === 'PATIENT' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="linkageCode">Linkage Code (from Therapist)</Label>
                <Input
                  id="linkageCode"
                  type="text"
                  placeholder="Enter 8-character code"
                  value={formData.linkageCode}
                  onChange={(e) => setFormData({ ...formData, linkageCode: e.target.value })}
                  className="h-12 rounded-xl border-[#6328FF]/20 focus:border-[#6328FF] bg-[#EAFCFF]/30"
                />
              </div>
            )}

            {formData.role === 'THERAPIST' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    type="text"
                    placeholder="e.g. Trauma, Anxiety, PTSD"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="h-12 rounded-xl border-[#6328FF]/20 focus:border-[#6328FF] bg-[#EAFCFF]/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    type="text"
                    placeholder="Enter your license number"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="h-12 rounded-xl border-[#6328FF]/20 focus:border-[#6328FF] bg-[#EAFCFF]/30"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleSignUp}
              className="w-full bg-gradient-to-r from-[#6328FF] to-[#9E98ED] hover:from-[#5520E6] hover:to-[#8A84D4] text-white h-12 rounded-xl font-medium"
            >
              SIGN UP
            </Button>
          </div>

          {/* Sign In Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-[#2b2b2b]/70">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-[#6328FF] hover:text-[#5520E6] font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
