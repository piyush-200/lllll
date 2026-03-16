import { Download, FileText, Briefcase, GraduationCap, Code, Award, Mail, Phone, Github, Linkedin, ExternalLink, Upload, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { educationAPI, achievementsAPI, projectsAPI, skillsAPI } from '@/lib/api';
import { useAdmin } from '@/app/contexts/admin-context';
import { toast } from 'sonner';

export default function Resume() {
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumePdfUrl, setResumePdfUrl] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const resumeRef = useRef(null);
  const fileInputRef = useRef(null);
  const { adminMode } = useAdmin();

  useEffect(() => {
    fetchData();
    fetchResumePdf();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expData, eduData, certData, projData, skillsData] = await Promise.all([
        supabase.from('experience').select('*').order('display_order', { ascending: true }),
        educationAPI.getAll(),
        achievementsAPI.getAll(),
        projectsAPI.getAll(),
        skillsAPI.getAll()
      ]);
      
      setExperiences(expData.data || []);
      setEducation(eduData || []);
      setCertifications(certData || []);
      setProjects(projData || []);
      setSkills(skillsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumePdf = async () => {
    try {
      // Check if resume PDF exists in storage
// Check if any resume PDF exists in storage
const { data, error } = await supabase.storage
  .from('resumes')
  .list('', {
    limit: 1
  });

if (!error && data && data.length > 0) {
  const fileName = data[0].name;

  const { data: urlData } = supabase.storage
    .from('resumes')
    .getPublicUrl(fileName);

  setResumePdfUrl(urlData.publicUrl);
  setResumeFileName(fileName);
}
      
    } catch (error) {
      console.error('Error fetching resume PDF:', error);
    }
  };

  const handleDownloadPDF = () => {
    if (resumePdfUrl) {
      // Download the uploaded PDF
      window.open(resumePdfUrl, '_blank');
    } else {
      toast.error('No resume PDF available. Please upload one in admin mode.');
    }
  };

  const handleUploadPDF = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    try {
      setUploadingPdf(true);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(file.name, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(file.name);
      
      setResumePdfUrl(urlData.publicUrl);
      toast.success('Resume PDF uploaded successfully!');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Failed to upload PDF. Please try again.');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDeletePDF = async () => {
    if (!confirm('Are you sure you want to delete the resume PDF?')) {
      return;
    }

    try {
      setUploadingPdf(true);
      
      const { error } = await supabase.storage
        .from('resumes')
        .remove([currentFileName]);
      
      if (error) {
        throw error;
      }
      
      setResumePdfUrl(null);
      toast.success('Resume PDF deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting PDF:', error);
      toast.error('Failed to delete PDF. Please try again.');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading resume...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Resume
          </h1>
          <p className="text-gray-400 text-base max-w-2xl mx-auto mb-6">
            A comprehensive overview of my professional experience, skills, and achievements in Web development and Artificial intelligence.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:scale-105 transition-all flex items-center gap-3"
              style={{ background: 'var(--theme-gradient)' }}
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            
            {adminMode && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPdf}
                  className="px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: 'var(--theme-gradient)' }}
                >
                  <Upload className="w-5 h-5" />
                  {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
                </button>
                
                {resumePdfUrl && (
                  <button
                    onClick={handleDeletePDF}
                    disabled={uploadingPdf}
                    className="px-6 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete PDF
                  </button>
                )}
              </>
            )}
          </div>

          {/* PDF Status Indicator */}
          {adminMode && (
            <div className="mt-4">
              {resumePdfUrl ? (
                <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Resume PDF is uploaded and ready for download
                </p>
              ) : (
                <p className="text-sm text-yellow-400 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  No resume PDF uploaded yet
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Resume Card Container */}
        <motion.div
          ref={resumeRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden backdrop-blur-sm"
        >
          {/* Resume Header Section */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-8 md:p-10 border-b border-slate-700">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
              Piyush Adhikari
            </h2>
            <p className="text-lg md:text-xl font-semibold mb-4" style={{ color: 'var(--theme-text-accent)' }}>
            Full Stack Developer
            </p>
            <p className="text-gray-300 mb-6 max-w-4xl leading-relaxed">
              Passionate Web Developer with expertise in modern web technologies, responsive design, and full-stack application development. Experienced in building scalable, user-friendly web applications and innovative digital solutions across multiple domains, from front-end interfaces to back-end systems.
            </p>
            
            {/* Contact Information */}
            <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4" style={{ color: 'var(--theme-text-accent)' }} />
                <span>piyushadhikari740@gmailcomm</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4" style={{ color: 'var(--theme-text-accent)' }} />
                <span>+919997384599</span>
              </div>
              <a 
                href="https://github.com/piyush-200" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
              >
                <Github className="w-4 h-4" style={{ color: 'var(--theme-text-accent)' }} />
                <span>GitHub</span>
              </a>
              <a 
                href="https://www.linkedin.com/in/piyush-adhikari-ba869723a/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
              >
                <Linkedin className="w-4 h-4" style={{ color: 'var(--theme-text-accent)' }} />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Professional Experience Section */}
          {experiences.length > 0 && (
            <div className="p-6 md:p-8 border-b border-slate-700">
              <div className="flex items-center gap-3 mb-5">
                <Briefcase className="w-6 h-6" style={{ color: 'var(--theme-text-accent)' }} />
                <h3 className="text-2xl font-bold text-white">Professional Experience</h3>
              </div>
              
              <div className="space-y-5">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative pl-6 border-l-2 border-slate-600">
                    <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" />
                    
                    <div className="mb-2">
                      <h4 className="text-lg font-bold text-white">{exp.position}</h4>
                      <p className="text-base font-semibold mb-1" style={{ color: 'var(--theme-text-accent)' }}>
                        {exp.company}
                      </p>
                      <p className="text-sm text-gray-400 mb-3">
                        {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                      </p>
                    </div>
                    
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Skills Section */}
          {Object.keys(groupedSkills).length > 0 && (
            <div className="p-6 md:p-8 border-b border-slate-700">
              <div className="flex items-center gap-3 mb-5">
                <Code className="w-6 h-6" style={{ color: 'var(--theme-text-accent)' }} />
                <h3 className="text-2xl font-bold text-white">Technical Skills</h3>
              </div>
              
              <div className="space-y-3">
                {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-slate-700/50 border border-slate-600 hover:border-cyan-500/50 transition-colors"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <div className="p-6 md:p-8 border-b border-slate-700">
              <div className="flex items-center gap-3 mb-5">
                <GraduationCap className="w-6 h-6" style={{ color: 'var(--theme-text-accent)' }} />
                <h3 className="text-2xl font-bold text-white">Education</h3>
              </div>
              
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-lg font-bold text-white">{edu.degree}</h4>
                        <p className="text-base font-semibold mb-1" style={{ color: 'var(--theme-text-accent)' }}>
                          {edu.institution}
                        </p>
                        {edu.field && (
                          <p className="text-sm text-gray-400">{edu.field}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {edu.startYear && edu.endYear && (
                          <p className="text-sm text-gray-400 font-medium">
                            {edu.startYear} - {edu.endYear}
                          </p>
                        )}
                      </div>
                    </div>
                    {edu.grade && (
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold">Grade:</span> {edu.grade}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications Section */}
          {certifications.length > 0 && (
            <div className="p-6 md:p-8 border-b border-slate-700">
              <div className="flex items-center gap-3 mb-5">
                <Award className="w-6 h-6" style={{ color: 'var(--theme-text-accent)' }} />
                <h3 className="text-2xl font-bold text-white">Certifications</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {certifications.map((cert) => (
                  <div key={cert.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-white mb-1">{cert.title}</h4>
                        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-accent)' }}>
                          {cert.issuer}
                        </p>
                      </div>
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-cyan-400 transition-colors"
                          title="View Certificate"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {cert.date && (
                      <p className="text-xs text-gray-400 mb-1">{cert.date}</p>
                    )}
                    {cert.credentialId && (
                      <p className="text-xs text-gray-500 font-mono">
                        ID: {cert.credentialId}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Projects Section */}
          {projects.length > 0 && (
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <Code className="w-6 h-6" style={{ color: 'var(--theme-text-accent)' }} />
                <h3 className="text-2xl font-bold text-white">Key Projects</h3>
              </div>
              
              <div className="space-y-3">
                {projects.slice(0, 4).map((project) => (
                  <div key={project.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-cyan-500/50 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-bold text-white">{project.title}</h4>
                      <div className="flex gap-2">
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-cyan-400 transition-colors"
                            title="View on GitHub"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                        {project.projectUrl && (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-cyan-400 transition-colors"
                            title="View Project"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                      {project.description}
                    </p>
                    
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-white bg-slate-700/50 border border-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Hidden file input for PDF upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf"
        className="hidden"
        onChange={handleUploadPDF}
      />
    </div>
  );
}
