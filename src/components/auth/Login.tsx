import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Shield, Heart, Stethoscope } from 'lucide-react';
import '../../styles/login-background.css';

export function Login() {
  const navigate = useNavigate();

  // Separate state for each form to keep them distinct as requested
  const [patientCreds, setPatientCreds] = useState({ email: '', password: '', remember: false });
  const [therapistCreds, setTherapistCreds] = useState({ email: '', password: '', remember: false });
  const [caregiverCreds, setCaregiverCreds] = useState({ email: '', password: '', remember: false });



  const handleLogin = async (role: 'therapist' | 'patient' | 'caregiver', e: React.FormEvent) => {
    e.preventDefault();
    try {
      let creds;
      if (role === 'therapist') creds = therapistCreds;
      else if (role === 'patient') creds = patientCreds;
      else creds = caregiverCreds;

      const response = await authService.login({
        email: creds.email,
        password: creds.password
      });

      // Strict Role Check
      if (response.user.role !== role.toUpperCase()) {
        alert(`Access Denied: This account is registered as a ${response.user.role}. Please log in through the ${response.user.role.charAt(0) + response.user.role.slice(1).toLowerCase()} tab.`);
        return;
      }

      // Store token and user info
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      if (role === 'therapist') {
        navigate('/therapist/home');
      } else if (role === 'patient') {
        navigate('/patient/home');
      } else {
        navigate('/caregiver/home');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const [activeTab, setActiveTab] = useState('patient');

  const getHeadingColor = () => {
    switch (activeTab) {
      case 'patient': return '#FE5C2B';
      case 'therapist': return '#6328FF';
      case 'caregiver': return '#7C3AED';
      default: return '#2b2b2b';
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative login-bg-image">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6328FF]/20 via-transparent to-[#FE97CF]/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <p className="text-xl drop-shadow-md">
              Supporting recovery through connection and compassion
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#EAFCFF] via-[#9E98ED]/20 to-[#FE97CF]/20 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-24 h-24 bg-[#C2D738] rounded-full opacity-30 blur-2xl" />
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-[#6328FF] rounded-full opacity-20 blur-3xl" />

        <div className="max-w-md w-full relative z-10">
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6 border-2 border-[#6328FF]/10">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 style={{ fontFamily: 'Oxanium, sans-serif', color: getHeadingColor() }} className="text-3xl font-bold transition-colors duration-300">Welcome Back!</h2>
              <p className="text-[#2b2b2b]/60">Sign in to continue</p>
            </div>

            <Tabs defaultValue="patient" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100/50 p-1 rounded-xl">
                <TabsTrigger value="patient" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#6328FF] data-[state=active]:shadow-sm font-semibold">Patient</TabsTrigger>
                <TabsTrigger value="therapist" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#6328FF] data-[state=active]:shadow-sm font-semibold">Therapist</TabsTrigger>
                <TabsTrigger value="caregiver" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#6328FF] data-[state=active]:shadow-sm font-semibold">Caregiver</TabsTrigger>
              </TabsList>

              {/* PATIENT LOGIN */}
              <TabsContent value="patient">
                <form onSubmit={(e) => handleLogin('patient', e)} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="p-email">Email Address</Label>
                    <Input
                      id="p-email"
                      type="email"
                      placeholder="patient@example.com"
                      value={patientCreds.email}
                      onChange={(e) => setPatientCreds({ ...patientCreds, email: e.target.value })}
                      className="h-12 rounded-xl border-[#FE5C2B]/20 focus:border-[#FE5C2B] bg-[#EAFCFF]/30"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-password">Password</Label>
                    <Input
                      id="p-password"
                      type="password"
                      placeholder="Enter password"
                      value={patientCreds.password}
                      onChange={(e) => setPatientCreds({ ...patientCreds, password: e.target.value })}
                      className="h-12 rounded-xl border-[#FE5C2B]/20 focus:border-[#FE5C2B] bg-[#EAFCFF]/30"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="p-remember"
                        checked={patientCreds.remember}
                        onCheckedChange={(checked) => setPatientCreds({ ...patientCreds, remember: checked as boolean })}
                      />
                      <label htmlFor="p-remember" className="text-sm text-[#2b2b2b]/70">Remember me</label>
                    </div>
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-[#FE5C2B] hover:underline">Forgot Password?</button>
                  </div>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      height: '48px',
                      background: 'linear-gradient(135deg, #FE97CF 0%, #FE5C2B 100%)',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '16px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textTransform: 'uppercase',
                      outline: 'none'
                    }}
                    className="hover:opacity-90 transform hover:scale-[1.02] transition-all"
                  >
                    LOG IN AS PATIENT
                  </button>
                </form>
              </TabsContent>

              {/* THERAPIST LOGIN */}
              <TabsContent value="therapist">
                <form onSubmit={(e) => handleLogin('therapist', e)} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="t-email">Email Address</Label>
                    <Input
                      id="t-email"
                      type="email"
                      placeholder="therapist@example.com"
                      value={therapistCreds.email}
                      onChange={(e) => setTherapistCreds({ ...therapistCreds, email: e.target.value })}
                      className="h-12 rounded-xl border-[#6328FF]/20 focus:border-[#6328FF] bg-[#EAFCFF]/30"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-password">Password</Label>
                    <Input
                      id="t-password"
                      type="password"
                      placeholder="Enter password"
                      value={therapistCreds.password}
                      onChange={(e) => setTherapistCreds({ ...therapistCreds, password: e.target.value })}
                      className="h-12 rounded-xl border-[#6328FF]/20 focus:border-[#6328FF] bg-[#EAFCFF]/30"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="t-remember"
                        checked={therapistCreds.remember}
                        onCheckedChange={(checked) => setTherapistCreds({ ...therapistCreds, remember: checked as boolean })}
                      />
                      <label htmlFor="t-remember" className="text-sm text-[#2b2b2b]/70">Remember me</label>
                    </div>
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-[#6328FF] hover:underline">Forgot Password?</button>
                  </div>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      height: '48px',
                      background: 'linear-gradient(135deg, #6328FF 0%, #9E98ED 100%)',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '16px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textTransform: 'uppercase',
                      outline: 'none'
                    }}
                    className="hover:opacity-90 transform hover:scale-[1.02] transition-all"
                  >
                    LOG IN AS THERAPIST
                  </button>
                </form>
              </TabsContent>

              {/* CAREGIVER LOGIN */}
              <TabsContent value="caregiver">
                <form onSubmit={(e) => handleLogin('caregiver', e)} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="c-email">Email Address</Label>
                    <Input
                      id="c-email"
                      type="email"
                      placeholder="caregiver@example.com"
                      value={caregiverCreds.email}
                      onChange={(e) => setCaregiverCreds({ ...caregiverCreds, email: e.target.value })}
                      className="h-12 rounded-xl border-[#7C3AED]/20 focus:border-[#7C3AED] bg-[#EAFCFF]/30"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-password">Password</Label>
                    <Input
                      id="c-password"
                      type="password"
                      placeholder="Enter password"
                      value={caregiverCreds.password}
                      onChange={(e) => setCaregiverCreds({ ...caregiverCreds, password: e.target.value })}
                      className="h-12 rounded-xl border-[#7C3AED]/20 focus:border-[#7C3AED] bg-[#EAFCFF]/30"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="c-remember"
                        checked={caregiverCreds.remember}
                        onCheckedChange={(checked) => setCaregiverCreds({ ...caregiverCreds, remember: checked as boolean })}
                      />
                      <label htmlFor="c-remember" className="text-sm text-[#2b2b2b]/70">Remember me</label>
                    </div>
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-[#7C3AED] hover:underline">Forgot Password?</button>
                  </div>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      height: '48px',
                      backgroundColor: '#7C3AED',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '16px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textTransform: 'uppercase',
                      outline: 'none',
                      boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)'
                    }}
                    className="hover:bg-[#6D28D9] transform hover:scale-[1.02] transition-all"
                  >
                    LOG IN AS CAREGIVER
                  </button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Sign Up Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-[#2b2b2b]/70">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="text-[#6328FF] hover:text-[#5520E6] font-semibold"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
