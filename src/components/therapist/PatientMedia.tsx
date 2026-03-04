import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { ArrowLeft, Image, Video, Download, Loader2, X } from 'lucide-react';
import { api } from '../../services/api';

interface MediaItem {
    id: string;
    file_name: string;
    file_type: 'image' | 'video';
    file_url: string;
    description?: string;
    created_at: string;
}

export function PatientMedia() {
    const { id: patientId } = useParams();
    const navigate = useNavigate();
    const [mediaList, setMediaList] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

    useEffect(() => {
        if (patientId) {
            fetchMedia(patientId);
        }
    }, [patientId]);

    const fetchMedia = async (patientId: string) => {
        try {
            const data = await api.media.getPatientMedia(patientId);
            setMediaList(data);
        } catch (err) {
            console.error('Failed to fetch media:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredMedia = mediaList.filter(m => {
        if (filter === 'all') return true;
        return m.file_type === filter;
    });

    const imageCount = mediaList.filter(m => m.file_type === 'image').length;
    const videoCount = mediaList.filter(m => m.file_type === 'video').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate(`/therapist/patient-details/${patientId}`)}
                        className="flex items-center gap-2 text-gray-600 mb-3"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Patient Details
                    </button>
                    <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-2xl font-bold text-gray-800">
                        📷 Patient Media Gallery
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Photos and videos uploaded by this patient
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                {/* Stats & Filters */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                                <Image className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-blue-800">{imageCount} Photos</span>
                            </div>
                            <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg">
                                <Video className="w-5 h-5 text-purple-600" />
                                <span className="font-semibold text-purple-800">{videoCount} Videos</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                    ? 'bg-[#6328FF] text-black'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('image')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'image'
                                    ? 'bg-[#6328FF] text-black'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Photos
                            </button>
                            <button
                                onClick={() => setFilter('video')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'video'
                                    ? 'bg-[#6328FF] text-black'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Videos
                            </button>
                        </div>
                    </div>
                </div>

                {/* Media Gallery */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#6328FF]" />
                        </div>
                    ) : filteredMedia.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📁</div>
                            <p className="text-gray-500">
                                {filter === 'all'
                                    ? 'No media uploaded by this patient yet'
                                    : `No ${filter}s uploaded yet`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredMedia.map((media) => (
                                <div
                                    key={media.id}
                                    onClick={() => setSelectedMedia(media)}
                                    className="relative group cursor-pointer rounded-xl overflow-hidden border border-gray-200 hover:border-[#6328FF] hover:shadow-lg transition-all"
                                >
                                    {media.file_type === 'image' ? (
                                        <img
                                            src={`http://localhost:8000${media.file_url}`}
                                            alt={media.file_name}
                                            className="w-full h-40 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                                            <Video className="w-16 h-16 text-purple-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1 rounded-full">
                                            <span className="text-sm font-medium text-gray-800">View</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-2 right-2">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${media.file_type === 'image'
                                            ? 'bg-blue-500 text-black'
                                            : 'bg-purple-500 text-black'
                                            }`}>
                                            {media.file_type === 'image' ? '📷' : '🎬'}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white">
                                        <p className="text-xs text-gray-600 truncate font-medium">{media.file_name}</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatDate(media.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Media Preview Modal */}
            {selectedMedia && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-800">{selectedMedia.file_name}</h3>
                                <p className="text-sm text-gray-500">{formatDate(selectedMedia.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`http://localhost:8000${selectedMedia.file_url}`}
                                    download={selectedMedia.file_name}
                                    className="p-2 bg-[#6328FF] text-black rounded-lg hover:bg-[#5020DD] transition-colors"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5" />
                                </a>
                                <button
                                    onClick={() => setSelectedMedia(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50">
                            {selectedMedia.file_type === 'image' ? (
                                <img
                                    src={`http://localhost:8000${selectedMedia.file_url}`}
                                    alt={selectedMedia.file_name}
                                    className="w-full max-h-[65vh] object-contain rounded-lg"
                                />
                            ) : (
                                <video
                                    src={`http://localhost:8000${selectedMedia.file_url}`}
                                    controls
                                    className="w-full max-h-[65vh] rounded-lg"
                                />
                            )}
                        </div>

                        {selectedMedia.description && (
                            <div className="p-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600">{selectedMedia.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <TherapistBottomNav />
        </div>
    );
}
