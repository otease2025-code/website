import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaregiverBottomNav } from '../shared/CaregiverBottomNav';
import { Search, User, Calendar, CheckCircle, Clock, AlertTriangle, Plus, X, Copy } from 'lucide-react';
import { Input } from '../ui/input';
import { api } from '../../services/api';
import '../../styles/caregiver-background.css';

export function CaregiverPatients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectionCode, setConnectionCode] = useState('');

  const handleConnect = async () => {
    if (connectionCode.length >= 6) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
          await api.caregiver.linkPatient(user.id, connectionCode);
          alert('Successfully connected to patient!');
          setShowConnectModal(false);
          setConnectionCode('');
          // Simple reload to refresh list
          window.location.reload();
        }
      } catch (error: any) {
        alert(error.message || 'Failed to connect to patient');
      }
    } else {
      alert('Please enter a valid connection code');
    }
  };

  const [patients, setPatients] = useState<any[]>([]);

  const [stats, setStats] = useState({
    completed: '0',
    pending: '0',
    overdue: '0'
  });

  useEffect(() => {
    const fetchPatients = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        api.caregiver.getPatients(user.id).then(setPatients).catch(console.error);
        api.caregiver.getDashboardStats(user.id).then(data => {
          // map api stats to local state
          const completed = data.stats.find((s: any) => s.label === 'Completed Tasks')?.value || '0';
          const pending = data.stats.find((s: any) => s.label === 'Pending Tasks')?.value || '0';
          const overdue = data.stats.find((s: any) => s.label === 'Overdue')?.value || '0';
          setStats({ completed, pending, overdue });
        }).catch(console.error);
      }
    };

    fetchPatients();
    const interval = setInterval(fetchPatients, 120000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if we should open connect modal from quick actions
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'connect') {
      setShowConnectModal(true);
      // Clean up URL without refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const filteredPatients = patients.filter(patient => {
    const name = patient.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  console.log('CaregiverPatients render:', { patients, filteredPatients, searchTerm });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'from-[#a8d8d8] to-[#9bc5c5]';
      case 'needs-attention': return 'from-[#e6d4a8] to-[#d9c79a]';
      case 'overdue': return 'from-[#e6b8a8] to-[#d9a89a]';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'needs-attention': return Clock;
      case 'overdue': return AlertTriangle;
      default: return User;
    }
  };

  return (
    <div className="min-h-screen caregiver-patients-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#d4b5d4]">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-black mb-4 flex items-center gap-2">
            My Patients <User className="w-8 h-8 text-[#d4b5d4]" />
          </h1>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowConnectModal(true)}
              className="flex-1 bg-[#d4b5d4] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#c4a5c4] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Connect New Patient
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
            >
              🔄
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-[#d4b5d4]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-[#a8d8d8] text-center">
            <div className="text-2xl font-bold text-[#6b9b9b]">{stats.completed}</div>
            <div className="text-sm text-black font-semibold">Completed</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-[#e6d4a8] text-center">
            <div className="text-2xl font-bold text-[#b8a67a]">{stats.pending}</div>
            <div className="text-sm text-black font-semibold">Pending</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-[#e6b8a8] text-center">
            <div className="text-2xl font-bold text-[#b8907a]">{stats.overdue}</div>
            <div className="text-sm text-black font-semibold">Overdue</div>
          </div>
        </div>

        {/* Patients List */}
        {filteredPatients.map((patient) => {
          const StatusIcon = getStatusIcon(patient.status);
          const completionRate = patient.totalTasks > 0 ? Math.round((patient.tasksCompleted / patient.totalTasks) * 100) : 0;

          return (
            <div
              key={patient.id}
              onClick={() => navigate(`/caregiver/patient-details/${patient.id}`)}
              className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] border-2 border-[#d4b5d4] cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getStatusColor(patient.status)} flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl">{patient.avatar}</span>
                </div>

                {/* Patient Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-black">{patient.name}</h3>
                    <StatusIcon className={`w-5 h-5 ${patient.status === 'active' ? 'text-[#6b9b9b]' :
                      patient.status === 'needs-attention' ? 'text-[#b8a67a]' : 'text-[#b8907a]'
                      }`} />
                  </div>
                  <p className="text-sm text-black mb-2">Age: {patient.age} • {patient.condition}</p>

                  {/* Therapist Name */}
                  {patient.therapist_name && (
                    <p className="text-xs text-gray-500 mb-2">
                      Therapist: <span className="font-semibold text-gray-700">{patient.therapist_name}</span>
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-black">Tasks Progress</span>
                        <span className="text-[#d4b5d4] font-semibold">{patient.tasksCompleted}/{patient.totalTasks}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getStatusColor(patient.status)} transition-all`}
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-black">{patient.lastActivity}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-black text-lg">No patients found</p>
          </div>
        )}
      </div>

      <CaregiverBottomNav />

      {/* Connection Code Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 w-screen h-screen bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-black">Connect Patient</h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="text-center space-y-6">
              <div className="bg-[#f8f9fa] p-8 rounded-2xl border-2 border-dashed border-[#d4b5d4]">
                <p className="text-sm text-gray-500 mb-4">Enter the code provided by the Therapist</p>
                <Input
                  value={connectionCode}
                  onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="text-center text-2xl tracking-widest font-mono uppercase h-14 rounded-xl border-2 border-[#d4b5d4] focus:border-[#b8a0b8] mb-4"
                />
              </div>

              <div className="text-left bg-blue-50 p-4 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-2">Instructions:</h4>
                <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                  <li>Ask the Patient to open "My Account" in their app</li>
                  <li>Enter the "Caregiver Linkage Code" displayed there</li>
                  <li>Tap Connect to link the patient</li>
                </ol>
              </div>

              <button
                onClick={handleConnect}
                className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}