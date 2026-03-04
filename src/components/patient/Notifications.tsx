import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { ChevronLeft, Bell, X, Calendar, CheckCircle, Clock, Award, DollarSign, Heart, UserPlus } from 'lucide-react';
import { api } from '../../services/api';
import '../../styles/patient-home-background.css';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  is_read: boolean;
}

export function Notifications() {
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
      case 'appointment': return Calendar;
      case 'task': return CheckCircle;
      case 'reminder': return Clock;
      case 'achievement': return Award;
      case 'billing': return DollarSign;
      case 'welcome': return Heart;
      case 'caregiver_link': return UserPlus;
      default: return Bell;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'appointment': return '#6328FF';
      case 'task': return '#C2D738';
      case 'reminder': return '#FE97CF';
      case 'achievement': return '#9E98ED';
      case 'billing': return '#FE5C2B';
      case 'welcome': return '#C2D738';
      case 'caregiver_link': return '#6328FF';
      default: return '#6328FF';
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
    <div className="min-h-screen patient-home-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate('/patient/account')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-[#6328FF]" />
              <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-2xl font-bold text-black">Notifications</h1>
            </div>
            {unreadCount > 0 && (
              <span className="ml-2 bg-[#6328FF] text-black px-3 py-1 rounded-full text-sm">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center justify-between ml-12">
            <p className="text-gray-600">Stay updated with your journey</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-[#6328FF] hover:underline"
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
          <div className="bg-[#FFF8E7] rounded-3xl p-12 shadow-sm text-center border border-[#E8D9B5]">
            <div className="animate-spin w-8 h-8 border-4 border-[#6328FF] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#FFF8E7] rounded-3xl p-12 shadow-sm text-center border border-[#E8D9B5]">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl text-gray-800 mb-2">No Notifications</h3>
            <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const color = getColor(notification.type);
            return (
              <div
                key={notification.id}
                className={`bg-[#FFF8E7] rounded-3xl p-5 shadow-sm transition-all border border-[#E8D9B5] ${notification.is_read
                  ? 'opacity-75'
                  : 'hover:shadow-md'
                  }`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="w-7 h-7 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-base text-gray-800 font-semibold">{notification.title}</h3>
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
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{notification.time}</span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-[#6328FF] rounded-full"></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <PatientBottomNav />
    </div>
  );
}
