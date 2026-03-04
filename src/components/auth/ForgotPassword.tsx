import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleReset = () => {
    // Mock password reset
    alert('Password reset link sent to your email!');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAFCFF] via-[#9E98ED]/20 to-[#FE97CF]/20 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-20 w-32 h-32 bg-[#6328FF] rounded-full opacity-20 blur-3xl" />
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-[#C2D738] rounded-full opacity-30 blur-2xl" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6 border-2 border-[#6328FF]/10">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-[#2b2b2b]">Forgot Password</h2>
            <p className="text-[#2b2b2b]/60">Enter your email to reset password</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-[#6328FF]/20 focus:border-[#6328FF] bg-[#EAFCFF]/30"
              />
            </div>

            <Button
              onClick={handleReset}
              className="w-full bg-gradient-to-r from-[#6328FF] to-[#9E98ED] hover:from-[#5520E6] hover:to-[#8A84D4] text-white h-12 rounded-xl font-medium"
            >
              RESET PASSWORD
            </Button>
          </div>

          {/* Back to Sign In */}
          <div className="text-center pt-4">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-sm text-[#6328FF] hover:text-[#5520E6] font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Signin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
