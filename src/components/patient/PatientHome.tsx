import { useNavigate } from 'react-router-dom';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import '../../styles/patient-home-background.css';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';

// All quotes from quotes.txt (cleaned)
const allQuotes = [
  "Our greatest glory is not in never falling, but in rising up every time we fail. – Ralph Waldo Emerson",
  "I am not what happened to me. I am what I choose to become. – Carl Jung",
  "Rock bottom became the solid foundation on which I rebuilt my life. – J.K. Rowling",
  "The greatest glory in living lies not in never falling, but in rising every time we fall. – Nelson Mandela",
  "Strength grows in the moments when you think you can't go on, but you keep going anyway.",
  "I am better off healed than I ever was unbroken. – Beth Moore",
  "Survival is your strength, not your shame. – Brittany Burgunder",
  "The world breaks everyone, and afterward, some are strong at the broken places. – Ernest Hemingway",
  "Resilience is knowing that you are the only one that has the power and the responsibility to pick yourself up. – Mary Holloway",
  "You have been assigned this mountain to show others it can be moved. – Mel Robbins",
  "You are worthy.",
  "You are enough just as you are. – Meghan Markle",
  "You are stronger than you think, and braver than you believe. – A.A. Milne",
  "You are allowed to be both a masterpiece and a work in progress simultaneously. – Sophia Bush",
  "You deserve to take up space.",
  "You are loved.",
  "You are a good person. It is not your fault.",
  "It is ok if all you did today was breathe.",
  "I am not a mistake. I am not fundamentally flawed.",
  "I am worth taking care of.",
  "There is no timestamp on trauma. Be patient. Take up space. Let your journey be the balm. – Dawn Serra",
  "Healing is a matter of time, but it is sometimes also a matter of opportunity. – Hippocrates",
  "Recovery is about progression, not perfection.",
  "It does not matter how slowly you go as long as you do not stop. – Confucius",
  "Think of healing as being like the physical healing of a wound — one step at a time.",
  "I will be patient and love myself as I heal.",
  "Tomorrow will be a new day.",
  "Healing takes courage, and we all have courage, even if we have to dig a little to find it. – Tori Amos",
  "The sun will rise and we will try again.",
  "Sometimes the smallest step in the right direction ends up being the biggest step of your life. – Naeem Callaway",
  "You are not alone.",
  "You have a right to be heard and taken seriously.",
  "Your trauma is valid.",
  "Your feelings are valid.",
  "You are allowed to struggle.",
  "You are allowed to talk.",
  "Our sorrows and wounds are healed only when we touch them with compassion. – Buddha",
  "It's when we start working together that the real healing takes place. – David Hume",
  "You own your story.",
  "It's ok not to be ok.",
  "The wound is the place where the Light enters you. – Rumi",
  "Hope is being able to see that there is light despite all of the darkness. – Desmond Tutu",
  "In the midst of winter, I found there was, within me, an invincible summer. – Albert Camus",
  "Some storms are just meant to clear your path.",
  "This too shall pass.",
  "Believe you can, and you're halfway there. – Theodore Roosevelt",
  "It always seems impossible until it's done. – Nelson Mandela",
  "Don't let the past steal your present. – Cherríe Moraga",
  "The best way out is always through. – Robert Frost",
  "If you're going through hell, keep going. – Winston Churchill",
  "Be kind with yourself.",
  "Self-compassion is simply giving the same kindness to ourselves that we would give to others. – Christopher Germer",
  "To fall in love with yourself is the first secret to happiness. – Robert Morley",
  "You have the right to acknowledge your feelings without having to justify them.",
  "You have the right to go through your own unique process.",
  "I am courageous. I am whole. I stand in my power.",
  "It is safe to be me.",
  "I will nurture and protect myself.",
  "Everyone makes mistakes. It is normal and human.",
  "Forgiving yourself is the hardest thing you'll ever do, but it is the first step toward real healing.",
  "I fall down, and I just bounce back up again.",
  "Success is the sum of small efforts, repeated day-in and day-out. – Robert Collier",
  "A diamond is a chunk of coal that did well under pressure. – Henry Kissinger",
  "Every struggle in your life has shaped you into the person you are today. Be thankful for the hard times. – Keanu Reeves",
  "I think the power is in the principle of moving forward, as though you have the confidence to move forward. – Robert Downey Jr.",
  "One of the hardest things was learning that I was worth recovery. – Demi Lovato",
  "Trauma may shape you, but it does not have to define you. – L.R. Knost",
  "What happened to you was not your fault, but your healing is your responsibility. – Dr. Bruce Perry",
  "You don't have to understand your pain to begin healing from it.",
  "No matter how much it hurts now, someday you will look back and realize your struggles changed your life for the better.",
  "What happened does not define you.",
  "I am not defined by my relapses, but by my decision to remain in recovery despite them.",
  "When you recover or heal from trauma, your life becomes about owning your narrative.",
  "We are not our traumas. We are what grows from them.",
  "What we change inwardly will change outer reality. – Plutarch",
  "Sometimes we must be willing to let go of the life we planned so as to have the life that is waiting for us. – Oprah Winfrey",
  "I am not afraid to be myself.",
  "My life and choices are right for me.",
  "I am a survivor. My body is a survivor.",
  "My recovery must come first so that everything I love in life doesn't have to come last.",
  "Breathe!",
  "The human body has an incredible capacity to heal when we allow it to. – Dr. Lissa Rankin",
  "Healing happens when we sit with our pain instead of avoiding it. – Brené Brown",
  "Sometimes, we motivate ourselves by thinking of who we don't ever want to be again. – Shane Niemeyer",
  "Do not judge the day by the harvest you reap, but by the seeds you plant. – Robert Louis Stevenson",
  "There is no growth without change, no change without fear or loss, and no loss without pain.",
  "The best revenge is no revenge. Heal yourself and move on.",
  "Forgiveness is the key to action and freedom. – Maya Angelou",
  "Resilience is not about avoiding stress, but about learning to thrive under it.",
  "You can't heal what you refuse to feel.",
  "Still here. Still standing.",
  "Begin again.",
  "You survived before. You will again.",
  "Healing is not linear, and that's okay.",
  "Keep going.",
  "One breath at a time.",
  "Today, I choose to heal.",
  "You are built for this.",
  "Progress, not perfection.",
  "Your story isn't over yet.",
];

// Emojis for the 3 quote slots
const quoteEmojis = ['✨', '💪', '🌟'];

function getQuoteGroup(): string[] {
  // Get the current group index from localStorage
  const storedIndex = localStorage.getItem('quoteGroupIndex');
  const storedDate = localStorage.getItem('quoteGroupDate');
  const today = new Date().toDateString();

  let groupIndex = 0;

  if (storedIndex !== null && storedDate === today) {
    // Same day — keep same group
    groupIndex = parseInt(storedIndex, 10);
  } else {
    // New day or first visit — advance to next group
    if (storedIndex !== null) {
      groupIndex = (parseInt(storedIndex, 10) + 1);
    }
    // Total groups: ceil(100 / 3) = 34
    const totalGroups = Math.ceil(allQuotes.length / 3);
    if (groupIndex >= totalGroups) {
      groupIndex = 0; // cycle back
    }
    localStorage.setItem('quoteGroupIndex', String(groupIndex));
    localStorage.setItem('quoteGroupDate', today);
  }

  const start = groupIndex * 3;
  return allQuotes.slice(start, start + 3);
}

export function PatientHome() {
  const navigate = useNavigate();
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [user, setUser] = useState<any>({});
  const [quotes, setQuotes] = useState<string[]>([]);

  useEffect(() => {
    setQuotes(getQuoteGroup());

    const fetchBilling = () => {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
      if (userData.id) {
        api.patient.getBilling(userData.id).then(setBillingStatus).catch(console.error);
      }
    };

    fetchBilling();
    const interval = setInterval(fetchBilling, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  // Light violet boxes with white text
  const quickActions = [
    { label: 'View My Schedule', path: '/patient/schedule', fallback: '📅' },
    { label: 'View Tasks', path: '/patient/tasks', fallback: '✅' },
    { label: 'Mood Mapping', path: '/patient/mood-mapping', fallback: '😊' },
    { label: 'Happy Journal', path: '/patient/happy-journal', fallback: '📖' },
    { label: 'Track Your Progress', path: '/patient/progress', fallback: '📊' },
  ];

  return (
    <div className="min-h-screen patient-home-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold mb-1 text-black">Welcome 👋</h1>
          <p className="text-black font-semibold text-lg">{user.name || user.email}</p>
          <p className="text-sm text-black font-medium mt-1">Patient ID: {user.id?.substring(0, 8)}</p>

          {billingStatus && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm font-semibold text-gray-700">Billing Status</p>
              {billingStatus.outstanding > 0 ? (
                <p className="text-orange-600 font-bold">Outstanding: ₹{billingStatus.outstanding}</p>
              ) : (
                <p className="text-green-600 font-bold">All Paid</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Motivation Quotes - rotating from quotes.txt */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="bg-[#4C9A2A] rounded-3xl p-6 shadow-lg">
          <div className="text-center">
            <p className="text-3xl mb-3">{quoteEmojis[0]}</p>
            <p className="text-black text-lg font-semibold mb-2">
              "{quotes[0] || ''}"
            </p>
            <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>- Your Daily Motivation</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-[#5AAE32] rounded-2xl p-4 shadow-md">
            <p className="text-2xl mb-2">{quoteEmojis[1]}</p>
            <p className="text-black text-sm font-semibold">
              "{quotes[1] || ''}"
            </p>
          </div>
          <div className="bg-[#6BBF3F] rounded-2xl p-4 shadow-md">
            <p className="text-2xl mb-2">{quoteEmojis[2]}</p>
            <p className="text-black text-sm font-semibold">
              "{quotes[2] || ''}"
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => {
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex flex-col items-center gap-3 min-h-[160px]"
                style={{
                  backgroundColor: '#4C9A2A',
                  cursor: 'pointer',
                  borderRadius: '32px'
                }}
              >
                <div className="text-4xl mb-2" style={{ fontSize: '3rem', lineHeight: '1' }}>
                  {action.fallback}
                </div>
                <span className="text-sm text-center font-semibold leading-tight text-black">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <PatientBottomNav />
    </div>
  );
}
