import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { ArrowLeft, Copy } from 'lucide-react';
import { api } from '../../services/api';

export function AddPatient() {
  const navigate = useNavigate();
  const [generatedCode, setGeneratedCode] = useState<{ code: string, expires_at: string } | null>(null);

  const handleGenerateCode = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const data = await api.therapist.generateLinkageCode(user.id);
      setGeneratedCode(data);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
      alert('Code copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/therapist/home')}
            className="flex items-center gap-2 text-gray-600 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">Add Patient</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Generate a unique access code for your patient or caregiver.
              They will use this code during registration to link their account to you.
            </p>

            {!generatedCode ? (
              <Button
                onClick={handleGenerateCode}
                className="w-full bg-[#C2D738] hover:bg-[#b3c733] text-black font-bold h-12"
              >
                GENERATE ACCESS CODE
              </Button>
            ) : (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                <Label>Your Access Code</Label>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-3xl font-mono font-bold text-[#6328FF] tracking-wider">{generatedCode.code}</span>
                  <button onClick={copyToClipboard} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <Copy className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-red-500">
                  Expires in {(() => {
                    const diff = new Date(generatedCode.expires_at).getTime() - Date.now();
                    const mins = Math.max(0, Math.round(diff / 60000));
                    if (mins >= 60) {
                      const hrs = Math.floor(mins / 60);
                      const remaining = mins % 60;
                      return `${hrs}h ${remaining}m`;
                    }
                    return `${mins} mins`;
                  })()}
                </p>
                <Button
                  onClick={() => setGeneratedCode(null)}
                  variant="outline"
                  className="mt-4"
                >
                  Generate New Code
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <TherapistBottomNav />
    </div>
  );
}
