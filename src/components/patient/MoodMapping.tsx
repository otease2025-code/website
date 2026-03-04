import { useState, useEffect } from 'react';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Smile } from 'lucide-react';
import '../../styles/patient-mood-background.css';
import { api } from '../../services/api';

export function MoodMapping() {
  const [primaryEmotion, setPrimaryEmotion] = useState<string | null>(null);
  const [secondaryEmotion, setSecondaryEmotion] = useState<string | null>(null);
  const [tertiaryEmotion, setTertiaryEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');
  const [recentMoods, setRecentMoods] = useState<any[]>([]);

  useEffect(() => {
    const fetchMoods = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        api.patient.getMoodHistory(user.id).then(data => {
          const moods = data.filter((entry: any) => entry.primary_emotion).slice(0, 5);
          setRecentMoods(moods);
        }).catch(console.error);
      }
    };

    fetchMoods();
    const interval = setInterval(fetchMoods, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  const emotionHierarchy: any = {
    Happy: {
      emoji: '😊',
      color: 'from-[#C2D738] to-[#EAFCFF]',
      secondary: {
        Optimistic: ['Hopeful', 'Inspired'],
        Intimate: ['Playful', 'Sensitive', 'Loving'],
        Peaceful: ['Thankful', 'Trusting', 'Relaxed'],
        Courageous: ['Confident', 'Daring', 'Creative'],
        Satisfied: ['Content', 'Fulfilled'],
        Proud: ['Successful', 'Respected', 'Important'],
        Curious: ['Inquisitive', 'Interested', 'Fascinated'],
        Joy: ['Excited', 'Energetic', 'Cheerful']
      }
    },
    Sad: {
      emoji: '😢',
      color: 'from-[#9E98ED] to-[#EAFCFF]',
      secondary: {
        Shame: ['Embarrassed', 'Humiliated', 'Isolated'],
        Apathetic: ['Bored', 'Indifferent'],
        Despair: ['Powerless', 'Grief', 'Vulnerable'],
        Depressed: ['Empty', 'Inferior', 'Abandoned'],
        Lonely: ['Isolated', 'Abandoned'],
        Guilt: ['Remorseful', 'Ashamed']
      }
    },
    Disgusted: {
      emoji: '🤢',
      color: 'from-[#C2D738] to-[#9E98ED]',
      secondary: {
        Disapproval: ['Judgemental', 'Loathing', 'Embarrassed'],
        Disappointed: ['Appalled', 'Revolted', 'Repelled'],
        Awful: ['Nauseated', 'Detestable'],
        Aversion: ['Hesitant', 'Horrified']
      }
    },
    Angry: {
      emoji: '😠',
      color: 'from-[#FE5C2B] to-[#FE97CF]',
      secondary: {
        Offended: ['Threatened', 'Insulted', 'Disrespected'],
        Insecure: ['Inadequate', 'Inferior', 'Worthless'],
        Hateful: ['Resentful', 'Violated', 'Jealous'],
        Mad: ['Furious', 'Hostile', 'Bitter'],
        Aggressive: ['Provoked', 'Frustrated', 'Hostile'],
        Irritated: ['Annoyed', 'Aggravated', 'Dismayed'],
        Distant: ['Withdrawn', 'Numb', 'Suspicious'],
        Critical: ['Skeptical', 'Dismissive', 'Sarcastic']
      }
    },
    Fearful: {
      emoji: '😰',
      color: 'from-[#6328FF] to-[#9E98ED]',
      secondary: {
        Scared: ['Frightened', 'Helpless', 'Terrified'],
        Anxious: ['Overwhelmed', 'Worried', 'Inadequate'],
        Powerless: ['Worthless', 'Insignificant', 'Weak'],
        Inferior: ['Inadequate', 'Worthless'],
        Unwanted: ['Rejected', 'Excluded', 'Persecuted'],
        Embarrassed: ['Humiliated', 'Self-conscious']
      }
    },
    Bad: {
      emoji: '😞',
      color: 'from-[#9E98ED] to-[#FE97CF]',
      secondary: {
        Bored: ['Indifferent', 'Apathetic'],
        Busy: ['Pressured', 'Rushed', 'Overwhelmed'],
        Stressed: ['Out of control', 'Anxious', 'Overwhelmed'],
        Tired: ['Sleepy', 'Unfocused', 'Exhausted']
      }
    },
    Surprised: {
      emoji: '😲',
      color: 'from-[#FE97CF] to-[#EAFCFF]',
      secondary: {
        Excitement: ['Eager', 'Energetic', 'Enthusiastic'],
        Awe: ['Amazed', 'Astonished', 'Moved'],
        Confusion: ['Disillusioned', 'Perplexed', 'Shocked'],
        Shock: ['Startled', 'Dismayed', 'Stunned']
      }
    }
  };

  const handleSave = async () => {
    if (!primaryEmotion) {
      alert('Please select a primary emotion');
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.patient.submitMood(user.id, {
        mood_score: intensity,
        primary_emotion: primaryEmotion,
        secondary_emotion: secondaryEmotion || undefined,
        tertiary_emotion: tertiaryEmotion || undefined,
        journal_text: notes
      });
      alert('Mood saved successfully!');
      setPrimaryEmotion(null);
      setSecondaryEmotion(null);
      setTertiaryEmotion(null);
      setIntensity(5);
      setNotes('');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handlePrimarySelect = (emotion: string) => {
    setPrimaryEmotion(emotion);
    setSecondaryEmotion(null);
    setTertiaryEmotion(null);
  };

  return (
    <div className="min-h-screen patient-mood-bg pb-20">
      {/* Header */}
      <div className="bg-black p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-black flex items-center gap-2">
            Mood Mapping <Smile className="w-7 h-7 text-[#C2D738]" />
          </h1>
          <p className="text-black font-semibold text-lg">How are you feeling today?</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Emotions */}
        <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5]">
          <h3 className="text-black font-semibold mb-4">Select Emotion</h3>
          <div className="grid grid-cols-4 gap-3">
            {Object.keys(emotionHierarchy).map((emotion) => (
              <button
                key={emotion}
                onClick={() => handlePrimarySelect(emotion)}
                className={`p-4 rounded-2xl transition-all transform hover:scale-105 ${primaryEmotion === emotion
                  ? 'bg-[#C2D738] shadow-lg scale-105'
                  : 'bg-white shadow-sm hover:bg-[#E8D9B5] border border-[#E8D9B5]'
                  }`}
              >
                <div className="text-4xl mb-2">{emotionHierarchy[emotion].emoji}</div>
                <p className="text-xs font-medium text-black">
                  {emotion}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/*Secondary Emotions */}
        {primaryEmotion && (
          <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5]">
            <h3 className="text-black font-semibold mb-4">Secondary Emotion</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(emotionHierarchy[primaryEmotion].secondary).map((emotion) => (
                <button
                  key={emotion}
                  onClick={() => {
                    setSecondaryEmotion(emotion);
                    setTertiaryEmotion(null);
                  }}
                  className={`p-3 rounded-xl transition-all ${secondaryEmotion === emotion
                    ? 'bg-[#C2D738] text-black shadow-md'
                    : 'bg-white text-black hover:bg-[#E8D9B5] border border-[#E8D9B5]'
                    }`}
                >
                  <p className="text-sm font-medium">{emotion}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/*Tertiary Emotions */}
        {primaryEmotion && secondaryEmotion && (
          <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5]">
            <h3 className="text-black font-semibold mb-4">Exact Feeling</h3>
            <div className="flex flex-wrap gap-2">
              {emotionHierarchy[primaryEmotion].secondary[secondaryEmotion].map((emotion: string) => (
                <button
                  key={emotion}
                  onClick={() => setTertiaryEmotion(emotion)}
                  className={`px-4 py-2 rounded-full transition-all ${tertiaryEmotion === emotion
                    ? 'bg-[#C2D738] text-black shadow-md'
                    : 'bg-white text-black hover:bg-[#E8D9B5] border border-[#E8D9B5]'
                    }`}
                >
                  <p className="text-sm font-medium">{emotion}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Emotion Summary */}
        {primaryEmotion && (
          <div className="bg-[#9E98ED] rounded-3xl p-6 shadow-lg">
            <h3 className="text-black font-semibold mb-3">Your Selected Emotion:</h3>
            <div className="flex items-center gap-2 text-lg flex-wrap">
              <span className="text-3xl">{emotionHierarchy[primaryEmotion].emoji}</span>
              <span className="font-bold text-black">{primaryEmotion}</span>
              {secondaryEmotion && (
                <>
                  <span className="text-black/60">→</span>
                  <span className="font-semibold text-black/90">{secondaryEmotion}</span>
                </>
              )}
              {tertiaryEmotion && (
                <>
                  <span className="text-black/60">→</span>
                  <span className="text-black/80">{tertiaryEmotion}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Intensity Scale */}
        {primaryEmotion && (
          <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5]">
            <h3 className="text-black font-semibold mb-4">Emotion Intensity</h3>
            <div className="space-y-4">
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none bg-[#E8D9B5]"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>Low (1)</span>
                <span className="text-black font-bold">{intensity}</span>
                <span>High (10)</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Notes */}
        <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5]">
          <h3 className="text-black font-semibold mb-4">Additional Notes</h3>
          <Textarea
            placeholder="What's on your mind? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px] bg-white"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!primaryEmotion}
          className={`w-full py-5 rounded-xl font-bold text-lg transition-all shadow-md ${primaryEmotion
            ? 'bg-[#9E98ED] text-black hover:shadow-xl hover:scale-[1.02]'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          Save
        </button>



        {/* Recent Entries */}
        <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-md border border-[#E8D9B5]">
          <h3 className="text-black font-semibold mb-4">Recent Moods</h3>
          <div className="space-y-3">
            {recentMoods.map((mood, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E8D9B5]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8D9B5] flex items-center justify-center text-xl">
                    😊
                  </div>
                  <div>
                    <p className="font-bold text-black">{mood.primary_emotion}</p>
                    <p className="text-xs text-gray-600">{new Date(mood.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="font-bold text-black">{mood.mood_score}/10</div>
              </div>
            ))}
            {recentMoods.length === 0 && <p className="text-gray-500 text-center">No recent moods.</p>}
          </div>
        </div>
      </div>

      <PatientBottomNav />
    </div>
  );
}
