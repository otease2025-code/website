import { useState, useEffect, useRef } from 'react';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { ArrowLeft, Upload, Image, Video, Trash2, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, API_SERVER_URL } from '../../services/api';

interface MediaItem {
    id: string;
    file_name: string;
    file_type: 'image' | 'video';
    file_url: string;
    description?: string;
    created_at: string;
}

export function MediaUpload() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [user, setUser] = useState<any>({});
    const [mediaList, setMediaList] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
        if (userData.id) {
            fetchMedia(userData.id);
        }
    }, []);

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

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if user is logged in - get fresh data from localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData.id) {
            setError('You must be logged in to upload files');
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setError('File size exceeds 10MB limit');
            return;
        }

        // Determine file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            setError('Only images and videos are allowed');
            return;
        }

        setError(null);
        setUploading(true);
        setUploadProgress(0);

        try {
            // Read file as base64
            const reader = new FileReader();
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    setUploadProgress(Math.round((e.loaded / e.total) * 50));
                }
            };

            reader.onload = async () => {
                try {
                    const base64Data = (reader.result as string).split(',')[1];
                    setUploadProgress(60);

                    await api.media.uploadMedia({
                        file_name: file.name,
                        file_type: isImage ? 'image' : 'video',
                        mime_type: file.type,
                        file_size: file.size,
                        file_data: base64Data,
                    }, userData.id);

                    setUploadProgress(100);

                    // Refresh media list
                    await fetchMedia(userData.id);
                    setUploading(false);
                    setUploadProgress(0);
                } catch (err: any) {
                    console.error('Upload error:', err);
                    setError(err.message || 'Upload failed. Please try again.');
                    setUploading(false);
                }
            };

            reader.onerror = () => {
                setError('Failed to read file');
                setUploading(false);
            };

            reader.readAsDataURL(file);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
            setUploading(false);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (mediaId: string) => {
        if (!confirm('Are you sure you want to delete this media?')) return;

        try {
            await api.media.deleteMedia(mediaId, user.id);
            setMediaList(mediaList.filter(m => m.id !== mediaId));
            setSelectedMedia(null);
        } catch (err) {
            console.error('Failed to delete:', err);
            setError('Failed to delete media');
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

    return (
        <div className="min-h-screen pb-20" style={{ backgroundColor: '#FFFDF5' }}>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/patient/home')}
                        className="flex items-center gap-2 text-gray-600 mb-3"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-2xl font-bold text-gray-800">
                        📷 My Media
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Upload photos and videos for your therapist to review
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                {/* Upload Section */}
                <div className="bg-[#A78BFA] rounded-2xl p-6 shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-black mb-4">Upload New Media</h3>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                        className="hidden"
                    />

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
                            <span>{error}</span>
                            <button onClick={() => setError(null)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {uploading ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 bg-white/50">
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-12 h-12 text-[#6328FF] animate-spin mb-4" />
                                <p className="text-gray-900 font-medium">Uploading... {uploadProgress}%</p>
                                <div className="w-full h-2 bg-gray-200 rounded-full mt-3">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#6328FF] to-[#9E98ED] rounded-full transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-black/20 hover:border-black/40 rounded-xl p-8 transition-colors bg-white/20"
                        >
                            <div className="flex flex-col items-center">
                                <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
                                    <Upload className="w-8 h-8 text-[#A78BFA]" />
                                </div>
                                <p className="text-black font-semibold mb-2">Click to upload</p>
                                <p className="text-sm text-gray-800">Photos (JPEG, PNG, GIF) or Videos (MP4, MOV)</p>
                                <p className="text-xs text-gray-700 mt-1">Maximum file size: 10MB</p>
                            </div>
                        </button>
                    )}
                </div>

                {/* Media Gallery */}
                <div className="bg-[#B794F6] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        My Uploads ({mediaList.length})
                    </h3>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#6328FF]" />
                        </div>
                    ) : mediaList.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📁</div>
                            <p className="text-white/80">No media uploaded yet</p>
                            <p className="text-sm text-white/60 mt-1">Upload photos or videos to share with your therapist</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {mediaList.map((media) => (
                                <div
                                    key={media.id}
                                    onClick={() => setSelectedMedia(media)}
                                    className="relative group cursor-pointer rounded-xl overflow-hidden border border-gray-200 hover:border-[#6328FF] transition-all"
                                >
                                    {media.file_type === 'image' ? (
                                        <img
                                            src={`${API_SERVER_URL}${media.file_url}`}
                                            alt={media.file_name}
                                            className="w-full h-32 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                                            <Video className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            {media.file_type === 'image' ? (
                                                <Image className="w-8 h-8 text-white" />
                                            ) : (
                                                <Video className="w-8 h-8 text-white" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-2 bg-white">
                                        <p className="text-xs text-gray-600 truncate">{media.file_name}</p>
                                        <p className="text-xs text-gray-400">{formatDate(media.created_at)}</p>
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
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">{selectedMedia.file_name}</h3>
                            <button
                                onClick={() => setSelectedMedia(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            {selectedMedia.file_type === 'image' ? (
                                <img
                                    src={`${API_SERVER_URL}${selectedMedia.file_url}`}
                                    alt={selectedMedia.file_name}
                                    className="w-full max-h-[60vh] object-contain rounded-lg"
                                />
                            ) : (
                                <video
                                    src={`${API_SERVER_URL}${selectedMedia.file_url}`}
                                    controls
                                    className="w-full max-h-[60vh] rounded-lg"
                                />
                            )}

                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Uploaded: {formatDate(selectedMedia.created_at)}
                                </p>
                                <button
                                    onClick={() => handleDelete(selectedMedia.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PatientBottomNav />
        </div>
    );
}
