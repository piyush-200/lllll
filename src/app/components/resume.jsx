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
  const [resumePdfs, setResumePdfs] = useState([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [experienceCertificates, setExperienceCertificates] = useState({});
  const resumeRef = useRef(null);
  const fileInputRef = useRef(null);
  const { adminMode } = useAdmin();

  useEffect(() => {
    fetchData();
    fetchResumePdfs();
  }, []);

  useEffect(() => {
    // Fetch certificates for all experiences when they're loaded
    if (experiences.length > 0) {
      experiences.forEach(exp => {
        fetchCertificatesForExperience(exp.id);
      });
    }
  }, [experiences]);

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

  const fetchResumePdfs = async () => {
    try {
      // List all PDFs in the resumes bucket
      const { data, error } = await supabase.storage
        .from('resumes')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (!error && data && data.length > 0) {
        const pdfList = data.map(file => {
          const { data: urlData } = supabase.storage
            .from('resumes')
            .getPublicUrl(file.name);
          
          return {
            name: file.name,
            url: urlData.publicUrl,
            path: file.name,
            created_at: file.created_at
          };
        });
        
        setResumePdfs(pdfList);
      }
    } catch (error) {
      console.error('Error fetching resume PDFs:', error);
    }
  };

  const fetchCertificatesForExperience = async (experienceId) => {
    try {
      // List all files in the bucket with the experience ID prefix
      const { data, error } = await supabase.storage
        .from('experience-certificates')
        .list('certificates', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error fetching certificates:', error);
        return;
      }

      // Filter files that belong to this experience
      const expCerts = data
        .filter(file => file.name.startsWith(`exp-${experienceId}-`))
        .map(file => {
          const filePath = `certificates/${file.name}`;
          const { data: urlData } = supabase.storage
            .from('experience-certificates')
            .getPublicUrl(filePath);
          
          return {
            name: file.name,
            url: urlData.publicUrl,
            path: filePath,
            created_at: file.created_at
          };
        });

      setExperienceCertificates(prev => ({
        ...prev,
        [experienceId]: expCerts
      }));
    } catch (error) {
      console.error('Error fetching certificates for experience:', error);
    }
  };

  const handleDownloadPDF = (pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else if (resumePdfs.length > 0) {
      // If no specific URL, download the first one
      window.open(resumePdfs[0].url, '_blank');
    } else {
      toast.error('No resume PDF available. Please upload one in admin mode.');
    }
  };

  const handleUploadPDF = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate files are PDFs
    const invalidFiles = files.filter(file => file.type !== 'application/pdf');
    if (invalidFiles.length > 0) {
      toast.error('Only PDF files are allowed');
      return;
    }

    // Validate file sizes (max 10MB each)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Each file must be less than 10MB');
      return;
    }
    
    try {
      setUploadingPdf(true);
      const uploadedPdfs = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `resume-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('resumes')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          throw error;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);
        
        uploadedPdfs.push({
          name: file.name,
          url: urlData.publicUrl,
          path: fileName
        });
      }
      
      setResumePdfs(prev => [...uploadedPdfs, ...prev]);
      toast.success(`${uploadedPdfs.length} resume PDF(s) uploaded successfully!`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error uploading PDF:', error);
      
      // Check for specific error types
      if (error.message?.includes('Bucket not found')) {
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">Storage bucket not found!</p>
            <p className="text-sm">Create bucket 'resumes' in Supabase Storage</p>
            <p className="text-xs">Then run SQL in /RESUME_STORAGE_SETUP.sql</p>
          </div>,
          { duration: 10000 }
        );
      } else if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">Permission denied!</p>
            <p className="text-sm">Storage policies need to be configured.</p>
            <p className="text-xs">Run the SQL in /RESUME_STORAGE_SETUP.sql</p>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.error('Failed to upload PDF: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDeletePDF = async (pdfPath, pdfName) => {
    if (!confirm(`Are you sure you want to delete "${pdfName}"?`)) {
      return;
    }

    try {
      setUploadingPdf(true);
      
      const { error } = await supabase.storage
        .from('resumes')
        .remove([pdfPath]);
      
      if (error) {
        throw error;
      }
      
      setResumePdfs(prev => prev.filter(pdf => pdf.path !== pdfPath));
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
            A comprehensive overview of my professional experience, skills, and achievements in Web Development and AI.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => handleDownloadPDF()}
              disabled={resumePdfs.length === 0}
              className="px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'var(--theme-gradient)' }}
            >
              <Download className="w-5 h-5" />
              Download Latest PDF
            </button>
            
            {adminMode && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPdf}
                className="px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: 'var(--theme-gradient)' }}
              >
                <Upload className="w-5 h-5" />
                {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
              </button>
            )}
          </div>

          {/* Uploaded PDFs List (Admin Only) */}
          {adminMode && resumePdfs.length > 0 && (
            <div className="mt-6 max-w-2xl mx-auto">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Uploaded Resume PDFs ({resumePdfs.length})
              </h3>
              <div className="space-y-2">
                {resumePdfs.map((pdf, index) => (
                  <div
                    key={pdf.path}
                    className="flex items-center justify-between gap-3 p-3 bg-slate-800/60 border border-slate-700 rounded-lg hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {pdf.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pdf.created_at ? new Date(pdf.created_at).toLocaleDateString() : 'Uploaded'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDownloadPDF(pdf.url)}
                        className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePDF(pdf.path, pdf.name)}
                        disabled={uploadingPdf}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete PDF"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF Status Indicator */}
          {adminMode && resumePdfs.length === 0 && (
            <div className="mt-4">
              <p className="text-sm text-yellow-400 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                No resume PDF uploaded yet
              </p>
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
              Full Stack Web Developer
            </p>
            <p className="text-gray-300 mb-6 max-w-4xl leading-relaxed">
              Passionate Web Developer with expertise in building modern, responsive web applications, implementing efficient front-end and back-end solutions, and optimizing user experiences. Skilled in developing scalable systems, integrating APIs, and creating dynamic, high-performance applications across diverse domains.
            </p>
            
            {/* Contact Information */}
            <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4" style={{ color: 'var(--theme-text-accent)' }} />
                <span>piyushadhikari740@gmail.com</span>
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

                    {/* Certificates Section */}
                    {experienceCertificates[exp.id] && experienceCertificates[exp.id].length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <h5 className="text-sm font-semibold text-gray-300">
                            Certificates ({experienceCertificates[exp.id].length})
                          </h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {experienceCertificates[exp.id].map((cert, certIndex) => (
                            <a
                              key={certIndex}
                              href={cert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/30 hover:border-cyan-500/30 rounded-lg transition-all text-xs text-gray-300 hover:text-white group"
                            >
                              <FileText className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="truncate max-w-[200px]">{cert.name}</span>
                              <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
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
        multiple
        onChange={handleUploadPDF}
      />
    </div>
  );
}
