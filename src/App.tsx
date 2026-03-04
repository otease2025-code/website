import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth Components
import { Landing } from './components/auth/Landing';
import { Login } from './components/auth/Login';
import { SignUp } from './components/auth/SignUp';
import { ForgotPassword } from './components/auth/ForgotPassword';

// Therapist Components
import { TherapistHome } from './components/therapist/TherapistHome';
import { PatientsList } from './components/therapist/PatientsList';
import { AddPatient } from './components/therapist/AddPatient';
import { PatientDetails } from './components/therapist/PatientDetails';
import { TaskAssignment } from './components/therapist/TaskAssignment';
import { OTAssessment } from './components/therapist/OTAssessment';
import { PatientLogs } from './components/therapist/PatientLogs';
import { TherapistSchedule } from './components/therapist/TherapistSchedule';
import { ScheduleADL } from './components/therapist/ScheduleADL';
import { TherapistServices } from './components/therapist/TherapistServices';
import { TherapistDiscover } from './components/therapist/TherapistDiscover';
import { TherapistReport } from './components/therapist/TherapistReport';
import { TherapistAccount } from './components/therapist/TherapistAccount';
import { TherapistBilling } from './components/therapist/TherapistBilling';
import { PatientBillingDetails } from './components/therapist/PatientBillingDetails';
import { TherapistNotifications } from './components/therapist/TherapistNotifications';
import { PatientMedia } from './components/therapist/PatientMedia';
import { TherapistProfile } from './components/therapist/TherapistProfile';

// Patient Components
import { PatientHome } from './components/patient/PatientHome';
import { PatientTasks } from './components/patient/PatientTasks';
import { MoodMapping } from './components/patient/MoodMapping';
import { HappyJournal } from './components/patient/HappyJournal';

import { TrackProgress } from './components/patient/TrackProgress';
import { PatientSchedule } from './components/patient/PatientSchedule';
import { PatientServices } from './components/patient/PatientServices';
import { MyLogs } from './components/patient/MyLogs';
import { Notifications } from './components/patient/Notifications';
import { PatientAccount } from './components/patient/PatientAccount';
import { PatientBilling } from './components/patient/PatientBilling';
import { MediaUpload } from './components/patient/MediaUpload';

// Caregiver Components
import { CaregiverLogin } from './components/caregiver/CaregiverLogin';
import { TherapistLogs } from './components/therapist/TherapistLogs';
import { CaregiverHome } from './components/caregiver/CaregiverHome';
import { CaregiverPatients } from './components/caregiver/CaregiverPatients';
import { CaregiverPatientDetails } from './components/caregiver/CaregiverPatientDetails';
import { VerifyTasks } from './components/caregiver/VerifyTasks';
import { CaregiverReports } from './components/caregiver/CaregiverReports';
import { CaregiverAccount } from './components/caregiver/CaregiverAccount';
import { CaregiverNotifications } from './components/caregiver/CaregiverNotifications';

// Admin Components
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Therapist Routes */}
        <Route path="/therapist/home" element={<TherapistHome />} />
        <Route path="/therapist/patients" element={<PatientsList />} />
        <Route path="/therapist/add-patient" element={<AddPatient />} />
        <Route path="/therapist/patient-details/:id" element={<PatientDetails />} />
        <Route path="/therapist/task-assignment" element={<TaskAssignment />} />
        <Route path="/therapist/task-assignment/:id" element={<TaskAssignment />} />
        <Route path="/therapist/tasks" element={<TaskAssignment />} />
        <Route path="/therapist/assessment/:id" element={<OTAssessment />} />
        <Route path="/therapist/logs" element={<TherapistLogs />} />
        <Route path="/therapist/patient-logs/:id" element={<PatientLogs />} />
        <Route path="/therapist/schedule" element={<TherapistSchedule />} />
        <Route path="/therapist/schedule-adl" element={<ScheduleADL />} />
        <Route path="/therapist/services" element={<TherapistServices />} />
        <Route path="/therapist/discover" element={<TherapistDiscover />} />
        <Route path="/therapist/report" element={<TherapistReport />} />
        <Route path="/therapist/account" element={<TherapistAccount />} />
        <Route path="/therapist/billing" element={<TherapistBilling />} />
        <Route path="/therapist/patient-billing/:id" element={<PatientBillingDetails />} />
        <Route path="/therapist/patient-media/:id" element={<PatientMedia />} />
        <Route path="/therapist/notifications" element={<TherapistNotifications />} />
        <Route path="/therapist/profile" element={<TherapistProfile />} />

        {/* Patient Routes */}
        <Route path="/patient/home" element={<PatientHome />} />
        <Route path="/patient/tasks" element={<PatientTasks />} />
        <Route path="/patient/mood-mapping" element={<MoodMapping />} />
        <Route path="/patient/happy-journal" element={<HappyJournal />} />

        <Route path="/patient/progress" element={<TrackProgress />} />
        <Route path="/patient/schedule" element={<PatientSchedule />} />
        <Route path="/patient/services" element={<PatientServices />} />
        <Route path="/patient/logs" element={<MyLogs />} />
        <Route path="/patient/notifications" element={<Notifications />} />
        <Route path="/patient/account" element={<PatientAccount />} />
        <Route path="/patient/billing" element={<PatientBilling />} />
        <Route path="/patient/media" element={<MediaUpload />} />
        <Route path="/patient/report" element={<MyLogs />} />

        {/* Caregiver Routes */}
        <Route path="/caregiver/login" element={<CaregiverLogin />} />
        <Route path="/caregiver/home" element={<CaregiverHome />} />
        <Route path="/caregiver/patients" element={<CaregiverPatients />} />
        <Route path="/caregiver/patient-details/:id" element={<CaregiverPatientDetails />} />
        <Route path="/caregiver/verify-tasks" element={<VerifyTasks />} />
        <Route path="/caregiver/reports" element={<CaregiverReports />} />
        <Route path="/caregiver/account" element={<CaregiverAccount />} />
        <Route path="/caregiver/notifications" element={<CaregiverNotifications />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
