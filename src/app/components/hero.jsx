import { Eye, Download, Github, Linkedin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/app/contexts/admin-context';
import { supabase } from '@/lib/supabase';

export default function Hero({ setActivePage }) {
  const { adminMode } = useAdmin();
  const [resumeUrl, setResumeUrl] = useState(null);

  useEffect(() => {
    fetchResumeUrl();
  }, []);

  const fetchResumeUrl = async () => {
    try {
      const { data, error } = await supabase
        .storage
        .from('resumes')
        .list('', {
          limit: 1,
          search: 'resume'
        });

      if (error) {
        console.error('Error fetching resume:', error);
        return;
      }

      if (data && data.length > 0) {
        const { data: urlData } = supabase
          .storage
          .from('resumes')
          .getPublicUrl(data[0].name);
        
        setResumeUrl(urlData.publicUrl);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDownloadResume = () => {
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
    } else {
      alert('No resume uploaded yet. Admin can upload from About section.');
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Profile Image with Open to Work Ring */}
      <div className="relative mb-8 z-10">
        {/* Animated Glow */}
        <div className="absolute inset-0 rounded-full animate-pulse"
          style={{ 
            background: 'linear-gradient(45deg, #00d9ff, #a855f7)',
            filter: 'blur(25px)',
            opacity: 0.5
          }}
        />
        
        {/* Profile Image Container */}
        <div className="relative w-44 h-44 rounded-full p-1">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-900 p-1.5 flex items-center justify-center overflow-hidden border-2 border-cyan-400/30">
            {/* Profile Image */}
            <img 
              src="https://media.licdn.com/dms/image/v2/D5635AQFBA8aUYdGuWw/profile-framedphoto-shrink_400_400/B56ZzI.FoqG4Ag-/0/1772898245468?e=1774209600&v=beta&t=wbT40VTi7Aeg6nIYfmiPLgFdfGvj7QsueglzPieqPpQ" 
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Open to Work Text - Rotating */}
        <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 176 176">
          <defs>
            <path id="circlePath" d="M 88, 88 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" />
          </defs>
          <text className="text-[11px] font-bold tracking-widest fill-cyan-400">
            <textPath href="#circlePath" startOffset="0%">
              OPEN TO WORK • OPEN TO WORK 
            </textPath>
          </text>
        </svg>
      </div>

      {/* Name with Gradient */}
      <h1 className="text-5xl md:text-7xl font-black mb-5 text-center relative z-10">
        <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
        Piyush Adhikari
        </span>
      </h1>

      {/* Title */}
      <p className="text-xl md:text-2xl text-gray-300 mb-6 text-center z-10">
        I'm a <span className="font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Machine Learning Engineer</span>
      </p>

      {/* Description */}
      <p className="text-gray-400 max-w-2xl text-center mb-10 leading-relaxed z-10">
        Passionate DevOps and Machine Learning Engineer with expertise in CI/CD pipelines,
        containerized ML model deployment, and advanced AI applications. Experienced in
        building scalable systems and innovative solutions across multiple domains.
      </p>

      {/* Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mb-10 z-10">
        <button
          onClick={() => setActivePage && setActivePage('projects')}
          className="group relative px-8 py-4 rounded-xl text-white font-semibold transition-all hover:scale-105 flex items-center gap-3 shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-transform group-hover:scale-110" />
          <Eye className="w-5 h-5 relative z-10" />
          <span className="relative z-10">View Projects</span>
        </button>
        <button
          onClick={() => setActivePage && setActivePage('resume')}
          className="px-8 py-4 bg-slate-800/80 hover:bg-slate-700 border-2 border-cyan-500/30 hover:border-cyan-500/60 rounded-xl text-white font-semibold transition-all hover:scale-105 flex items-center gap-3 backdrop-blur-sm"
        >
          <Download className="w-5 h-5" />
          View Resume
        </button>
      </div>

      {/* Social Links */}
      <div className="flex gap-4 z-10 mb-20">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-800/50 border-2 border-slate-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500 transition-all hover:scale-110 backdrop-blur-sm"
        >
          <Github className="w-6 h-6" />
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-800/50 border-2 border-slate-700 text-gray-400 hover:text-purple-400 hover:border-purple-500 transition-all hover:scale-110 backdrop-blur-sm"
        >
          <Linkedin className="w-6 h-6" />
        </a>
      </div>

      {/* Quick Overview Section */}
      <div className="w-full max-w-5xl z-10">
        <h3 className="text-3xl font-bold text-center mb-6 text-white">Quick Overview</h3>
        <p className="text-center text-gray-400 mb-8">Here's a snapshot of my professional journey and expertise</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Professional Roles */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border-2 border-slate-700/50 hover:border-blue-500/50 rounded-2xl p-6 transition-all hover:scale-105 group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-center mb-2 text-white">Professional Roles</h4>
            <p className="text-center text-gray-400 text-sm">From AI Engineer to DevOps Engineer, building scalable solutions</p>
          </div>

          {/* Key Projects */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border-2 border-slate-700/50 hover:border-orange-500/50 rounded-2xl p-6 transition-all hover:scale-105 group">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-center mb-2 text-white">Key Projects</h4>
            <p className="text-center text-gray-400 text-sm">Innovative AI and ML solutions with real-world impact</p>
          </div>

          {/* Technical Skills */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border-2 border-slate-700/50 hover:border-purple-500/50 rounded-2xl p-6 transition-all hover:scale-105 group">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-center mb-2 text-white">Technical Skills</h4>
            <p className="text-center text-gray-400 text-sm">Expertise in Python, AWS, Docker, ML frameworks, and more</p>
          </div>
        </div>
      </div>

      <style>{`
        .open-to-work-ring {
          background: linear-gradient(45deg, #00d9ff, #a855f7, #ec4899);
          animation: rotate 8s linear infinite;
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: rotate 20s linear infinite;
        }
      `}</style>
    </section>
  );
}
