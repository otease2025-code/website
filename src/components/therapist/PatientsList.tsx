import { useNavigate } from 'react-router-dom';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ChevronRight, Loader2, Image, Video, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, API_SERVER_URL } from '../../services/api';

interface PatientProgress {
  total_tasks: number;
  completed: number;
  verified: number;
  completion_rate: number;
  verified_media: {
    id: string;
    task_title: string;
    file_name: string;
    file_type: string;
    file_url: string;
    created_at: string;
  }[];
}

export function PatientsList() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState<Record<string, PatientProgress>>({});

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
          const data = await api.therapist.getPatients(user.id);
          setPatients(data);

          // Fetch progress for each patient
          const progressEntries: Record<string, PatientProgress> = {};
          await Promise.all(
            data.map(async (patient: any) => {
              try {
                const progress = await api.therapist.getPatientProgress(patient.id);
                progressEntries[patient.id] = progress;
              } catch (err) {
                console.error(`Failed to fetch progress for ${patient.id}:`, err);
              }
            })
          );
          setProgressMap(progressEntries);
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Helper to get initials from name or email
  const getInitials = (patient: any) => {
    if (patient.name) {
      return patient.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    if (patient.email) {
      return patient.email.substring(0, 2).toUpperCase();
    }
    return 'P';
  };

  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6328FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">Your Patients List</h1>
          <p className="text-sm text-gray-500 mt-1">{patients.length} active patients</p>
        </div>
      </div>

      {/* Patients List */}
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {patients.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 text-lg mb-2">No patients linked yet</p>
            <p className="text-gray-400 text-sm">Share your linkage code with patients to connect them to your practice.</p>
          </div>
        ) : (
          patients.map((patient) => {
            const progress = progressMap[patient.id];
            return (
              <div
                key={patient.id}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all border border-gray-100"
              >
                {/* Patient Header */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-16 h-16 bg-gradient-to-br from-[#6328FF] to-[#9E98ED] flex-shrink-0">
                    <AvatarFallback className="text-white text-lg font-bold">
                      {getInitials(patient)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{patient.name || patient.email}</h3>
                        <p className="text-sm text-gray-500">ID: {patient.id?.substring(0, 8)}...</p>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-800 truncate" title={patient.email}>{patient.email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Caregivers</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {patient.caregivers && patient.caregivers.length > 0
                        ? patient.caregivers.join(', ')
                        : 'None'}
                    </p>
                  </div>
                </div>

                {/* Progress Section */}
                {progress && (
                  <div className="mb-4 space-y-3">
                    {/* Progress Bar */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-700">📊 Progress</p>
                        <span className="text-sm font-bold text-[#6328FF]">{progress.completion_rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                        <div
                          className="bg-gradient-to-r from-[#6328FF] to-[#9E98ED] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress.completion_rate}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-800">{progress.total_tasks}</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{progress.completed}</p>
                          <p className="text-xs text-gray-500">Done</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-[#6328FF]">{progress.verified}</p>
                          <p className="text-xs text-gray-500">Verified</p>
                        </div>
                      </div>
                    </div>

                    {/* Verified Media */}
                    {progress.verified_media.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-bold text-gray-700">Caregiver Verified Media</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {progress.verified_media.map((media) => (
                            <a
                              key={media.id}
                              href={`${API_SERVER_URL}${media.file_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative rounded-lg overflow-hidden bg-white border border-green-200 shadow-sm group cursor-pointer hover:shadow-md hover:border-green-400 transition-all block"
                              title={`Click to view: ${media.task_title}`}
                            >
                              {media.file_type === 'image' ? (
                                <img
                                  src={`${API_SERVER_URL}${media.file_url}`}
                                  alt={media.task_title}
                                  className="w-full h-20 object-cover"
                                />
                              ) : (
                                <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
                                  <Video className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                                <p className="text-[10px] text-white truncate">{media.task_title}</p>
                              </div>
                              <div className="absolute top-1 right-1">
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => navigate(`/therapist/patient-details/${patient.id}`)}
                  className="w-full bg-gradient-to-r from-[#6328FF] to-[#9E98ED] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  View Full Details
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <TherapistBottomNav />
    </div>
  );
}
