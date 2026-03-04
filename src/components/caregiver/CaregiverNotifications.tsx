import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaregiverBottomNav } from '../shared/CaregiverBottomNav';
import { ChevronLeft, Bell, ClipboardCheck, AlertCircle, X } from 'lucide-react';
import { api } from '../../services/api';
import '../../styles/caregiver-background.css';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    is_read: boolean;
}

export function CaregiverNotifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (user.id) {
                    // Generate time-based notifications first
                    await api.notifications.generate(user.id);
                    // Then fetch all
                    const data = await api.notifications.get(user.id);
                    setNotifications(data);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'task': return ClipboardCheck;
            case 'alert': return AlertCircle;
            default: return Bell;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'task': return 'from-[#00d2d3] to-[#54a0ff]';
            case 'alert': return 'from-[#ff6b6b] to-[#ee5a24]';
            default: return 'from-[#a55eea] to-[#8c7ae6]';
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAsRead = async (id: string) => {
        try {
            await api.notifications.markAsRead(id);
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === id ? { ...notif, is_read: true } : notif
                )
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.notifications.delete(id);
            setNotifications(prev => prev.filter(notif => notif.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await api.notifications.markAllAsRead(user.id);
            setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <div className="min-h-screen caregiver-account-bg pb-20">
            {/* Header */}
            <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#d4b5d4]">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <button onClick={() => navigate('/caregiver/account')} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                            <ChevronLeft className="w-6 h-6 text-black" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Bell className="w-6 h-6 text-[#d4b5d4]" />
                            <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-2xl font-bold text-black">Notifications</h1>
                        </div>
                        {unreadCount > 0 && (
                            <span className="ml-auto bg-[#ff6b9d] text-white px-3 py-1 rounded-full text-sm">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between ml-12">
                        <p className="text-black/70">Stay updated with patient care</p>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-[#d4b5d4] hover:text-[#c4a5c4] font-bold underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="max-w-4xl mx-auto p-6 space-y-4">
                {loading ? (
                    <div className="bg-white rounded-3xl p-12 shadow-sm text-center border border-[#d4b5d4]">
                        <div className="animate-spin w-8 h-8 border-4 border-[#d4b5d4] border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 shadow-sm text-center border border-[#d4b5d4]">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl text-black mb-2">No Notifications</h3>
                        <p className="text-gray-500">You're all caught up!</p>
                    </div>
                ) : (
                    notifications.map((notification) => {
                        const Icon = getIcon(notification.type);
                        const color = getColor(notification.type);
                        return (
                            <div
                                key={notification.id}
                                className={`bg-white rounded-3xl p-5 shadow-sm transition-all border border-[#d4b5d4] ${notification.is_read
                                    ? 'opacity-75'
                                    : 'hover:shadow-md border-l-8 border-l-[#ff6b9d]'
                                    }`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className={`text-base ${notification.is_read ? 'text-gray-600' : 'text-black font-bold'}`}>
                                                {notification.title}
                                            </h3>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                                            >
                                                <X className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-black mb-2">{notification.message}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{notification.time}</span>
                                            {!notification.is_read && (
                                                <span className="w-2 h-2 bg-[#ff6b9d] rounded-full"></span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <CaregiverBottomNav />
        </div>
    );
}
