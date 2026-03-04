import { useState } from 'react';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { Music, Activity, Brain, Heart, Gamepad2, Wind, Settings, ChevronLeft, Play, ExternalLink } from 'lucide-react';
import '../../styles/patient-services-background.css';

// Song recommendations data
const songRecommendations = [
  { title: "Weightless", artist: "Marconi Union", mood: "Relaxation" },
  { title: "Clair de Lune", artist: "Claude Debussy", mood: "Calm" },
  { title: "Gymnopédie No.1", artist: "Erik Satie", mood: "Peaceful" },
  { title: "River Flows in You", artist: "Yiruma", mood: "Emotional" },
  { title: "Nuvole Bianche", artist: "Ludovico Einaudi", mood: "Serene" },
  { title: "Experience", artist: "Ludovico Einaudi", mood: "Uplifting" },
  { title: "Comptine d'un autre été", artist: "Yann Tiersen", mood: "Nostalgic" },
  { title: "The Rain", artist: "Brian Crain", mood: "Calm" },
  { title: "A Thousand Years", artist: "Christina Perri", mood: "Hopeful" },
  { title: "Canon in D", artist: "Johann Pachelbel", mood: "Classical" },
  { title: "Somewhere Over the Rainbow", artist: "Israel Kamakawiwo'ole", mood: "Joyful" },
  { title: "Bloom", artist: "The Paper Kites", mood: "Gentle" },
  { title: "Holocene", artist: "Bon Iver", mood: "Reflective" },
  { title: "The Night We Met", artist: "Lord Huron", mood: "Melancholic" },
  { title: "Saturn", artist: "Sleeping at Last", mood: "Ethereal" },
  { title: "Hoppípolla", artist: "Sigur Rós", mood: "Hopeful" },
  { title: "Breathe Me", artist: "Sia", mood: "Emotional" },
  { title: "Mad World", artist: "Gary Jules", mood: "Reflective" },
  { title: "Skinny Love", artist: "Bon Iver", mood: "Vulnerable" },
  { title: "First Day of My Life", artist: "Bright Eyes", mood: "Hopeful" },
  { title: "Ocean Eyes", artist: "Billie Eilish", mood: "Dreamy" },
  { title: "Sunset Lover", artist: "Petit Biscuit", mood: "Chill" },
  { title: "Home", artist: "Edith Whiskers", mood: "Comforting" },
  { title: "Lua", artist: "Bright Eyes", mood: "Contemplative" },
  { title: "To Build a Home", artist: "The Cinematic Orchestra", mood: "Moving" },
  { title: "Intro", artist: "The xx", mood: "Ambient" },
  { title: "Re: Stacks", artist: "Bon Iver", mood: "Introspective" },
  { title: "All I Want", artist: "Kodaline", mood: "Emotional" },
  { title: "Flightless Bird", artist: "Iron & Wine", mood: "Tender" },
  { title: "Into the Wild", artist: "LP", mood: "Adventurous" },
  { title: "Lost Boy", artist: "Ruth B", mood: "Whimsical" },
  { title: "Photograph", artist: "Ed Sheeran", mood: "Nostalgic" },
  { title: "Yellow", artist: "Coldplay", mood: "Warm" },
  { title: "Fix You", artist: "Coldplay", mood: "Healing" },
  { title: "The Scientist", artist: "Coldplay", mood: "Bittersweet" },
  { title: "Hallelujah", artist: "Jeff Buckley", mood: "Spiritual" },
  { title: "Sound of Silence", artist: "Simon & Garfunkel", mood: "Pensive" },
  { title: "Here Comes the Sun", artist: "The Beatles", mood: "Uplifting" },
  { title: "Lean on Me", artist: "Bill Withers", mood: "Supportive" },
  { title: "What a Wonderful World", artist: "Louis Armstrong", mood: "Grateful" },
  { title: "Three Little Birds", artist: "Bob Marley", mood: "Reassuring" },
  { title: "Don't Worry Be Happy", artist: "Bobby McFerrin", mood: "Cheerful" },
  { title: "Beautiful Day", artist: "U2", mood: "Optimistic" },
];

// Breathing techniques data
const breathingTechniques = [
  {
    name: "4-7-8 Breathing",
    description: "Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. Helps reduce anxiety and promotes sleep.",
    steps: ["Breathe in through nose for 4 seconds", "Hold breath for 7 seconds", "Exhale through mouth for 8 seconds", "Repeat 4 times"]
  },
  {
    name: "Box Breathing",
    description: "Equal-count breathing used by Navy SEALs to stay calm under pressure.",
    steps: ["Inhale for 4 seconds", "Hold for 4 seconds", "Exhale for 4 seconds", "Hold for 4 seconds", "Repeat 4-6 times"]
  },
  {
    name: "Diaphragmatic Breathing",
    description: "Deep belly breathing that engages the diaphragm for maximum relaxation.",
    steps: ["Place hand on belly", "Breathe deeply through nose", "Feel belly rise", "Exhale slowly through mouth", "Repeat for 5-10 minutes"]
  },
  {
    name: "Alternate Nostril Breathing",
    description: "Yogic technique to balance both hemispheres of the brain.",
    steps: ["Close right nostril with thumb", "Inhale through left nostril", "Close left nostril, open right", "Exhale through right", "Repeat alternating"]
  },
  {
    name: "Pursed Lip Breathing",
    description: "Slows breathing pace and helps release trapped air in lungs.",
    steps: ["Relax neck and shoulders", "Inhale through nose for 2 seconds", "Purse lips like whistling", "Exhale slowly for 4 seconds"]
  },
  {
    name: "Lion's Breath",
    description: "Energizing breath that releases tension in face and jaw.",
    steps: ["Inhale deeply through nose", "Open mouth wide, stick out tongue", "Exhale forcefully with 'HA' sound", "Repeat 3-5 times"]
  },
];

// Yoga poses data
const yogaPoses = [
  { name: "Child's Pose (Balasana)", benefit: "Calms the mind, relieves stress", duration: "1-3 minutes" },
  { name: "Cat-Cow Stretch", benefit: "Releases spine tension, improves flexibility", duration: "5-10 breaths" },
  { name: "Downward Dog", benefit: "Energizes body, stretches entire back", duration: "30-60 seconds" },
  { name: "Tree Pose (Vrksasana)", benefit: "Improves balance and focus", duration: "30 seconds each side" },
  { name: "Warrior II", benefit: "Builds strength and stability", duration: "30-60 seconds each side" },
  { name: "Corpse Pose (Savasana)", benefit: "Deep relaxation, calms nervous system", duration: "5-15 minutes" },
  { name: "Legs Up Wall", benefit: "Reduces anxiety, improves circulation", duration: "5-15 minutes" },
  { name: "Seated Forward Fold", benefit: "Calms mind, stretches spine", duration: "1-3 minutes" },
];

// Meditation exercises
const meditationExercises = [
  { name: "Body Scan Meditation", duration: "10-20 min", description: "Systematically focus on each body part to release tension" },
  { name: "Loving-Kindness Meditation", duration: "10-15 min", description: "Cultivate feelings of love and compassion for yourself and others" },
  { name: "Breath Awareness", duration: "5-10 min", description: "Simply observe your natural breathing pattern without changing it" },
  { name: "Guided Visualization", duration: "15-20 min", description: "Imagine peaceful scenes like beaches, forests, or mountains" },
  { name: "Mindful Walking", duration: "10-15 min", description: "Focus on each step, feeling the ground beneath your feet" },
  { name: "Mantra Meditation", duration: "10-20 min", description: "Repeat a calming word or phrase like 'Om' or 'Peace'" },
];

// Mindfulness activities
const mindfulnessActivities = [
  { name: "5-4-3-2-1 Grounding", description: "Notice 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste" },
  { name: "Mindful Eating", description: "Eat slowly, savoring each bite and noticing textures and flavors" },
  { name: "Gratitude Journaling", description: "Write 3 things you're grateful for each day" },
  { name: "Nature Observation", description: "Spend 10 minutes observing nature without any devices" },
  { name: "Mindful Listening", description: "Listen to music with full attention, noticing instruments and rhythms" },
  { name: "Body Awareness Check", description: "Pause and notice how your body feels right now" },
];

// Leisure activities
const leisureActivities = [
  { name: "Coloring Books", description: "Adult coloring books reduce stress and promote mindfulness", category: "Creative" },
  { name: "Puzzle Solving", description: "Jigsaw puzzles, crosswords, or Sudoku to engage the mind", category: "Mental" },
  { name: "Gardening", description: "Connecting with nature through planting and nurturing", category: "Outdoor" },
  { name: "Reading", description: "Fiction, poetry, or self-help books for relaxation", category: "Quiet" },
  { name: "Cooking/Baking", description: "Creating nutritious meals or treats mindfully", category: "Creative" },
  { name: "Art Therapy", description: "Drawing, painting, or crafting without judgment", category: "Creative" },
  { name: "Board Games", description: "Social games with family or friends", category: "Social" },
  { name: "Photography", description: "Capturing beautiful moments in nature or daily life", category: "Creative" },
];

type ServiceCategory = 'songs' | 'yoga' | 'meditation' | 'mindfulness' | 'leisure' | 'breathing' | null;

export function PatientServices() {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>(null);

  const services = [
    { key: 'songs' as ServiceCategory, icon: Music, label: 'Calming Music', bgColor: '#9E98ED', emoji: '🎵' },
    { key: 'yoga' as ServiceCategory, icon: Activity, label: 'Yoga', bgColor: '#FE5C2B', emoji: '🧘' },
    { key: 'meditation' as ServiceCategory, icon: Brain, label: 'Meditation', bgColor: '#FE97CF', emoji: '🧠' },
    { key: 'mindfulness' as ServiceCategory, icon: Heart, label: 'Mindfulness', bgColor: '#EAFCFF', emoji: '❤️' },
    { key: 'leisure' as ServiceCategory, icon: Gamepad2, label: 'Leisure Engagement', bgColor: '#C2D738', emoji: '🎮' },
    { key: 'breathing' as ServiceCategory, icon: Wind, label: 'Deep Breathing', bgColor: '#6328FF', emoji: '💨' },
  ];

  const renderContent = () => {
    switch (selectedCategory) {
      case 'songs':
        return (
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🎵 Calming Songs ({songRecommendations.length})</h3>
            <p className="text-gray-600 mb-4">Curated playlist for relaxation and emotional healing</p>
            <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
              {songRecommendations.map((song, index) => (
                <div key={index} className="bg-white/80 p-3 rounded-xl flex items-center gap-3 hover:bg-white transition-all">
                  <div className="w-8 h-8 bg-[#9E98ED] rounded-full flex items-center justify-center text-black text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{song.title}</p>
                    <p className="text-sm text-gray-500">{song.artist}</p>
                  </div>
                  <span className="text-xs bg-[#9E98ED]/20 text-[#6328FF] px-2 py-1 rounded-full">{song.mood}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'breathing':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">💨 Breathing Techniques</h3>
            <p className="text-gray-600 mb-4">Practice these techniques to calm your nervous system</p>
            {breathingTechniques.map((technique, index) => (
              <div key={index} className="bg-white/80 p-4 rounded-2xl">
                <h4 className="font-bold text-[#6328FF] text-lg mb-2">{technique.name}</h4>
                <p className="text-gray-600 text-sm mb-3">{technique.description}</p>
                <div className="space-y-1">
                  {technique.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 bg-[#6328FF] rounded-full flex items-center justify-center text-black text-xs">{i + 1}</span>
                      <span className="text-gray-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'yoga':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🧘 Yoga Poses for Healing</h3>
            <p className="text-gray-600 mb-4">Gentle poses to release tension and promote relaxation</p>
            {yogaPoses.map((pose, index) => (
              <div key={index} className="bg-white/80 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FE5C2B] rounded-xl flex items-center justify-center text-black text-xl">
                  🧘
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{pose.name}</h4>
                  <p className="text-sm text-gray-600">{pose.benefit}</p>
                  <span className="text-xs text-[#FE5C2B] font-semibold">⏱️ {pose.duration}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'meditation':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🧠 Meditation Exercises</h3>
            <p className="text-gray-600 mb-4">Different meditation styles to suit your needs</p>
            {meditationExercises.map((exercise, index) => (
              <div key={index} className="bg-white/80 p-4 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-[#FE97CF] text-lg">{exercise.name}</h4>
                  <span className="text-xs bg-[#FE97CF]/20 text-[#FE97CF] px-2 py-1 rounded-full">{exercise.duration}</span>
                </div>
                <p className="text-gray-600 text-sm">{exercise.description}</p>
              </div>
            ))}
          </div>
        );

      case 'mindfulness':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">❤️ Mindfulness Activities</h3>
            <p className="text-gray-600 mb-4">Simple practices to stay present and grounded</p>
            {mindfulnessActivities.map((activity, index) => (
              <div key={index} className="bg-white/80 p-4 rounded-2xl">
                <h4 className="font-bold text-[#6328FF] text-lg mb-2">{activity.name}</h4>
                <p className="text-gray-600 text-sm">{activity.description}</p>
              </div>
            ))}
          </div>
        );

      case 'leisure':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🎮 Leisure Activities</h3>
            <p className="text-gray-600 mb-4">Enjoyable activities that promote well-being</p>
            {leisureActivities.map((activity, index) => (
              <div key={index} className="bg-white/80 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-[#C2D738] rounded-xl flex items-center justify-center text-black text-xl">
                  🎯
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-800">{activity.name}</h4>
                    <span className="text-xs bg-[#C2D738]/20 text-[#6328FF] px-2 py-1 rounded-full">{activity.category}</span>
                  </div>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen patient-services-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          {selectedCategory ? (
            <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 text-[#6328FF] font-semibold mb-2">
              <ChevronLeft className="w-5 h-5" /> Back to Services
            </button>
          ) : null}
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-3xl font-bold text-black flex items-center gap-2">
            Services <Settings className="w-7 h-7 text-[#6328FF]" />
          </h1>
          <p className="text-black font-semibold text-lg">Wellness activities for you</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {selectedCategory ? (
          <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-lg border border-[#E8D9B5]">
            {renderContent()}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <button
                    key={service.label}
                    onClick={() => setSelectedCategory(service.key)}
                    className="p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all transform hover:scale-[1.02] border-none flex flex-col items-center gap-3 min-h-[140px]"
                    style={{
                      backgroundColor: service.bgColor,
                      borderRadius: '32px',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="text-4xl mb-2" style={{ fontSize: '3rem', lineHeight: '1' }}>
                      {service.emoji}
                    </div>
                    <p className="text-sm text-center font-semibold leading-tight" style={{ color: '#4A4A4A' }}>
                      {service.label}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Featured Activity */}
            <div className="mt-6 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]" style={{ borderRadius: '32px' }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#4A4A4A' }}>✨ Today's Recommended Activity</h3>
              <p className="font-medium" style={{ color: '#7A7A7A' }}>Start your day with 10 minutes of guided meditation</p>
            </div>
          </>
        )}
      </div>

      <PatientBottomNav />
    </div>
  );
}
