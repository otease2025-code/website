import { ArrowLeft, Plus, Trash2, Calendar, Clock, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { Button } from '../ui/button';
import { useState, useEffect } from 'react';
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { api } from '../../services/api';

interface TaskItem {
    id: string;
    title: string;
    selectedDates: string[];
    startTime: string;
    endTime: string;
}

export function ScheduleADL() {
    const navigate = useNavigate();
    const [selectedPatient, setSelectedPatient] = useState<string>("");
    const [patients, setPatients] = useState<any[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        startTime: '',
        endTime: ''
    });
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchPatients = () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id) {
                api.therapist.getPatients(user.id).then(setPatients).catch(console.error);
            }
        };

        fetchPatients();
        const interval = setInterval(fetchPatients, 120000);
        return () => clearInterval(interval);
    }, []);

    const handleAddTask = () => {
        if (!newTask.title || !newTask.startTime || !newTask.endTime || selectedDates.length === 0) {
            alert('Please fill in all task details and select at least one date');
            return;
        }

        const task: TaskItem = {
            id: Date.now().toString(),
            title: newTask.title,
            selectedDates: [...selectedDates],
            startTime: newTask.startTime,
            endTime: newTask.endTime
        };

        setTasks([...tasks, task]);
        setNewTask({ title: '', startTime: '', endTime: '' });
        setSelectedDates([]);
        setShowTaskForm(false);
    };

    const handleRemoveTask = (taskId: string) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    const toggleDate = (date: string) => {
        if (selectedDates.includes(date)) {
            setSelectedDates(selectedDates.filter(d => d !== date));
        } else {
            setSelectedDates([...selectedDates, date]);
        }
    };

    const handleSaveSchedule = async () => {
        if (!selectedPatient) {
            alert('Please select a patient first');
            return;
        }
        if (tasks.length === 0) {
            alert('Please add at least one task');
            return;
        }

        setIsSaving(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            // Create a task for each date for each task item
            for (const task of tasks) {
                for (const date of task.selectedDates) {
                    await api.therapist.assignTask(user.id, {
                        title: task.title,
                        patient_id: selectedPatient,
                        scheduled_date: date,
                        start_time: task.startTime,
                        end_time: task.endTime,
                        task_type: 'adl_schedule'
                    });
                }
            }

            alert('Schedule saved successfully!');
            setTasks([]);
            navigate('/therapist/home');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Generate next 14 days for date selection (IST dates)
    const getNext14Days = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push({
                value: date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), // IST date, en-CA gives YYYY-MM-DD
                label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })
            });
        }
        return dates;
    };

    const availableDates = getNext14Days();
    const selectedPatientData = patients.find(p => p.id === selectedPatient);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/therapist/home')}
                        className="flex items-center gap-2 text-gray-600 mb-3 hover:text-gray-800"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-[#6328FF]" />
                        Schedule ADL
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Create a personalized activity schedule for your patient</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Step 1: Patient Selection */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 bg-[#6328FF] text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                        Select Patient
                    </h3>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                        <SelectTrigger className="w-full bg-white border-gray-200">
                            <SelectValue placeholder="Choose a patient..." />
                        </SelectTrigger>
                        <SelectContent>
                            {patients.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name || p.email}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Step 2: Add Tasks (only shown when patient is selected) */}
                {selectedPatient && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 bg-[#6328FF] text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                            Add Tasks for {selectedPatientData?.name || 'Patient'}
                        </h3>

                        {/* Task List */}
                        {tasks.length > 0 && (
                            <div className="space-y-3 mb-4">
                                {tasks.map((task, index) => (
                                    <div key={task.id} className="bg-gradient-to-r from-[#FFF8E7] to-[#FFF5DC] rounded-xl p-4 border border-[#E8D9B5]">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">{task.title}</p>
                                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                    <Clock className="w-4 h-4" />
                                                    {task.startTime} - {task.endTime}
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {task.selectedDates.map(date => (
                                                        <span key={date} className="text-xs bg-[#C2D738] text-black px-2 py-1 rounded-full">
                                                            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveTask(task.id)}
                                                className="text-red-500 hover:text-red-700 p-2"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Task Button / Form */}
                        {!showTaskForm ? (
                            <Button
                                onClick={() => setShowTaskForm(true)}
                                className="w-full bg-white border-2 border-dashed border-[#6328FF] text-[#6328FF] hover:bg-[#6328FF]/5 h-14"
                                variant="outline"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add New Task
                            </Button>
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
                                <h4 className="font-semibold text-gray-800">New Task Details</h4>

                                <div className="space-y-2">
                                    <Label>Task Title</Label>
                                    <Input
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="e.g. Morning Exercise, Meditation, etc."
                                        className="bg-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Time</Label>
                                        <Input
                                            type="time"
                                            value={newTask.startTime}
                                            onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Time</Label>
                                        <Input
                                            type="time"
                                            value={newTask.endTime}
                                            onChange={(e) => setNewTask({ ...newTask, endTime: e.target.value })}
                                            className="bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Select Dates (multiple allowed)</Label>
                                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2 max-h-40 overflow-y-auto p-1">
                                        {availableDates.map(date => (
                                            <button
                                                key={date.value}
                                                onClick={() => toggleDate(date.value)}
                                                className={`p-2 rounded-lg text-xs font-medium transition-all ${selectedDates.includes(date.value)
                                                    ? 'bg-[#C2D738] text-black shadow-md'
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                    }`}
                                            >
                                                {date.label}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedDates.length > 0 && (
                                        <p className="text-sm text-[#6328FF] font-medium">{selectedDates.length} date(s) selected</p>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={() => {
                                            setShowTaskForm(false);
                                            setNewTask({ title: '', startTime: '', endTime: '' });
                                            setSelectedDates([]);
                                        }}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddTask}
                                        className="flex-1 bg-[#6328FF] hover:bg-[#5520E6] text-white"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Task
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Save Schedule (only shown when there are tasks) */}
                {selectedPatient && tasks.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 bg-[#6328FF] text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                            Save Schedule
                        </h3>
                        <p className="text-gray-600 mb-4">
                            You have {tasks.length} task(s) ready to be assigned to {selectedPatientData?.name || 'patient'}.
                        </p>
                        <Button
                            onClick={handleSaveSchedule}
                            disabled={isSaving}
                            className="w-full bg-gradient-to-r from-[#6328FF] to-[#9E98ED] hover:from-[#5520E6] hover:to-[#8A84D4] text-white h-14 text-lg font-semibold"
                        >
                            {isSaving ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Save Schedule
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            <TherapistBottomNav />
        </div>
    );
}
