import { useState, ChangeEvent, useEffect } from 'react';
import { api } from '../../services/api';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, ChevronDown, ChevronUp, Mic, Play, Trash2, Save, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";

type TaskCategory = {
  name: string;
  tasks: string[];
};

type SelectedTask = {
  category: string;
  task: string;
  instructions: string;
  hasVoiceMessage: boolean;
  startTime?: string;
  endTime?: string;
};

type Template = {
  id: string;
  name: string;
  tasks: SelectedTask[];
};

export function TaskAssignment() {
  const navigate = useNavigate();
  // Changed from selectedDays to selectedDates
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPatients = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('[TaskAssignment] Therapist user from localStorage:', user);
      if (user.id) {
        api.therapist.getPatients(user.id)
          .then(data => {
            console.log('[TaskAssignment] Patients received from API:', data);
            setPatients(data);
          })
          .catch(err => {
            console.error('[TaskAssignment] Failed to fetch patients:', err);
          });
      } else {
        console.warn('[TaskAssignment] No user.id found in localStorage!');
      }
    };

    fetchPatients();
    const interval = setInterval(fetchPatients, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  // Generate next 14 days for selection
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    return {
      date: targetDate,
      iso: targetDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
      display: targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' }),
      dayName: targetDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
      dayNumber: parseInt(targetDate.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'Asia/Kolkata' }))
    };
  });

  const toggleDate = (dateIso: string) => {
    setSelectedDates(prev =>
      prev.includes(dateIso) ? prev.filter(d => d !== dateIso) : [...prev, dateIso]
    );
  };

  // Template State
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Anxiety Management Starter',
      tasks: [
        { category: 'Emotional Regulation', task: 'Deep breathing', instructions: 'Practice 4-7-8 breathing for 5 minutes.', hasVoiceMessage: false },
        { category: 'Mindfulness Activities', task: 'Guided meditation', instructions: '5-4-3-2-1 grounding technique.', hasVoiceMessage: true }
      ]
    },
    {
      id: '2',
      name: 'Depression Activation',
      tasks: [
        { category: 'Physical Activities', task: 'Light indoor exercise', instructions: '10 minutes of gentle movement.', hasVoiceMessage: false },
        { category: 'Leisure / Hobbies', task: 'Painting', instructions: 'Spend 15 minutes painting freely.', hasVoiceMessage: false }
      ]
    },
    {
      id: '3',
      name: 'Standard Daily Routine',
      tasks: [
        { category: 'Daily Routines', task: 'Morning Routine', instructions: 'Brush teeth, wash face, drink water.', hasVoiceMessage: false, startTime: '06:00', endTime: '07:00' },
        { category: 'Daily Routines', task: 'Exercise/Walking', instructions: 'Light walking in the garden.', hasVoiceMessage: false, startTime: '07:00', endTime: '08:00' },
        { category: 'Daily Routines', task: 'Dressing', instructions: 'Wear comfortable clothes.', hasVoiceMessage: false, startTime: '11:00', endTime: '12:00' },
        { category: 'Daily Routines', task: 'Lunch', instructions: 'Healthy balanced meal.', hasVoiceMessage: false, startTime: '13:00', endTime: '14:00' },
        { category: 'Daily Routines', task: 'Physical Therapy', instructions: 'Follow PT exercises.', hasVoiceMessage: false, startTime: '15:00', endTime: '16:00' },
        { category: 'Daily Routines', task: 'Evening Routine', instructions: 'Wind down, read a book.', hasVoiceMessage: false, startTime: '16:00', endTime: '17:00' }
      ]
    }
  ]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const categories: TaskCategory[] = [
    {
      name: 'Daily Routines',
      tasks: ['Morning Routine', 'Exercise/Walking', 'Dressing', 'Lunch', 'Physical Therapy', 'Evening Routine']
    },
    {
      name: 'Mood Boosting',
      tasks: ['Listening to calm music', 'Doodling', 'Gardening', 'Interest based']
    },
    {
      name: 'Emotional Regulation',
      tasks: ['Deep breathing', 'Grounding', 'JPMR', 'Naming emotion exercises']
    },
    {
      name: 'Leisure / Hobbies',
      tasks: ['Painting', 'Playing an instrument']
    },
    {
      name: 'Coping Skills',
      tasks: ['Journaling', 'Interest checklist', 'Reframing -ve (negative) thoughts', 'Emotional Wheel']
    },
    {
      name: 'Mindfulness Activities',
      tasks: ['Guided meditation', 'Mindful eating (one snack)', 'Body scan exercise', 'Breath counting', 'Slow mindful walk', 'Observing surrounding for 1 min']
    },
    {
      name: 'Physical Activities',
      tasks: ['Stretching', 'Chair yoga', 'Light indoor exercise', 'Breathing with arm movements']
    }
  ];

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };

  const addTask = (category: string, task: string) => {
    if (!selectedTasks.some((t: SelectedTask) => t.task === task)) {
      setSelectedTasks([...selectedTasks, { category, task, instructions: '', hasVoiceMessage: false }]);
    }
  };

  const removeTask = (taskName: string) => {
    setSelectedTasks(selectedTasks.filter((t: SelectedTask) => t.task !== taskName));
  };

  const updateInstructions = (taskName: string, instructions: string) => {
    setSelectedTasks(selectedTasks.map((t: SelectedTask) =>
      t.task === taskName ? { ...t, instructions } : t
    ));
  };

  const updateTime = (taskName: string, field: 'startTime' | 'endTime', value: string) => {
    setSelectedTasks(selectedTasks.map((t: SelectedTask) =>
      t.task === taskName ? { ...t, [field]: value } : t
    ));
  };

  const toggleVoiceMessage = (taskName: string) => {
    setSelectedTasks(selectedTasks.map((t: SelectedTask) =>
      t.task === taskName ? { ...t, hasVoiceMessage: !t.hasVoiceMessage } : t
    ));
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: newTemplateName,
      tasks: [...selectedTasks]
    };
    setTemplates([...templates, newTemplate]);
    setIsSaveDialogOpen(false);
    setNewTemplateName('');
    alert('Template saved successfully!');
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTasks([...template.tasks]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/therapist/home')}
              className="flex items-center gap-2 text-gray-600 mb-3"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">Task Assignment</h1>
          </div>

          {/* Load Template Dropdown */}
          <div className="flex items-center gap-2">
            <Select onValueChange={loadTemplate}>
              <SelectTrigger className="w-[200px] bg-white border-gray-200">
                <SelectValue placeholder="Load Template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="space-y-2">
            <Label>Patient Name</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select Patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name || patient.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Patient ID: <span className="text-gray-800">{selectedPatient ? `#${selectedPatient.substring(0, 8).toUpperCase()}` : 'Select a patient'}</span></p>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Select Dates:
            </Label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {next14Days.map((day) => (
                <button
                  key={day.iso}
                  onClick={() => toggleDate(day.iso)}
                  className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${selectedDates.includes(day.iso)
                    ? 'bg-[#C2D738] border-[#C2D738] text-black shadow-md'
                    : 'bg-white border-gray-100 text-gray-600 hover:border-[#C2D738] hover:bg-yellow-50/50'
                    }`}
                >
                  <span className="text-xs font-medium uppercase opacity-70">{day.dayName}</span>
                  <span className="text-lg font-bold">{day.dayNumber}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-right mt-1">Select dates to assign these tasks to.</p>
          </div>
        </div>

        {/* Categories Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-800 mb-4 font-semibold">Select Activities</h3>
          <div className="space-y-3">
            {categories.map((category: TaskCategory) => (
              <div key={category.name} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-700">{category.name}</span>
                  {expandedCategory === category.name ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {expandedCategory === category.name && (
                  <div className="p-4 bg-white border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.tasks.map((task: string) => {
                      const isSelected = selectedTasks.some((t: SelectedTask) => t.task === task);
                      return (
                        <button
                          key={task}
                          onClick={() => isSelected ? removeTask(task) : addTask(category.name, task)}
                          className={`p-3 rounded-lg text-left text-sm transition-all ${isSelected
                            ? 'bg-[#6328FF]/10 text-[#6328FF] border border-[#6328FF]'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-[#6328FF]/50'
                            }`}
                        >
                          {task}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Tasks Configuration */}
        {selectedTasks.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-800 font-semibold">Configure Selected Tasks</h3>

              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-[#6328FF] border-[#6328FF] hover:bg-[#6328FF]/10">
                    <Save className="w-4 h-4" />
                    Save as Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Save Template</DialogTitle>
                    <DialogDescription>
                      Give your template a name to easily load it later.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., Anxiety Protocol A"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleSaveTemplate} className="bg-[#6328FF] hover:bg-[#5520E6]">Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-6">
              {selectedTasks.map((item: SelectedTask, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{item.task}</h4>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <button
                      onClick={() => removeTask(item.task)}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Time Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Start Time
                      </Label>
                      <Input
                        type="time"
                        value={item.startTime || ''}
                        onChange={(e) => updateTime(item.task, 'startTime', e.target.value)}
                        className="bg-white h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> End Time
                      </Label>
                      <Input
                        type="time"
                        value={item.endTime || ''}
                        onChange={(e) => updateTime(item.task, 'endTime', e.target.value)}
                        className="bg-white h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Instructions</Label>
                    <Textarea
                      placeholder="Add specific instructions for the patient..."
                      value={item.instructions}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateInstructions(item.task, e.target.value)}
                      className="bg-white text-sm"
                    />
                  </div>


                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full bg-gradient-to-r from-[#6328FF] to-[#9E98ED] hover:from-[#5520E6] hover:to-[#8A84D4] text-white h-12"
          disabled={isSubmitting || !selectedPatient || selectedTasks.length === 0 || selectedDates.length === 0}
          onClick={async () => {
            if (!selectedPatient) {
              alert('Please select a patient');
              return;
            }
            if (selectedTasks.length === 0) {
              alert('Please select at least one task');
              return;
            }
            if (selectedDates.length === 0) {
              alert('Please select at least one date');
              return;
            }

            // Check time is set for all tasks
            const missingTime = selectedTasks.find(t => !t.startTime || !t.endTime);
            if (missingTime) {
              alert(`Please set Start Time and End Time for "${missingTime.task}"`);
              return;
            }

            setIsSubmitting(true);
            try {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              // Create a task for each selected task and each selected date
              for (const task of selectedTasks) {
                for (const dateIso of selectedDates) {
                  await api.therapist.assignTask(user.id, {
                    title: task.task,
                    description: task.instructions,
                    patient_id: selectedPatient,
                    scheduled_date: dateIso,
                    start_time: task.startTime || '09:00',
                    end_time: task.endTime || '10:00',
                    task_type: 'therapist_task'
                  });
                }
              }
              alert('Tasks assigned successfully!');
              navigate('/therapist/home');
            } catch (error) {
              console.error('Failed to assign tasks:', error);
              alert('Failed to assign tasks. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {isSubmitting ? 'ASSIGNING...' : 'ASSIGN TASKS'}
        </Button>
      </div>

      <TherapistBottomNav />
    </div>
  );
}
