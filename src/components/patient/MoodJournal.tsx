import { useState } from 'react';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Slider } from '../ui/slider';
import { PenTool } from 'lucide-react';
import '../../styles/patient-mood-journal-background.css';

export function MoodJournal() {
  const [reflection, setReflection] = useState('');
  const [energy, setEnergy] = useState([5]);
  const [sleepQuality, setSleepQuality] = useState([5]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [physicalActivity, setPhysicalActivity] = useState('');
  const [mealsToday, setMealsToday] = useState('');

  const handleSave = () => {
    if (!reflection.trim()) {
      alert('Please write some thoughts before saving!');
      return;
    }
    alert('Journal entry saved!');
    setReflection('');
    setEnergy([5]);
    setSleepQuality([5]);
    setStressLevel([5]);
    setPhysicalActivity('');
    setMealsToday('');
  };

  return (
    <div className="min-h-screen patient-mood-journal-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-black flex items-center gap-2">
            Mood Journal <PenTool className="w-7 h-7 text-[#6328FF]" />
          </h1>
          <p className="text-black font-semibold text-lg">Reflect on your emotional state</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Energy Level */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#9E98ED]">
          <h3 className="text-black font-semibold mb-4">Energy Level</h3>
          <Slider
            value={energy}
            onValueChange={setEnergy}
            max={10}
            min={1}
            step={1}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-black font-medium">
            <span>Low</span>
            <span className="text-[#6328FF] font-bold">{energy[0]}/10</span>
            <span>High</span>
          </div>
        </div>

        {/* Sleep Quality */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#9E98ED]">
          <h3 className="text-black font-semibold mb-4">Sleep Quality</h3>
          <Slider
            value={sleepQuality}
            onValueChange={setSleepQuality}
            max={10}
            min={1}
            step={1}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-black font-medium">
            <span>Poor</span>
            <span className="text-[#6328FF] font-bold">{sleepQuality[0]}/10</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Stress Level */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#9E98ED]">
          <h3 className="text-black font-semibold mb-4">Stress Level</h3>
          <Slider
            value={stressLevel}
            onValueChange={setStressLevel}
            max={10}
            min={1}
            step={1}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-black font-medium">
            <span>Low</span>
            <span className="text-[#6328FF] font-bold">{stressLevel[0]}/10</span>
            <span>High</span>
          </div>
        </div>

        {/* Physical Activity */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#9E98ED]">
          <h3 className="text-black font-semibold mb-4">Physical Activity Today</h3>
          <Textarea
            placeholder="Describe any physical activities you did today (walking, exercise, yoga, etc.)"
            value={physicalActivity}
            onChange={(e) => setPhysicalActivity(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Meals */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#9E98ED]">
          <h3 className="text-black font-semibold mb-4">Meals Today</h3>
          <Textarea
            placeholder="What did you eat today? How did you feel about your meals?"
            value={mealsToday}
            onChange={(e) => setMealsToday(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Written Reflection */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#9E98ED]">
          <h3 className="text-black font-semibold mb-4">Daily Reflection</h3>
          <Textarea
            placeholder="Reflect on your day... What went well? What challenges did you face? What are you grateful for?"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="min-h-[150px]"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-[#6328FF] hover:bg-[#5020dd] text-white py-4 rounded-xl font-bold transition-all"
        >
          Save Journal Entry
        </button>

        {/* Entry History Preview */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#9E98ED]">
          <h3 className="text-black font-semibold mb-4">Recent Entries</h3>
          <div className="space-y-3">
            {[
              { date: 'Oct 21, 2025', mood: '😊', preview: 'Feeling great today! Had a productive morning...' },
              { date: 'Oct 20, 2025', mood: '😐', preview: 'Just an okay day. Nothing special...' },
            ].map((entry, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-[#9E98ED]/30 to-[#FE97CF]/20 rounded-xl border border-[#6328FF]/30">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{entry.mood}</span>
                  <span className="text-xs text-black font-medium">{entry.date}</span>
                </div>
                <p className="text-sm text-black">{entry.preview}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PatientBottomNav />
    </div>
  );
}
