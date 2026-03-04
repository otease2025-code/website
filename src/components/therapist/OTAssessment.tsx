import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OTAssessment() {
  const navigate = useNavigate();

  const assessmentTools = [
    'Beck Depression Inventory',
    'HAM-A (Hamilton Anxiety Rating Scale)',
    'MMSE (Mini-Mental State Examination)',
    'C-SSRS (Columbia Suicide Severity Rating Scale)',
  ];

  const shortTermGoals = [
    'Improve daily self-care routines within 2 weeks',
    'Reduce anxiety symptoms through mindfulness practice',
    'Establish consistent sleep schedule',
    'Participate in group therapy sessions',
  ];

  const longTermGoals = [
    {
      title: 'Independent Living Skills',
      description: 'Achieve complete independence in ADL activities within 12 weeks',
    },
    {
      title: 'Social Integration',
      description: 'Engage in community activities and maintain healthy relationships',
    },
    {
      title: 'Vocational Readiness',
      description: 'Develop skills necessary for return to work or meaningful occupation',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">OT Assessment</h1>
          <p className="text-sm text-gray-500 mt-1">Patient: Aarohi Shirke</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Cognitive Assessment */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#6328FF]" />
            <h3 className="text-gray-800">Cognitive Assessment</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">Tools & Scales Used:</p>
            {assessmentTools.map((tool, index) => (
              <div key={index} className="flex items-start gap-2 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6328FF] mt-2" />
                <span className="text-sm text-gray-700">{tool}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up Banner */}
        <div className="bg-gradient-to-r from-[#6328FF] to-[#9E98ED] rounded-xl p-4 text-black">
          <p className="text-sm">Follow-up assessment scheduled for Nov 5, 2025</p>
        </div>


        {/* Short Term Goals */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-800 mb-4">Short Term Goals (1-4 weeks)</h3>
          <div className="space-y-3">
            {shortTermGoals.map((goal, index) => (
              <div key={index} className="flex items-start gap-3 py-2">
                <div className="w-6 h-6 rounded-full bg-[#C2D738]/20 text-[#C2D738] flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">
                  {index + 1}
                </div>
                <span className="text-sm text-gray-700">{goal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Long Term Goals */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-800 mb-4">Long Term Goals (6-12 weeks)</h3>
          <div className="space-y-4">
            {longTermGoals.map((goal, index) => (
              <div key={index} className="border-l-4 border-[#9E98ED] pl-4 py-2">
                <h4 className="text-gray-800 mb-1">{goal.title}</h4>
                <p className="text-sm text-gray-600">{goal.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TherapistBottomNav />
    </div>
  );
}
