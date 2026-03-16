import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react';

export default function Footer({ setActivePage }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-gray-200 dark:border-slate-800 bg-gray-100/50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-10 md:py-12">
        {/* Quick Links */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h3 className="text-gray-900 dark:text-white font-bold text-xl sm:text-2xl mb-4 sm:mb-6">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md">
            <div className="space-y-2 sm:space-y-3">
              <button onClick={() => setActivePage('home')} className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm sm:text-base transition-colors text-left">
                Home
              </button>
              <button onClick={() => setActivePage('projects')} className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm sm:text-base transition-colors text-left">
                Projects
              </button>
              <button onClick={() => setActivePage('education')} className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm sm:text-base transition-colors text-left">
                Education
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <button onClick={() => setActivePage('experience')} className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm sm:text-base transition-colors text-left">
                Experience
              </button>
              <button onClick={() => setActivePage('skills')} className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm sm:text-base transition-colors text-left">
                Skills
              </button>
              <button onClick={() => setActivePage('contact')} className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm sm:text-base transition-colors text-left">
                Contact
              </button>
            </div>
          </div>
        </div>

        {/* Connect */}
        <div>
          <h3 className="text-gray-900 dark:text-white font-bold text-xl sm:text-2xl mb-4 sm:mb-6">Connect</h3>
          <div className="flex items-center gap-6 sm:gap-8">
            <a href="https://github.com/piyush-200" target="_blank" rel="noopener noreferrer" 
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Github className="w-7 h-7 sm:w-8 sm:h-8" />
            </a>
            <a href="https://www.linkedin.com/in/piyush-adhikari-ba869723a/" target="_blank" rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Linkedin className="w-7 h-7 sm:w-8 sm:h-8" />
            </a>
            <a href="mailto:piyushadhikari740@gmail.com"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Mail className="w-7 h-7 sm:w-8 sm:h-8" />
            </a>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full text-white shadow-lg hover:scale-110 transition-transform z-40 flex items-center justify-center"
        style={{ background: 'var(--theme-gradient)' }}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
}
