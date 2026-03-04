import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaregiverBottomNav } from '../shared/CaregiverBottomNav';
import { User, Settings, Bell, Shield, LogOut, Edit, Camera, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import '../../styles/caregiver-background.css';
import { api } from '../../services/api';

export function CaregiverAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    employeeId: '',
    department: '',
    experience: '',
    certification: ''
  });

  const [stats, setStats] = useState({
    patients: '0',
    verified: '0'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
      if (userData) {
        setProfile(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          experience: userData.experience || '',
          certification: userData.certification || ''
        }));

        // Fetch stats
        if (userData.id) {
          api.caregiver.getDashboardStats(userData.id).then(data => {
            const patients = data.stats.find((s: any) => s.label === 'Patients')?.value || '0';
            const completed = data.stats.find((s: any) => s.label === 'Completed Tasks')?.value || '0';
            setStats({ patients, verified: completed });
          }).catch(console.error);
        }
      }
    };
    fetchProfile();
  }, []);

  // ... handleSave ...

  // ...

  // ... (inside return)



  const handleSave = async () => {
    try {
      const updatedUser = await api.caregiver.updateProfile(user.id, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        experience: profile.experience,
        certification: profile.certification
      });
      localStorage.setItem('user', JSON.stringify(updatedUser.user)); // Update local storage
      setUser(updatedUser.user);
      setIsEditing(false);
      alert('Profile updated!');
    } catch (e) {
      alert('Failed to update profile');
    }
  };

  const handleLogout = () => {
    // In real app, clear auth tokens
    navigate('/');
  };

  const menuItems = [
    { icon: Bell, label: 'Notifications', action: () => navigate('/caregiver/notifications') },
    { icon: Shield, label: 'Privacy & Security', action: () => { } },
    { icon: Settings, label: 'App Settings', action: () => { } },
    { icon: LogOut, label: 'Sign Out', action: handleLogout, danger: true },
  ];

  return (
    <div className="min-h-screen caregiver-account-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#d4b5d4]">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-black mb-2 flex items-center gap-2">
            My Account <User className="w-8 h-8 text-[#d4b5d4]" />
          </h1>
          <p className="text-black font-semibold text-lg">Manage your profile and settings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-black font-semibold">Profile Information</h3>
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="bg-[#d4b5d4] hover:bg-[#c4a5c4] text-white px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {isEditing ? 'Save' : 'Edit'}
            </Button>
          </div>

          {/* Profile Picture */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-[#ff6b9d] to-[#c44569] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl">👩‍⚕️</span>
              </div>
              {isEditing && (
                <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#d4b5d4] rounded-full flex items-center justify-center shadow-md">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">{profile.name}</h2>
              <p className="text-black font-medium">{profile.department}</p>
              <p className="text-sm text-black">ID: {profile.employeeId}</p>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                {isEditing ? (
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#4a90e2]"
                  />
                ) : (
                  <p className="text-[#2c3e50] bg-gray-50 p-3 rounded-xl">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                {isEditing ? (
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#4a90e2]"
                  />
                ) : (
                  <p className="text-[#2c3e50] bg-gray-50 p-3 rounded-xl">{profile.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                {isEditing ? (
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#4a90e2]"
                  />
                ) : (
                  <p className="text-[#2c3e50] bg-gray-50 p-3 rounded-xl">{profile.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                {isEditing ? (
                  <Input
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#4a90e2]"
                  />
                ) : (
                  <p className="text-[#2c3e50] bg-gray-50 p-3 rounded-xl">{profile.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Professional Info */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-200">
          <h3 className="text-[#2c3e50] font-semibold mb-4">Professional Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#5a6c7d] mb-1">Experience</p>
              <p className="text-[#2c3e50] font-medium">{profile.experience}</p>
            </div>
            <div>
              <p className="text-sm text-[#5a6c7d] mb-1">Certification</p>
              <p className="text-[#2c3e50] font-medium">{profile.certification}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
          <h3 className="text-[#2c3e50] font-semibold mb-4">My Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-[#4a90e2]/10 to-[#7b68ee]/10 rounded-2xl">
              <div className="text-2xl font-bold text-[#4a90e2]">{stats.verified}</div>
              <div className="text-sm text-[#5a6c7d]">Tasks Completed</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-[#f39c12]/10 to-[#f7dc6f]/10 rounded-2xl">
              <div className="text-2xl font-bold text-[#f39c12]">{stats.patients}</div>
              <div className="text-sm text-[#5a6c7d]">Active Patients</div>
            </div>
          </div>
        </div>


        {/* Menu Items */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-gray-200">
          <h3 className="text-[#2c3e50] font-semibold mb-4">Settings & Support</h3>
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all hover:bg-gray-50 ${item.danger ? 'text-[#e74c3c] hover:bg-[#e74c3c]/5' : 'text-[#2c3e50]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>

                </button>
              );
            })}
          </div>
        </div>
      </div>

      <CaregiverBottomNav />
    </div >
  );
}