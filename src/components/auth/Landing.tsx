import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Brain, Heart } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAFCFF] via-[#9E98ED]/20 to-[#FE97CF]/20 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-[#C2D738] rounded-full opacity-30 blur-2xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-[#FE97CF] rounded-full opacity-30 blur-3xl" />
      <div className="absolute top-1/3 right-20 w-24 h-24 bg-[#6328FF] rounded-full opacity-20 blur-2xl" />

      <div className="max-w-md w-full space-y-8 text-center relative z-10">
        {/* Meditation Illustration */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <img
              src="/src/assets/top.jpeg"
              alt="OT Ease"
              className="w-64 h-64 object-contain drop-shadow-lg"
            />
          </div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-5xl font-bold bg-gradient-to-r from-[#6328FF] to-[#9E98ED] bg-clip-text text-transparent">
            OT Ease
          </h1>
          <p className="text-[#2b2b2b]/80 text-base">
            Empower your mind, elevate your life
          </p>
        </div>

        {/* Taglines */}
        <div className="flex gap-3 justify-center flex-wrap">
          <span className="px-4 py-2 bg-[#6328FF]/10 text-[#6328FF] rounded-full text-sm font-medium">
            Mental Wellness
          </span>
          <span className="px-4 py-2 bg-[#C2D738]/20 text-[#161e29] rounded-full text-sm font-medium">
            OT Innovation
          </span>
        </div>

        {/* Sign In Button */}
        <div className="pt-4 space-y-4">
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-[#6328FF] to-[#9E98ED] hover:from-[#5520E6] hover:to-[#8A84D4] text-white h-12 rounded-2xl font-medium"
          >
            SIGN IN
          </Button>

          {/* Social Login */}
          <div className="space-y-3">
            <p className="text-sm text-[#2b2b2b]/60">Or continue with</p>
            <div className="flex gap-3">
              <button className="flex-1 border-2 border-[#6328FF]/20 rounded-2xl h-12 flex items-center justify-center gap-2 hover:bg-[#6328FF]/5 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-medium">Google</span>
              </button>
              <button className="flex-1 border-2 border-[#6328FF]/20 rounded-2xl h-12 flex items-center justify-center gap-2 hover:bg-[#6328FF]/5 transition-colors">
                <svg className="w-5 h-5" fill="2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-sm font-medium">Facebook</span>
              </button>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-sm text-[#2b2b2b]/70 font-medium">
            DIDN'T HAVE ACCOUNT?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-[#6328FF] hover:text-[#5520E6] font-semibold"
            >
              SIGN UP NOW
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
