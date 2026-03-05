import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { Calendar } from '../ui/calendar';
import { useState, useEffect } from 'react';
import { Clock, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';

export function TherapistSchedule() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [newAppt, setNewAppt] = useState({
    patientId: '',
    time: '',
    isRecurring: false
  });

  useEffect(() => {
    const fetchData = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        api.therapist.getPatients(user.id).then(setPatients).catch(console.error);
        api.therapist.getAppointments(user.id).then(setAppointments).catch(console.error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  const handleCreateAppointment = async () => {
    if (!newAppt.patientId || !newAppt.time || !date) {
      alert('Please fill all details');
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Combine date and time
      const dateTime = new Date(date);
      const [hours, minutes] = newAppt.time.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));

      await api.therapist.createAppointment(user.id, {
        patient_id: newAppt.patientId,
        datetime: dateTime.toISOString(),
        is_recurring: newAppt.isRecurring
      });
      alert('Appointment created!');
      setNewAppt({ patientId: '', time: '', isRecurring: false });
      // Refresh appointments
      api.therapist.getAppointments(user.id).then(setAppointments).catch(console.error);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">Appointments & sessions</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Calendar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
          />
        </div>

        {/* Create Appointment */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-gray-800 font-semibold">New Appointment</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={newAppt.patientId} onValueChange={(val) => setNewAppt({ ...newAppt, patientId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name || p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={newAppt.time}
                onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
              />
            </div>
            <Button
              onClick={handleCreateAppointment}
              className="w-full bg-gradient-to-r from-[#6328FF] to-[#9E98ED] text-white"
            >
              Create Appointment
            </Button>
          </div>
        </div>

        {/* Existing Appointments */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-gray-800 font-semibold">Upcoming Appointments</h3>
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-sm">No appointments scheduled.</p>
            ) : (
              appointments.map((appt: any) => {
                const patient = patients.find(p => p.id === appt.patient_id);
                return (
                  <div key={appt.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-800">{patient ? (patient.name || patient.email) : 'Unknown Patient'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(appt.datetime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })} at {new Date(appt.datetime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      Confirmed
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <TherapistBottomNav />
    </div>
  );
}
