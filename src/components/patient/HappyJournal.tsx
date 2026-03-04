import { useState, useEffect } from 'react';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Heart, Sparkles, BookOpen, Calendar } from 'lucide-react';
import '../../styles/patient-journal-background.css';
import { api } from '../../services/api';

export function HappyJournal() {
  const [entry, setEntry] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dayRating, setDayRating] = useState<number | null>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  const tags = ['Family', 'Friends', 'Achievement', 'Nature', 'Food', 'Hobby', 'Self-care', 'Gratitude'];

  useEffect(() => {
    const fetchEntries = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        api.patient.getMoodHistory(user.id).then(data => {
          const journals = data.filter((entry: any) => !entry.primary_emotion && entry.journal_text).slice(0, 3);
          setRecentEntries(journals);
        }).catch(console.error);
      }
    };

    fetchEntries();
    const interval = setInterval(fetchEntries, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!dayRating) {
      alert('Please rate your day before saving!');
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const journalText = `${entry}\nTags: ${selectedTags.join(', ')}`;
      await api.patient.submitMood(user.id, {
        mood_score: dayRating,
        journal_text: journalText
      });
      alert('Journal entry saved!');
      setEntry('');
      setSelectedTags([]);
      setDayRating(null);
      // Refresh recent entries
      const data = await api.patient.getMoodHistory(user.id);
      const journals = data.filter((entry: any) => !entry.primary_emotion && entry.journal_text).slice(0, 3);
      setRecentEntries(journals);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen patient-journal-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <PatientBottomNav />
            <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-black flex items-center gap-2">
              Happy Journal <BookOpen className="w-8 h-8 text-[#6328FF]" />
            </h1>
          </div>
          <p className="text-black font-semibold text-lg ml-12">Capture your happy moments!</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Entry Area */}
        <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5]">
          <h3 className="text-black font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6328FF]" />
            What made you smile today?
          </h3>
          <Textarea
            placeholder="Write about a positive experience..."
            className="w-full h-40 rounded-xl border-[#E8D9B5] bg-white focus:border-[#9E98ED] focus:ring-[#9E98ED] mb-4"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
          />

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Add Tags:</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${selectedTags.includes(tag)
                    ? 'bg-[#C2D738] text-black shadow-md'
                    : 'bg-white text-black hover:bg-[#E8D9B5] border border-[#E8D9B5]'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Rate your day:</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setDayRating(rating)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${dayRating === rating
                    ? 'bg-[#C2D738] text-black shadow-md scale-110'
                    : 'bg-white text-black hover:bg-[#E8D9B5] border border-[#E8D9B5]'
                    }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full py-6 text-lg font-bold rounded-2xl bg-[#9E98ED] hover:bg-[#8878DD] transition-all shadow-lg text-white"
          >
            Save Entry
          </Button>
        </div>

        {/* Previous Entries */}
        <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5]">
          <h3 className="text-black font-semibold mb-4">Previous Entries</h3>
          <div className="space-y-4">
            {recentEntries.map((prev, index) => (
              <div key={index} className="p-4 bg-white rounded-xl border border-[#E8D9B5]">
                <p className="text-xs text-gray-500 mb-2">{new Date(prev.created_at).toLocaleDateString()}</p>
                <p className="text-black mb-3">{prev.journal_text}</p>
                {prev.mood_score && (
                  <div className="flex gap-1 mb-2">
                    {[...Array(prev.mood_score)].map((_, i) => (
                      <Heart key={i} className="w-3 h-3 text-[#FE97CF] fill-current" />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {recentEntries.length === 0 && <p className="text-gray-500 text-center">No recent entries.</p>}
          </div>
        </div>
      </div>

      <PatientBottomNav />
    </div>
  );
}
