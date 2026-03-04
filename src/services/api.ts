const API_BASE_URL = 'http://localhost:8000/api';
export const API_SERVER_URL = 'http://localhost:8000';

export const api = {
    // Patient Endpoints
    patient: {
        getTasks: async (userId: string) => {
            const response = await fetch(`${API_BASE_URL}/patient/tasks?user_id=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch tasks');
            return response.json();
        },
        completeTask: async (taskId: string, isCompleted: boolean, proofMediaId?: string) => {
            const response = await fetch(`${API_BASE_URL}/patient/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_completed: isCompleted, proof_media_id: proofMediaId })
            });
            if (!response.ok) throw new Error('Failed to update task');
            return response.json();
        },
        submitMood: async (userId: string, data: { mood_score: number; journal_text?: string; primary_emotion?: string; secondary_emotion?: string; tertiary_emotion?: string }) => {
            const response = await fetch(`${API_BASE_URL}/patient/mood?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to submit mood');
            return response.json();
        },
        getMoodHistory: async (userId: string) => {
            const response = await fetch(`${API_BASE_URL}/patient/mood/history?user_id=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch mood history');
            return response.json();
        },
        getBilling: async (userId: string) => {
            const response = await fetch(`${API_BASE_URL}/patient/billing?user_id=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch billing');
            return response.json();
        },
        linkTherapist: async (userId: string, code: string) => {
            const response = await fetch(`${API_BASE_URL}/patient/link-therapist?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to link therapist');
            }
            return response.json();
        }
    },

    // Therapist Endpoints
    therapist: {
        generateLinkageCode: async (therapistId: string) => {
            const response = await fetch(`${API_BASE_URL}/therapist/linkage-code?therapist_id=${therapistId}`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error('Failed to generate code');
            return response.json();
        },
        getPatients: async (therapistId: string) => {
            const response = await fetch(`${API_BASE_URL}/therapist/patients?therapist_id=${therapistId}`);
            if (!response.ok) throw new Error('Failed to fetch patients');
            return response.json();
        },
        assignTask: async (therapistId: string, data: any) => {
            const response = await fetch(`${API_BASE_URL}/therapist/tasks?therapist_id=${therapistId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to assign task');
            return response.json();
        },
        confirmBilling: async (therapistId: string, data: { patient_id: string; description?: string; amount: number; status: string; payment_method?: string }) => {
            const response = await fetch(`${API_BASE_URL}/therapist/billing/confirm?therapist_id=${therapistId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                let errorMsg = 'Failed to confirm billing';
                try {
                    const err = await response.json();
                    errorMsg = err.detail || errorMsg;
                } catch { }
                throw new Error(errorMsg);
            }
            return response.json();
        },
        createAppointment: async (therapistId: string, data: any) => {
            const response = await fetch(`${API_BASE_URL}/therapist/appointments?therapist_id=${therapistId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to create appointment');
            return response.json();
        },
        getAppointments: async (therapistId: string) => {
            const response = await fetch(`${API_BASE_URL}/therapist/appointments?therapist_id=${therapistId}`);
            if (!response.ok) throw new Error('Failed to fetch appointments');
            return response.json();
        },
        getPatientLogs: async (patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/therapist/patients/${patientId}/logs`);
            if (!response.ok) throw new Error('Failed to fetch patient logs');
            return response.json();
        },
        getPatientTasks: async (patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/therapist/patients/${patientId}/tasks`);
            if (!response.ok) throw new Error('Failed to fetch patient tasks');
            return response.json();
        },
        getAllPatientLogs: async (therapistId: string) => {
            const response = await fetch(`${API_BASE_URL}/therapist/patients/logs?therapist_id=${therapistId}`);
            if (!response.ok) throw new Error('Failed to fetch all patient logs');
            return response.json();
        },
        getPatientsActivityReport: async (therapistId: string) => {
            const response = await fetch(`${API_BASE_URL}/therapist/patients/activity-report?therapist_id=${therapistId}`);
            if (!response.ok) throw new Error('Failed to fetch patient activity report');
            return response.json();
        },
        getPatientProgress: async (patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/therapist/patients/${patientId}/progress`);
            if (!response.ok) throw new Error('Failed to fetch patient progress');
            return response.json();
        },
        getPatientBilling: async (patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/therapist/patients/${patientId}/billing`);
            if (!response.ok) throw new Error('Failed to fetch patient billing');
            return response.json();
        },
        getProfile: async (therapistId: string) => {
            const response = await fetch(`${API_BASE_URL}/therapist/profile?therapist_id=${therapistId}`);
            if (!response.ok) throw new Error('Failed to fetch profile');
            return response.json();
        },
        updateProfile: async (therapistId: string, data: any) => {
            const response = await fetch(`${API_BASE_URL}/therapist/profile?therapist_id=${therapistId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update profile');
            return response.json();
        },
        getPatientProfile: async (patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/therapist/patients/${patientId}/profile`);
            if (!response.ok) throw new Error('Failed to fetch patient profile');
            return response.json();
        },
        savePatientProfile: async (patientId: string, data: any) => {
            const response = await fetch(`${API_BASE_URL}/therapist/patients/${patientId}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to save patient profile');
            return response.json();
        }
    },

    // Caregiver Endpoints
    caregiver: {
        getTasks: async (caregiverId: string) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/tasks?caregiver_id=${caregiverId}`);
            if (!response.ok) throw new Error('Failed to fetch caregiver tasks');
            return response.json();
        },
        verifyTask: async (taskId: string, verified: boolean, notes?: string) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/verify-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task_id: taskId, verified, notes })
            });
            if (!response.ok) throw new Error('Failed to verify task');
            return response.json();
        },
        getDashboardStats: async (caregiverId: string) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/dashboard-stats?caregiver_id=${caregiverId}`);
            if (!response.ok) throw new Error('Failed to fetch dashboard stats');
            return response.json();
        },
        getPatients: async (caregiverId: string) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/patients?caregiver_id=${caregiverId}`);
            if (!response.ok) throw new Error('Failed to fetch patients');
            return response.json();
        },
        getPatientDetails: async (patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/patient/${patientId}`);
            if (!response.ok) throw new Error('Failed to fetch patient details');
            return response.json();
        },
        getPatientTasks: async (patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/patient/${patientId}/tasks`);
            if (!response.ok) throw new Error('Failed to fetch patient tasks');
            return response.json();
        },
        getPatientNotes: async (patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/patient/${patientId}/notes`);
            if (!response.ok) throw new Error('Failed to fetch patient notes');
            return response.json();
        },
        addNote: async (noteData: any) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData),
            });
            if (!response.ok) throw new Error('Failed to add note');
            return response.json();
        },
        getReports: async (caregiverId: string) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/reports?caregiver_id=${caregiverId}`);
            if (!response.ok) throw new Error('Failed to fetch reports');
            return response.json();
        },
        getCaregiverCode: async (userId: string) => {
            const response = await fetch(`${API_BASE_URL}/patient/caregiver-code?user_id=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch caregiver code');
            return response.json();
        },
        linkPatient: async (caregiverId: string, code: string) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/link-patient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caregiver_id: caregiverId, code })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to link patient');
            }
            return response.json();
        },
        getNotifications: async (caregiverId: string) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/notifications?caregiver_id=${caregiverId}`);
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return response.json();
        },
        getPatientProgress: async (patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/patient/${patientId}/progress`);
            if (!response.ok) throw new Error('Failed to fetch patient progress');
            return response.json();
        },
        updateProfile: async (userId: string, data: any) => {
            const response = await fetch(`${API_BASE_URL}/caregiver/profile/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update profile');
            return response.json();
        }
    },

    // Notification Endpoints (shared across all roles)
    notifications: {
        get: async (userId: string) => {
            const response = await fetch(`${API_BASE_URL}/notifications?user_id=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return response.json();
        },
        markAsRead: async (notificationId: string) => {
            const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            if (!response.ok) throw new Error('Failed to mark notification as read');
            return response.json();
        },
        markAllAsRead: async (userId: string) => {
            const response = await fetch(`${API_BASE_URL}/notifications/read-all?user_id=${userId}`, {
                method: 'PUT'
            });
            if (!response.ok) throw new Error('Failed to mark all as read');
            return response.json();
        },
        delete: async (notificationId: string) => {
            const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete notification');
            return response.json();
        },
        generate: async (userId: string) => {
            const response = await fetch(`${API_BASE_URL}/notifications/generate?user_id=${userId}`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error('Failed to generate notifications');
            return response.json();
        }
    },

    // Media Upload Endpoints
    media: {
        uploadMedia: async (data: {
            file_name: string;
            file_type: string;
            mime_type: string;
            file_size: number;
            file_data: string;
            description?: string;
        }, patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/uploads/upload?patient_id=${patientId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to upload media');
            }
            return response.json();
        },
        getPatientMedia: async (patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/uploads/patient/${patientId}`);
            if (!response.ok) throw new Error('Failed to fetch media');
            return response.json();
        },
        deleteMedia: async (mediaId: string, patientId: string) => {
            const response = await fetch(`${API_BASE_URL}/uploads/${mediaId}?patient_id=${patientId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete media');
            return response.json();
        }
    },

    // Admin Endpoints
    admin: {
        login: async (email: string, password: string) => {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Admin login failed');
            }
            return response.json();
        },
        getUsers: async (token: string) => {
            const response = await fetch(`${API_BASE_URL}/admin/users?token=${token}`);
            if (!response.ok) throw new Error('Failed to fetch users');
            return response.json();
        },
        removeTherapist: async (therapistId: string, token: string) => {
            const response = await fetch(`${API_BASE_URL}/admin/therapists/${therapistId}?token=${token}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to remove therapist');
            return response.json();
        },
        removePatient: async (patientId: string, token: string) => {
            const response = await fetch(`${API_BASE_URL}/admin/patients/${patientId}?token=${token}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to remove patient');
            return response.json();
        },
        removeCaregiver: async (caregiverId: string, token: string) => {
            const response = await fetch(`${API_BASE_URL}/admin/caregivers/${caregiverId}?token=${token}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to remove caregiver');
            return response.json();
        },
        getStats: async (token: string, period: string = 'weekly') => {
            const response = await fetch(`${API_BASE_URL}/admin/stats?token=${token}&period=${period}`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json();
        }
    }
};
