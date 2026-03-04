import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
    Shield, LogOut, Users, ChevronDown, ChevronUp,
    Trash2, BarChart3, CheckCircle, ListTodo, UserCheck,
    Loader2, AlertTriangle, UserPlus, Heart, User
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function AdminDashboard() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<{ therapists: any[], patients: any[], caregivers: any[] }>({ therapists: [], patients: [], caregivers: [] });
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [activeTab, setActiveTab] = useState<'therapists' | 'patients' | 'caregivers'>('therapists');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    const getToken = () => localStorage.getItem('adminToken') || '';

    const fetchData = async () => {
        const token = getToken();
        if (!token) {
            navigate('/admin/login');
            return;
        }
        try {
            const [usersData, statsData] = await Promise.all([
                api.admin.getUsers(token),
                api.admin.getStats(token, period)
            ]);
            setUsers(usersData);
            setStats(statsData);
        } catch (err) {
            console.error(err);
            navigate('/admin/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period]);

    const handleDelete = async (id: string, type: string) => {
        setDeleting(true);
        try {
            const token = getToken();
            if (type === 'therapist') await api.admin.removeTherapist(id, token);
            else if (type === 'patient') await api.admin.removePatient(id, token);
            else if (type === 'caregiver') await api.admin.removeCaregiver(id, token);

            setConfirmDelete(null);
            setExpandedId(null);
            await fetchData();
        } catch (err) {
            alert(`Failed to remove ${type}`);
        } finally {
            setDeleting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#6328FF]" />
            </div>
        );
    }

    const chartData = stats?.chart?.labels?.map((label: string, i: number) => ({
        name: label,
        Assigned: stats.chart.assigned[i],
        Completed: stats.chart.completed[i]
    })) || [];

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#6328FF] to-[#9E98ED] rounded-xl flex items-center justify-center shadow-md">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                            <p className="text-xs text-gray-500 font-medium">OTease Management</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-500 hover:text-red-500 font-semibold transition-colors px-4 py-2 rounded-xl hover:bg-red-50"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Users, label: 'Total Therapists', value: stats?.therapist_count ?? 0, color: 'from-[#6328FF] to-[#9E98ED]' },
                        { icon: UserCheck, label: 'Total Patients', value: stats?.patient_count ?? 0, color: 'from-[#FE97CF] to-[#FE5C2B]' },
                        { icon: ListTodo, label: 'Tasks Assigned', value: stats?.total_assigned ?? 0, color: 'from-[#FE5C2B] to-[#C2D738]' },
                        { icon: CheckCircle, label: 'Tasks Completed', value: stats?.total_completed ?? 0, color: 'from-[#C2D738] to-[#4C9A2A]' }
                    ].map(stat => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-sm`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Task Stats Chart */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[#6328FF]" />
                            <h2 className="text-lg font-bold text-gray-800">Task Statistics</h2>
                        </div>
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                            {(['daily', 'weekly', 'monthly'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p
                                        ? 'bg-white text-[#6328FF] shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                                        }`}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fill: '#666' }} />
                                <YAxis tick={{ fill: '#666' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#1f2937' }}
                                />
                                <Legend />
                                <Bar dataKey="Assigned" fill="#6328FF" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="Completed" fill="#C2D738" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center text-gray-500">
                            No task data available for this period
                        </div>
                    )}
                </div>

                {/* Users Management */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#6328FF]" />
                            <h2 className="text-lg font-bold text-gray-800">User Management</h2>
                        </div>
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('therapists')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'therapists' ? 'bg-white text-[#6328FF] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                <Users className="w-4 h-4" /> Therapists ({users.therapists.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('patients')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'patients' ? 'bg-white text-[#FE97CF] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                <UserCheck className="w-4 h-4" /> Patients ({users.patients.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('caregivers')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'caregivers' ? 'bg-white text-[#C2D738] shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                <Heart className="w-4 h-4" /> Caregivers ({users.caregivers.length})
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {users[activeTab].length === 0 ? (
                            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                                No {activeTab} found in the system.
                            </div>
                        ) : (
                            users[activeTab].map(user => (
                                <div key={user.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-[#9E98ED] transition-all">
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-all"
                                        onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${activeTab === 'therapists' ? 'bg-gradient-to-br from-[#6328FF] to-[#9E98ED]' :
                                                activeTab === 'patients' ? 'bg-gradient-to-br from-[#FE97CF] to-[#FE5C2B]' :
                                                    'bg-gradient-to-br from-[#C2D738] to-[#4C9A2A]'
                                                }`}>
                                                {(user.name || user.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{user.name || 'Unnamed'}</p>
                                                <p className="text-gray-500 text-xs font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {activeTab === 'therapists' && (
                                                <span className="text-xs bg-[#6328FF]/10 text-[#6328FF] px-3 py-1 rounded-full font-bold">
                                                    {user.patient_count} patients
                                                </span>
                                            )}
                                            {activeTab === 'patients' && (
                                                <span className="text-xs bg-[#FE97CF]/20 text-[#FE5C2B] px-3 py-1 rounded-full font-bold">
                                                    {user.caregiver_count} caregivers
                                                </span>
                                            )}
                                            {activeTab === 'caregivers' && (
                                                <span className="text-xs bg-[#C2D738]/20 text-[#4C9A2A] px-3 py-1 rounded-full font-bold">
                                                    {user.patient_count} patients
                                                </span>
                                            )}
                                            {expandedId === user.id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {expandedId === user.id && (
                                        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">

                                            {/* Therapist Details — full patient list with caregivers */}
                                            {activeTab === 'therapists' && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-bold text-gray-700 mb-2">Patients ({user.patient_count})</p>
                                                    {!user.patients || user.patients.length === 0 ? (
                                                        <p className="text-sm text-gray-500 bg-white border border-gray-200 p-3 rounded-xl">No patients assigned yet.</p>
                                                    ) : (
                                                        user.patients.map((p: any, i: number) => (
                                                            <div key={i} className="bg-white border border-gray-200 p-3 rounded-xl flex justify-between items-start">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                                                                        <User className="w-3 h-3 text-gray-400" /> {p.name}
                                                                    </p>
                                                                    {p.caregivers && p.caregivers.length > 0 ? (
                                                                        <p className="text-xs text-gray-500 mt-0.5">Caregivers: {p.caregivers.join(', ')}</p>
                                                                    ) : (
                                                                        <p className="text-xs text-gray-400 mt-0.5">No caregiver</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}

                                            {/* Patient Details */}
                                            {activeTab === 'patients' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center gap-3">
                                                        <User className="w-8 h-8 text-gray-400 p-1 bg-gray-50 rounded-full" />
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-500 mb-0.5">Therapist</p>
                                                            <p className="text-sm font-semibold text-gray-800">{user.therapist_name || 'None'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-start gap-3">
                                                        <Heart className="w-8 h-8 text-indigo-400 p-1 bg-indigo-50 rounded-full shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-500 mb-0.5">Caregivers</p>
                                                            {!user.caregivers || user.caregivers.length === 0 ? <p className="text-sm text-gray-500 font-semibold">None</p> : (
                                                                <div className="flex flex-col gap-0.5">
                                                                    {user.caregivers.map((c: any, i: number) => (
                                                                        <p key={i} className="text-sm font-semibold text-gray-800">{c.name || c.email}</p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Caregiver Details — patients with therapist names */}
                                            {activeTab === 'caregivers' && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-bold text-gray-700 mb-2">Linked Patients ({user.patient_count})</p>
                                                    {!user.patients || user.patients.length === 0 ? (
                                                        <p className="text-sm text-gray-500 bg-white border border-gray-200 p-3 rounded-xl">No patients linked.</p>
                                                    ) : (
                                                        user.patients.map((p: any, i: number) => (
                                                            <div key={i} className="bg-white border border-gray-200 p-3 rounded-xl flex justify-between items-start">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                                                                        <User className="w-3 h-3 text-gray-400" /> {p.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 mt-0.5">Therapist: {p.therapist_name || 'None'}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}

                                            {/* Delete Action */}
                                            <div className="pt-2 border-t border-gray-200">
                                                {confirmDelete?.id === user.id ? (
                                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                                            <p className="text-red-700 font-bold text-sm">Confirm Removal</p>
                                                        </div>
                                                        <p className="text-gray-700 text-xs font-medium mb-4">
                                                            {activeTab === 'therapists' ? `Permanently remove ${user.name || user.email} and all ${user.patient_count} patients.` :
                                                                activeTab === 'patients' ? `Permanently remove patient ${user.name || user.email} and all their data.` :
                                                                    `Permanently remove caregiver ${user.name || user.email} and unlink from all patients.`}
                                                        </p>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleDelete(user.id, activeTab.slice(0, -1))}
                                                                disabled={deleting}
                                                                className={`flex-1 text-black py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ${activeTab === 'patients' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-800'
                                                                    }`}
                                                            >
                                                                {deleting ? 'Removing...' : 'Yes, Remove'}
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDelete(null)}
                                                                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 py-2 rounded-lg text-sm font-bold transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmDelete({ id: user.id, type: activeTab });
                                                        }}
                                                        className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Remove {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
