import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { ChevronLeft, Save, Loader2, User, Briefcase, Award, Phone, MapPin, FileText } from 'lucide-react';
import { api } from '../../services/api';

type ProfileField = {
    key: string;
    label: string;
    icon: any;
    placeholder: string;
    type?: string;
};

const FIELDS: ProfileField[] = [
    { key: 'name', label: 'Full Name', icon: User, placeholder: 'Dr. Jane Doe' },
    { key: 'specialization', label: 'Specialization / Expertise', icon: Briefcase, placeholder: 'e.g. Trauma Recovery, Pediatric OT' },
    { key: 'experience', label: 'Years of Experience', icon: Award, placeholder: 'e.g. 5 years' },
    { key: 'certification', label: 'Certifications', icon: FileText, placeholder: 'e.g. NDT, SI Certified' },
    { key: 'license_number', label: 'License Number', icon: FileText, placeholder: 'e.g. OT-2025-1234' },
    { key: 'phone', label: 'Phone Number', icon: Phone, placeholder: '+91 98765 43210' },
    { key: 'address', label: 'Clinic / Hospital Address', icon: MapPin, placeholder: 'e.g. Apollo Hospital, Chennai' },
];

export function TherapistProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<Record<string, string>>({});
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (user.id) {
                    const data = await api.therapist.getProfile(user.id);
                    setProfile(data);
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id) {
                await api.therapist.updateProfile(user.id, profile);
                // Update localStorage name if changed
                if (profile.name) {
                    const updatedUser = { ...user, name: profile.name };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            alert('Failed to save profile');
        } finally {
            setSaving(false);
        }
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
                    <div className="flex items-center gap-3 mb-1">
                        <button onClick={() => navigate('/therapist/account')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-2xl font-bold text-gray-800">Profile Information</h1>
                    </div>
                    <p className="text-sm text-gray-500 ml-12">Update your professional details</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-4">
                {/* Email (read-only) */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Email (read-only)</label>
                    <p className="text-gray-800 font-medium">{profile.email || 'Not set'}</p>
                </div>

                {/* Editable Fields */}
                {FIELDS.map(field => {
                    const Icon = field.icon;
                    return (
                        <div key={field.key} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                            <label className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                                <Icon className="w-4 h-4 text-[#6328FF]" />
                                {field.label}
                            </label>
                            <input
                                type={field.type || 'text'}
                                value={profile[field.key] || ''}
                                onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                                placeholder={field.placeholder}
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6328FF] focus:ring-1 focus:ring-[#6328FF] outline-none transition-all text-gray-800"
                            />
                        </div>
                    );
                })}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-[#6328FF] to-[#9E98ED] hover:from-[#5520E6] hover:to-[#8A84D4] text-white h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                        </>
                    ) : saved ? (
                        <>
                            ✓ Saved Successfully
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" /> Save Profile
                        </>
                    )}
                </button>
            </div>

            <TherapistBottomNav />
        </div>
    );
}
