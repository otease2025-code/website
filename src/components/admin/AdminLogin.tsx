import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';

export function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await api.admin.login(email, password);
            localStorage.setItem('adminToken', data.token);
            navigate('/admin/dashboard');
        } catch (err: any) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            {/* Background elements */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-[#6328FF] rounded-full opacity-10 blur-3xl" />
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#FE5C2B] rounded-full opacity-10 blur-3xl" />

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#6328FF] to-[#9E98ED] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-gray-800 mb-2">
                        Admin Portal
                    </h1>
                    <p className="text-gray-500 text-sm">OTease Administration Panel</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-12 bg-white border border-gray-300 rounded-xl px-4 text-gray-800 placeholder-gray-400 focus:border-[#6328FF] focus:ring-1 focus:ring-[#6328FF] outline-none transition-all"
                            placeholder="admin@otease.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 bg-white border border-gray-300 rounded-xl px-4 pr-12 text-gray-800 placeholder-gray-400 focus:border-[#6328FF] focus:ring-1 focus:ring-[#6328FF] outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6328FF] transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-[#6328FF] to-[#9E98ED] hover:from-[#5520E6] hover:to-[#8A84D4] text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg"
                    >
                        {loading ? 'Authenticating...' : 'Sign In as Admin'}
                    </button>

                    <p className="text-center text-gray-500 text-xs">
                        This portal is restricted to authorized administrators only.
                    </p>
                </form>
            </div>
        </div>
    );
}
