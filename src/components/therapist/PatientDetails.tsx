import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ArrowLeft, Edit2, Save, Loader2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, API_SERVER_URL } from '../../services/api';

interface PatientData {
  id: string;
  name: string;
  email: string;
  therapist_id: string;
  createdAt?: string;
  // Extended profile fields - these are entered by therapist
  demographic?: {
    age_sex?: string;
    hospital_no?: string;
    marital_status?: string;
    language?: string;
    education?: string;
    occupation?: string;
    diagnosis?: string;
    admission_date?: string;
    assessment_date?: string;
    informant?: string;
    reliability?: string;
  };
  chief_complaints?: {
    subjective?: string;
    objective?: string;
    duration?: string;
  };
  treatment_goals?: {
    short_term?: string;
    long_term?: string;
  };
  caregiver?: {
    name?: string;
    relationship?: string;
    contact?: string;
  };
  caregiver_code?: string;
}

interface VitalEntry {
  id: string;
  date: string;
  blood_pressure: string;
  heart_rate: string;
  temperature: string;
  oxygen: string;
  weight: string;
  blood_sugar: string;
  updated_by?: string;
}

interface BillEntry {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending';
}

export function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [user, setUser] = useState<any>({});
  const [activeTab, setActiveTab] = useState('demographic');
  const [vitals, setVitals] = useState<VitalEntry[]>([]);
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Today's date in IST for max date constraint
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  // Form state for demographic data (therapist can edit)
  const [demographicForm, setDemographicForm] = useState({
    name: '',
    age_sex: '',
    hospital_no: '',
    marital_status: '',
    language: '',
    education: '',
    occupation: '',
    diagnosis: '',
    admission_date: '',
    assessment_date: '',
    informant: '',
    reliability: 'Reliable',
  });

  const [complaintsForm, setComplaintsForm] = useState({
    subjective: '',
    objective: '',
    duration: '',
  });

  const [goalsForm, setGoalsForm] = useState({
    short_term: '',
    long_term: '',
  });

  const [problemForm, setProblemForm] = useState({
    problem_statement: '',
    underlying_causes: '',
    smart_goal_1: '', smart_goal_1_sub: '',
    smart_goal_2: '', smart_goal_2_sub: '',
    smart_goal_3: '', smart_goal_3_sub: '',
    treatment_approaches: '',
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        // Fetch patient from the therapist's patient list
        // Fetch patient from the therapist's patient list
        const patients = await api.therapist.getPatients(user.id);
        const foundPatient = patients.find((p: any) => p.id === id);

        if (foundPatient) {
          setPatient(foundPatient);
          setDemographicForm(prev => ({
            ...prev,
            name: foundPatient.name || '',
          }));
        }

        // Fetch saved clinical profile
        try {
          const profile = await api.therapist.getPatientProfile(id);
          if (profile && profile.patient_id) {
            setDemographicForm(prev => ({
              ...prev,
              age_sex: profile.age_sex || '',
              hospital_no: profile.hospital_no || '',
              marital_status: profile.marital_status || '',
              language: profile.language || '',
              education: profile.education || '',
              occupation: profile.occupation || '',
              diagnosis: profile.diagnosis || '',
              admission_date: profile.admission_date || '',
              assessment_date: profile.assessment_date || '',
              informant: profile.informant || '',
              reliability: profile.reliability || 'Reliable',
            }));
            setComplaintsForm({
              subjective: profile.complaints_subjective || '',
              objective: profile.complaints_objective || '',
              duration: profile.complaints_duration || '',
            });
            setGoalsForm({
              short_term: profile.goal_short_term || '',
              long_term: profile.goal_long_term || '',
            });
            setProblemForm({
              problem_statement: profile.problem_statement || '',
              underlying_causes: profile.underlying_causes || '',
              smart_goal_1: profile.smart_goal_1 || '',
              smart_goal_1_sub: profile.smart_goal_1_sub || '',
              smart_goal_2: profile.smart_goal_2 || '',
              smart_goal_2_sub: profile.smart_goal_2_sub || '',
              smart_goal_3: profile.smart_goal_3 || '',
              smart_goal_3_sub: profile.smart_goal_3_sub || '',
              treatment_approaches: profile.treatment_approaches || '',
            });
          }
        } catch (e) {
          // No profile yet — forms stay empty
        }

        // Fetch billing data
        try {
          const billingData = await api.patient.getBilling(id);
          if (billingData.bills) {
            setBills(billingData.bills);
          }
        } catch (e) {
          // No billing data yet
        }

        // Fetch Logs
        try {
          const logsData = await api.therapist.getPatientLogs(id);
          setLogs(logsData);
        } catch (e) {
          console.error("Failed to fetch logs", e);
        }

        // Fetch Tasks (Therapist View)
        try {
          const tasksData = await api.therapist.getPatientTasks(id);
          setTasks(tasksData);
        } catch (e) {
          console.error("Failed to fetch tasks", e);
        }

      } catch (error) {
        console.error('Failed to fetch patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  const [saving, setSaving] = useState(false);

  const handleSaveDemographic = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.therapist.savePatientProfile(id, {
        age_sex: demographicForm.age_sex,
        hospital_no: demographicForm.hospital_no,
        marital_status: demographicForm.marital_status,
        language: demographicForm.language,
        education: demographicForm.education,
        occupation: demographicForm.occupation,
        diagnosis: demographicForm.diagnosis,
        admission_date: demographicForm.admission_date,
        assessment_date: demographicForm.assessment_date,
        informant: demographicForm.informant,
        reliability: demographicForm.reliability,
      });
      alert('Demographic data saved!');
    } catch (e) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveComplaints = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.therapist.savePatientProfile(id, {
        complaints_subjective: complaintsForm.subjective,
        complaints_objective: complaintsForm.objective,
        complaints_duration: complaintsForm.duration,
      });
      alert('Chief complaints saved!');
    } catch (e) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGoals = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.therapist.savePatientProfile(id, {
        goal_short_term: goalsForm.short_term,
        goal_long_term: goalsForm.long_term,
      });
      alert('Treatment goals saved!');
    } catch (e) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClinical = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.therapist.savePatientProfile(id, {
        problem_statement: problemForm.problem_statement,
        underlying_causes: problemForm.underlying_causes,
        smart_goal_1: problemForm.smart_goal_1,
        smart_goal_1_sub: problemForm.smart_goal_1_sub,
        smart_goal_2: problemForm.smart_goal_2,
        smart_goal_2_sub: problemForm.smart_goal_2_sub,
        smart_goal_3: problemForm.smart_goal_3,
        smart_goal_3_sub: problemForm.smart_goal_3_sub,
        treatment_approaches: problemForm.treatment_approaches,
      });
      alert('Clinical data saved!');
    } catch (e) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalBilled = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);
  const outstanding = totalBilled - totalPaid;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6328FF]" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
        <div className="bg-white border-b border-gray-200 p-6">
          <button onClick={() => navigate('/therapist/patients')} className="flex items-center gap-2 text-gray-600">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-500">Patient not found</p>
          </div>
        </div>
        <TherapistBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/therapist/patients')}
            className="flex items-center gap-2 text-gray-600 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">
            {patient.name || patient.email}
          </h1>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>Patient ID: {id?.substring(0, 8)}...</span>
            <span>Joined: {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="demographic">Demographic</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="caregiver">Caregiver</TabsTrigger>
            <TabsTrigger value="tasks">Tasks & Verification</TabsTrigger>
            <TabsTrigger value="logs">Logs & Journal</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
          </TabsList>

          <TabsContent value="demographic" className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-700 font-semibold mb-4">Demographic Data</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                    <input
                      type="text"
                      value={demographicForm.name}
                      onChange={(e) => setDemographicForm({ ...demographicForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Patient name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Age/Sex</label>
                    <input
                      type="text"
                      value={demographicForm.age_sex}
                      onChange={(e) => setDemographicForm({ ...demographicForm, age_sex: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g., 28 / Female"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Hospital No</label>
                    <input
                      type="text"
                      value={demographicForm.hospital_no}
                      onChange={(e) => setDemographicForm({ ...demographicForm, hospital_no: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Hospital number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Marital Status</label>
                    <input
                      type="text"
                      value={demographicForm.marital_status}
                      onChange={(e) => setDemographicForm({ ...demographicForm, marital_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g., Single, Married"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Language</label>
                    <input
                      type="text"
                      value={demographicForm.language}
                      onChange={(e) => setDemographicForm({ ...demographicForm, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g., English, Hindi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Education</label>
                    <input
                      type="text"
                      value={demographicForm.education}
                      onChange={(e) => setDemographicForm({ ...demographicForm, education: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Education level"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={demographicForm.occupation}
                      onChange={(e) => setDemographicForm({ ...demographicForm, occupation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Occupation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Diagnosis</label>
                    <input
                      type="text"
                      value={demographicForm.diagnosis}
                      onChange={(e) => setDemographicForm({ ...demographicForm, diagnosis: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Diagnosis"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date of Admission</label>
                    <input
                      type="date"
                      max={todayIST}
                      value={demographicForm.admission_date}
                      onChange={(e) => setDemographicForm({ ...demographicForm, admission_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date of Assessment</label>
                    <input
                      type="date"
                      max={todayIST}
                      value={demographicForm.assessment_date}
                      onChange={(e) => setDemographicForm({ ...demographicForm, assessment_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Informant</label>
                    <input
                      type="text"
                      value={demographicForm.informant}
                      onChange={(e) => setDemographicForm({ ...demographicForm, informant: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g., Parent name (Relationship)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Reliability</label>
                    <select
                      value={demographicForm.reliability}
                      onChange={(e) => setDemographicForm({ ...demographicForm, reliability: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option>Reliable</option>
                      <option>Partially Reliable</option>
                      <option>Unreliable</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSaveDemographic}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-black py-2 rounded-lg text-sm font-semibold mt-2"
                >
                  Save Demographic Data
                </button>
              </div>
            </div>

            {/* Chief Complaints */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-700 font-semibold mb-4">Chief Complaints</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Subjective (Patient's own words)
                  </label>
                  <textarea
                    placeholder="Record patient's own words about why they have come here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]"
                    value={complaintsForm.subjective}
                    onChange={(e) => setComplaintsForm({ ...complaintsForm, subjective: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Objective (Patient party's words, relationship, reliability)
                  </label>
                  <textarea
                    placeholder="Record informant's version, their relationship to patient..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]"
                    value={complaintsForm.objective}
                    onChange={(e) => setComplaintsForm({ ...complaintsForm, objective: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Duration of Presenting Complaints
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 3 months, 6 weeks, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={complaintsForm.duration}
                    onChange={(e) => setComplaintsForm({ ...complaintsForm, duration: e.target.value })}
                  />
                </div>

                <button
                  onClick={handleSaveComplaints}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-black py-2 rounded-lg text-sm font-semibold"
                >
                  Save Chief Complaints
                </button>
              </div>
            </div>

            {/* Problem Statement & Underlying Cause */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 text-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700">
                  Problem Statement and Its Underlying Cause
                </h3>
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                <div>
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Problem Statement</p>
                  </div>
                  <textarea
                    placeholder="Describe the patient's primary problem statement..."
                    className="w-full p-3 text-sm text-gray-700 resize-none border-0 focus:outline-none focus:ring-0 min-h-[160px]"
                    value={problemForm.problem_statement}
                    onChange={e => setProblemForm({ ...problemForm, problem_statement: e.target.value })}
                  />
                </div>
                <div>
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Underlying Causes</p>
                  </div>
                  <textarea
                    placeholder="List the underlying causes..."
                    className="w-full p-3 text-sm text-gray-700 resize-none border-0 focus:outline-none focus:ring-0 min-h-[160px]"
                    value={problemForm.underlying_causes}
                    onChange={e => setProblemForm({ ...problemForm, underlying_causes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* SMART Goals Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 text-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700">Smart Goal</h3>
              </div>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-r border-gray-200 px-4 py-2 text-left font-semibold text-gray-600 bg-gray-50 w-1/2">Goals</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-left font-semibold text-gray-600 bg-gray-50 w-1/2">Sub Goals</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { n: 1, gKey: 'smart_goal_1' as const, sKey: 'smart_goal_1_sub' as const },
                    { n: 2, gKey: 'smart_goal_2' as const, sKey: 'smart_goal_2_sub' as const },
                    { n: 3, gKey: 'smart_goal_3' as const, sKey: 'smart_goal_3_sub' as const },
                  ].map(({ n, gKey, sKey }) => (
                    <tr key={n} className="border-b border-gray-200 last:border-b-0">
                      <td className="border-r border-gray-200 p-0 align-top">
                        <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500">Goal {n}:</div>
                        <textarea
                          placeholder={`Enter goal ${n}...`}
                          className="w-full px-3 pb-3 text-sm text-gray-700 resize-none border-0 focus:outline-none focus:ring-0 min-h-[80px]"
                          value={problemForm[gKey]}
                          onChange={e => setProblemForm({ ...problemForm, [gKey]: e.target.value })}
                        />
                      </td>
                      <td className="p-0 align-top">
                        <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500">&nbsp;</div>
                        <textarea
                          placeholder={`Sub goals for goal ${n}...`}
                          className="w-full px-3 pb-3 text-sm text-gray-700 resize-none border-0 focus:outline-none focus:ring-0 min-h-[80px]"
                          value={problemForm[sKey]}
                          onChange={e => setProblemForm({ ...problemForm, [sKey]: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Treatment Plan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 text-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700">Treatment Plan</h3>
              </div>
              <div>
                <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Approaches / Frames of Reference</p>
                </div>
                <textarea
                  placeholder="Describe therapeutic approaches and frames of reference to be used..."
                  className="w-full p-3 text-sm text-gray-700 resize-none border-0 focus:outline-none focus:ring-0 min-h-[120px]"
                  value={problemForm.treatment_approaches}
                  onChange={e => setProblemForm({ ...problemForm, treatment_approaches: e.target.value })}
                />
              </div>
            </div>

            {/* Save Clinical Data */}
            <button
              onClick={handleSaveClinical}
              disabled={saving}
              className="w-full bg-[#6328FF] hover:bg-[#5020CC] disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition-all"
            >
              {saving ? 'Saving...' : 'Save Clinical Data'}
            </button>

            {/* Treatment Goals */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-700 font-semibold mb-4">Treatment Goals</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Short Term Goals
                  </label>
                  <textarea
                    placeholder="List short-term treatment goals (1-3 months)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]"
                    value={goalsForm.short_term}
                    onChange={(e) => setGoalsForm({ ...goalsForm, short_term: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Long Term Goals
                  </label>
                  <textarea
                    placeholder="List long-term treatment goals (3-12 months)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]"
                    value={goalsForm.long_term}
                    onChange={(e) => setGoalsForm({ ...goalsForm, long_term: e.target.value })}
                  />
                </div>

                <button
                  onClick={handleSaveGoals}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-black py-2 rounded-lg text-sm font-semibold"
                >
                  Save Treatment Goals
                </button>
              </div>
            </div>

          </TabsContent>

          <TabsContent value="medical" className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-700 mb-4">Medical Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Hospital Name</span>
                  <span className="text-gray-800">{demographicForm.hospital_no ? `Hospital #${demographicForm.hospital_no}` : 'Not set'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Diagnosis</span>
                  <span className="text-gray-800">{demographicForm.diagnosis || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Admission Date</span>
                  <span className="text-gray-800">{demographicForm.admission_date || 'Not set'}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-4">Edit these details in the Demographic tab.</p>
            </div>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-700 mb-4">Patient Vitals History</h3>
              {vitals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No vitals recorded yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Vitals will appear here when entered by the caregiver or patient.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vitals.map((vital, index) => (
                    <div key={vital.id} className={`border rounded-lg p-4 ${index === 0 ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-semibold ${index === 0 ? 'text-blue-800' : 'text-gray-700'}`}>
                          {index === 0 ? 'Latest Entry' : vital.date}
                        </span>
                        {index === 0 && <span className="text-xs text-blue-600">{vital.date}</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><span className="text-gray-500">BP:</span> <span className="font-semibold">{vital.blood_pressure}</span></div>
                        <div><span className="text-gray-500">HR:</span> <span className="font-semibold">{vital.heart_rate}</span></div>
                        <div><span className="text-gray-500">Temp:</span> <span className="font-semibold">{vital.temperature}</span></div>
                        <div><span className="text-gray-500">O2:</span> <span className="font-semibold">{vital.oxygen}</span></div>
                        <div><span className="text-gray-500">Weight:</span> <span className="font-semibold">{vital.weight}</span></div>
                        <div><span className="text-gray-500">Sugar:</span> <span className="font-semibold">{vital.blood_sugar}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            {/* Add New Bill Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💰 Add New Bill</h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service Description *</label>
                  <input
                    type="text"
                    placeholder="e.g., Therapy Session, OT Assessment, Consultation"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹) *</label>
                    <input
                      type="number"
                      placeholder="1500"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      max={todayIST}
                      defaultValue={todayIST}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
                  <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none">
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-bold text-sm shadow-lg transition-all">
                  ➕ Add Bill to Patient Account
                </button>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Billing History</h3>
              {bills.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No billing history yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Add bills using the form above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bills.map((bill) => (
                    <div
                      key={bill.id}
                      className={`border-l-4 rounded-lg p-4 ${bill.status === 'paid'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500'
                        : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-500'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-base">{bill.description}</p>
                          <p className="text-sm text-gray-600 mt-1">Date: {bill.date}</p>
                          <p className="text-xs text-gray-500 mt-1">Added by: {user.name || 'Therapist'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-2xl ${bill.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                            ₹{bill.amount.toLocaleString()}
                          </p>
                          <span className={`inline-block mt-2 text-white text-xs px-3 py-1 rounded-full font-semibold ${bill.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'
                            }`}>
                            {bill.status === 'paid' ? '✓ PAID' : '⏳ PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 shadow-lg border-2 border-purple-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💵 Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700 font-semibold">Total Billed:</span>
                  <span className="text-2xl font-bold text-gray-800">₹{totalBilled.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700 font-semibold">Total Paid:</span>
                  <span className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-orange-300">
                  <span className="text-gray-700 font-bold">Outstanding Balance:</span>
                  <span className="text-3xl font-bold text-orange-600">₹{outstanding.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="caregiver" className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-700 mb-4">Caregiver Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Name</span>
                  <span className="text-gray-800">{patient.caregiver?.name || 'Not linked'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Relationship</span>
                  <span className="text-gray-800">{patient.caregiver?.relationship || '-'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Contact</span>
                  <span className="text-gray-800">{patient.caregiver?.contact || '-'}</span>
                </div>
              </div>
              {!patient.caregiver?.name && (
                <p className="text-sm text-gray-400 mt-4">Caregiver can link using the connection code below.</p>
              )}
            </div>

            {/* Connection Code Section */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-purple-100">
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-3xl">🔑</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Connection Code</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Share this code with the Caregiver to link their account to this patient.
                  </p>
                  <div className="bg-white border-2 border-dashed border-purple-200 rounded-lg p-4 text-center">
                    <span className="text-3xl font-mono font-bold text-purple-600 tracking-widest">
                      {patient.caregiver_code || 'Not generated'}
                    </span>
                    {!patient.caregiver_code && <p className="text-xs text-gray-500 mt-2">Ask patient to open "My Account" to generate code.</p>}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-700 font-semibold mb-4">Task Verification & Proof</h3>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <p className="text-gray-500">No tasks assigned.</p>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className="border rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{task.title}</h4>
                          <p className="text-sm text-gray-600">{task.scheduled_date} at {task.start_time}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${task.is_completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {task.is_completed ? 'Completed' : 'Pending'}
                          </span>
                          {task.verified_by_caregiver && (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-[#C2D738]/20 text-[#8ea01f]">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {task.is_completed && task.proof_media_id && (
                        <div className="mt-2 text-sm">
                          <span className="font-semibold text-gray-700">Proof: </span>
                          <a
                            href={`${API_SERVER_URL}/api/uploads/file/${task.proof_media_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Media
                          </a>
                        </div>
                      )}

                      {task.verified_by_caregiver && task.verification_notes && (
                        <div className="mt-2 bg-yellow-50 p-2 rounded-lg text-sm border border-yellow-100">
                          <span className="font-semibold text-gray-700">Caregiver Note: </span>
                          <span className="text-gray-800">{task.verification_notes}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-700 font-semibold mb-4 text-xl">Patient Mood & Journal Logs</h3>
              <div className="space-y-6">
                {logs.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">No logs recorded yet.</p>
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1 font-medium">
                            <Calendar className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {log.emotions?.map((emotion: string, i: number) => (
                              <span
                                key={i}
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${i === 0 ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                  i === 1 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    'bg-indigo-100 text-indigo-700 border-indigo-200'
                                  }`}
                              >
                                {emotion}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-[#6328FF] text-white px-3 py-1.5 rounded-xl font-bold text-sm shadow-sm">
                          Mood: {log.mood_score}/10
                        </div>
                      </div>

                      {log.journal_text ? (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <p className="text-gray-700 text-sm italic leading-relaxed">
                            "{log.journal_text}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm italic">No journal entry provided for this log.</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assessment">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-700 mb-4">OT Assessment</h3>
              <p className="text-sm text-gray-500 mb-4">View detailed assessment in the OT Assessment screen</p>
              <button
                onClick={() => navigate('/therapist/ot-assessment')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                View Full Assessment
              </button>
            </div>
          </TabsContent>

          <TabsContent value="media">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-700 font-semibold mb-4">📷 Patient Media</h3>
              <p className="text-sm text-gray-500 mb-4">View photos and videos uploaded by this patient</p>
              <button
                onClick={() => navigate(`/therapist/patient-media/${id}`)}
                className="w-full bg-gradient-to-r from-[#6328FF] to-[#9E98ED] text-white py-3 rounded-lg hover:shadow-lg transition-all"
              >
                View Patient Media Gallery
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <TherapistBottomNav />
    </div>
  );
}
