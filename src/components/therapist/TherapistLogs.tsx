import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { ArrowLeft, User, Search, Calendar, Filter, Activity, FileText, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { api, API_SERVER_URL } from '../../services/api';

export function TherapistLogs() {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (user.id) {
                    const data = await api.therapist.getAllPatientLogs(user.id);
                    setLogs(data);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.journal_text?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const getMoodEmoji = (score: number) => {
        if (score >= 8) return '😄';
        if (score >= 6) return '🙂';
        if (score >= 4) return '😐';
        if (score >= 2) return '😔';
        return '😫';
    };

    const getMoodColor = (score: number) => {
        if (score >= 8) return 'bg-green-100 text-green-700 border-green-200';
        if (score >= 6) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (score >= 4) return 'bg-gray-100 text-gray-700 border-gray-200';
        if (score >= 2) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-20">
            <div className="bg-white p-6 shadow-sm sticky top-0 z-10 rounded-b-3xl">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-2xl font-bold text-gray-800">Patient Monitoring</h1>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search journals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#6328FF] outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading journals...</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No journals found.</div>
                ) : (
                    filteredLogs.map((log) => (
                        <div key={log.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-[#6328FF] font-bold">
                                        {log.patient_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{log.patient_name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${getMoodColor(Math.round(log.mood_score))}`}>
                                    <span>{getMoodEmoji(Math.round(log.mood_score))}</span>
                                    <span>{log.mood_score}/10</span>
                                </div>
                            </div>

                            {/* Source Label: Mood Mapping or Happy Journal */}
                            {(() => {
                                const isMoodMapping = log.emotions && log.emotions.length > 0;
                                // For Happy Journal, extract tags from journal_text (format: "entry text\nTags: tag1, tag2")
                                let journalBody = log.journal_text || '';
                                let journalTags: string[] = [];
                                if (!isMoodMapping && journalBody) {
                                    const tagsMatch = journalBody.match(/\nTags:\s*(.+)$/);
                                    if (tagsMatch) {
                                        journalTags = tagsMatch[1].split(',').map((t: string) => t.trim()).filter(Boolean);
                                        journalBody = journalBody.replace(/\nTags:\s*.+$/, '').trim();
                                    }
                                }
                                return (
                                    <>
                                        <div className="flex items-center gap-2 mb-2">
                                            {isMoodMapping ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                                    📊 Mood Mapping
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                                    📓 Happy Journal
                                                </span>
                                            )}
                                        </div>

                                        {/* Mood Mapping: Emotion Tags */}
                                        {isMoodMapping && (
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                <span className="text-xs text-gray-500 font-medium mr-1">Emotions:</span>
                                                {log.emotions.map((emotion: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${i === 0 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                            i === 1 ? 'bg-teal-100 text-teal-700 border-teal-200' :
                                                                'bg-indigo-100 text-indigo-700 border-indigo-200'
                                                            }`}
                                                    >
                                                        {emotion}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Happy Journal: Tags */}
                                        {!isMoodMapping && journalTags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                <span className="text-xs text-gray-500 font-medium mr-1">Tags:</span>
                                                {journalTags.map((tag: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-pink-100 text-pink-700 border-pink-200"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Journal/Notes text */}
                                        {isMoodMapping && log.journal_text && (
                                            <div className="bg-blue-50 p-4 rounded-xl text-gray-700 text-sm italic border border-blue-100">
                                                <span className="text-xs font-bold text-blue-600 not-italic block mb-1">Notes:</span>
                                                "{log.journal_text}"
                                            </div>
                                        )}
                                        {!isMoodMapping && journalBody && (
                                            <div className="bg-purple-50 p-4 rounded-xl text-gray-700 text-sm italic border border-purple-100">
                                                "{journalBody}"
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    ))
                )}
            </div>

            <TherapistBottomNav />
        </div>
    );
}
