import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { BookOpen, Video, FileText, Lightbulb } from 'lucide-react';

export function TherapistDiscover() {
  const resources = [
    {
      icon: BookOpen,
      title: 'Treatment Techniques',
      description: 'Latest evidence-based OT interventions',
      color: 'from-[#6328FF] to-[#9E98ED]',
    },
    {
      icon: Video,
      title: 'Training Videos',
      description: 'Professional development courses',
      color: 'from-[#9E98ED] to-[#FE97CF]',
    },
    {
      icon: FileText,
      title: 'Research Articles',
      description: 'Recent studies and publications',
      color: 'from-[#C2D738] to-[#EAFCFF]',
    },
    {
      icon: Lightbulb,
      title: 'Best Practices',
      description: 'Community shared insights',
      color: 'from-[#FE5C2B] to-[#C2D738]',
    },
  ];

  const articles = [
    {
      title: 'Cognitive Behavioral Therapy in OT Practice',
      author: 'Dr. Emily Chen',
      date: 'Oct 15, 2025',
    },
    {
      title: 'ADL Training for Anxiety Disorders',
      author: 'Dr. Michael Roberts',
      date: 'Oct 10, 2025',
    },
    {
      title: 'Mindfulness Techniques in Therapy',
      author: 'Dr. Sarah Williams',
      date: 'Oct 5, 2025',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">Discover</h1>
          <p className="text-sm text-gray-500 mt-1">Educational resources & training</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Resource Categories */}
        <div className="grid grid-cols-2 gap-4">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <button
                key={resource.title}
                className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 text-left"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${resource.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-gray-800 mb-1">{resource.title}</h3>
                <p className="text-sm text-gray-500">{resource.description}</p>
              </button>
            );
          })}
        </div>

        {/* Recent Articles */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-800 mb-4">Recent Articles</h3>
          <div className="space-y-4">
            {articles.map((article, index) => (
              <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                <h4 className="text-gray-800 mb-1">{article.title}</h4>
                <p className="text-sm text-gray-500">
                  By {article.author} • {article.date}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TherapistBottomNav />
    </div>
  );
}
