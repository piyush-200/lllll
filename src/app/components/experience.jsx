import { useState, useEffect } from 'react';
import { Briefcase, Calendar, Edit2, Trash2, Plus, X, Save, Building, Upload, FileText, Download, ExternalLink } from 'lucide-react';
import { useAdmin } from '@/app/contexts/admin-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Experience() {
  const { adminMode } = useAdmin();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadingCerts, setUploadingCerts] = useState(false);
  const [experienceCertificates, setExperienceCertificates] = useState({});
  
  // Staging states for pending certificate changes
  const [pendingCertUploads, setPendingCertUploads] = useState([]);
  const [pendingCertDeletions, setPendingCertDeletions] = useState([]);
  
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
    display_order: 0
  });

  useEffect(() => {
    fetchExperiences();
  }, []);

  useEffect(() => {
    // Fetch certificates for all experiences when they're loaded
    if (experiences.length > 0) {
      experiences.forEach(exp => {
        fetchCertificatesForExperience(exp.id);
      });
    }
  }, [experiences]);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experience')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        throw error;
      }
      setExperiences(data || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
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

  const handleCertificateUpload = async (e, experienceId) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (!editingId) {
      toast.error('Please save the experience first before uploading certificates');
      return;
    }

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

    // Stage files for upload instead of uploading immediately
    const newPendingFiles = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      id: `pending-${Date.now()}-${Math.random().toString(36).substring(7)}`
    }));

    setPendingCertUploads(prev => [...prev, ...newPendingFiles]);
    toast.success(`${files.length} certificate(s) staged for upload. Click "Update Experience" to save.`);
    
    // Reset file input
    e.target.value = '';
  };

  const handleDeleteCertificate = async (experienceId, certPath, certName) => {
    // Stage for deletion instead of deleting immediately
    setPendingCertDeletions(prev => [...prev, { path: certPath, name: certName }]);
    toast.success('Certificate marked for deletion. Click "Update Experience" to confirm.');
  };

  const handleRemovePendingUpload = (fileId) => {
    setPendingCertUploads(prev => prev.filter(f => f.id !== fileId));
    toast.success('Removed from upload queue');
  };

  const handleUndoDeleteCertificate = (certPath) => {
    setPendingCertDeletions(prev => prev.filter(c => c.path !== certPath));
    toast.success('Certificate deletion cancelled');
  };

  const processCertificateChanges = async (experienceId) => {
    const results = { uploaded: 0, deleted: 0, errors: [] };

    // Process deletions first
    for (const cert of pendingCertDeletions) {
      try {
        const { error } = await supabase.storage
          .from('experience-certificates')
          .remove([cert.path]);

        if (error) throw error;
        results.deleted++;
      } catch (error) {
        console.error('Error deleting certificate:', error);
        results.errors.push(`Failed to delete ${cert.name}`);
      }
    }

    // Process uploads
    for (const pendingFile of pendingCertUploads) {
      try {
        const fileExt = pendingFile.file.name.split('.').pop();
        const fileName = `exp-${experienceId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `certificates/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('experience-certificates')
          .upload(filePath, pendingFile.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        results.uploaded++;
      } catch (error) {
        console.error('Error uploading certificate:', error);
        
        if (error.message?.includes('Bucket not found')) {
          results.errors.push('Storage bucket not found! Create bucket in Supabase Storage.');
        } else if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
          results.errors.push('Permission denied! Run SQL in /EXPERIENCE_TABLE_SETUP.sql');
        } else {
          results.errors.push(`Failed to upload ${pendingFile.name}`);
        }
      }
    }

    return results;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setUploadingCerts(true);
    try {
      // Save/update experience data first
      if (editingId) {
        const { error } = await supabase
          .from('experience')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;

        // Process certificate changes only if editing an existing experience
        if (pendingCertUploads.length > 0 || pendingCertDeletions.length > 0) {
          const certResults = await processCertificateChanges(editingId);
          
          // Show results
          if (certResults.errors.length > 0) {
            toast.error(
              <div className="space-y-1">
                <p className="font-semibold">Some certificate operations failed:</p>
                {certResults.errors.map((err, i) => (
                  <p key={i} className="text-xs">{err}</p>
                ))}
              </div>,
              { duration: 10000 }
            );
          }
          
          if (certResults.uploaded > 0 || certResults.deleted > 0) {
            toast.success(
              `Experience updated! ${certResults.uploaded} certificate(s) uploaded, ${certResults.deleted} deleted.`
            );
          }
        } else {
          toast.success('Experience updated successfully!');
        }
      } else {
        const { error } = await supabase
          .from('experience')
          .insert([formData]);
        if (error) throw error;
        toast.success('Experience added successfully!');
      }
      
      // Clear staging states
      setPendingCertUploads([]);
      setPendingCertDeletions([]);
      
      fetchExperiences();
      resetForm();
    } catch (error) {
      toast.error('Error saving experience');
      console.error(error);
    } finally {
      setUploadingCerts(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this experience?')) return;
    try {
      const { error } = await supabase
        .from('experience')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Experience deleted');
      fetchExperiences();
    } catch (error) {
      toast.error('Error deleting experience');
    }
  };

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    setFormData({
      company: exp.company,
      position: exp.position,
      start_date: exp.start_date,
      end_date: exp.end_date || '',
      is_current: exp.is_current,
      description: exp.description,
      display_order: exp.display_order
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      company: '',
      position: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
      display_order: experiences.length
    });
    setEditingId(null);
    setShowAddModal(false);
    
    // Clear staging states when closing modal
    setPendingCertUploads([]);
    setPendingCertDeletions([]);
  };

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center text-gray-400">
          Loading...
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Professional Experience
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            My journey through various roles in DevOps, Machine Learning, and AI Engineering, building scalable solutions and innovative applications
          </p>
        </div>

        {/* Add Button for Admin */}
        {adminMode && (
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105 flex items-center gap-2 mx-auto"
              style={{ background: 'var(--theme-gradient)' }}
            >
              <Plus className="w-5 h-5" />
              Add Experience
            </button>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Experience Items - Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {experiences.map((exp, index) => (
              <div key={exp.id} className="relative">
                {/* Content Card */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-slate-700/50 hover:border-cyan-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-cyan-500/10 backdrop-blur-sm h-full">
                  {/* Company & Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-700/50">
                        <Building className="w-5 h-5" style={{ color: 'var(--theme-text-accent)' }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{exp.company}</h3>
                        {exp.is_current && (
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            Current
                          </span>
                        )}
                        {!exp.is_current && (
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-slate-700/50 text-gray-400 border border-slate-600/30">
                            Past
                          </span>
                        )}
                      </div>
                    </div>
                    {adminMode && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(exp)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Position */}
                  <h4 className="text-base font-semibold mb-2" style={{ color: 'var(--theme-text-accent)' }}>
                    {exp.position}
                  </h4>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {exp.description}
                  </p>

                  {/* Certificates */}
                  {experienceCertificates[exp.id] && experienceCertificates[exp.id].length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <h5 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" style={{ color: 'var(--theme-text-accent)' }} />
                        Certificates ({experienceCertificates[exp.id].length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {experienceCertificates[exp.id].map((cert, certIndex) => (
                          <div key={certIndex} className="relative group">
                            <a
                              href={cert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-cyan-500/30 rounded-lg p-2 transition-all"
                            >
                              <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <span className="text-xs text-gray-300 hover:text-white truncate flex-1">{cert.name}</span>
                              <ExternalLink className="w-3 h-3 text-gray-500 flex-shrink-0" />
                            </a>
                            {adminMode && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteCertificate(exp.id, cert.path, cert.name);
                                }}
                                className="absolute top-1 right-1 p-1 text-red-400 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title="Delete certificate immediately"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {experiences.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No experience added yet.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingId ? 'Edit Experience' : 'Add Experience'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Position *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jan 2023"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <input
                      type="text"
                      placeholder="Dec 2023"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      disabled={formData.is_current}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_current"
                    checked={formData.is_current}
                    onChange={(e) => setFormData({ ...formData, is_current: e.target.checked, end_date: e.target.checked ? '' : formData.end_date })}
                    className="w-4 h-4 rounded border-slate-600"
                  />
                  <label htmlFor="is_current" className="text-sm text-gray-300">Currently working here</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 resize-none"
                    placeholder="• Describe your responsibilities&#10;• Highlight key achievements&#10;• Mention technologies used"
                  />
                </div>

                {/* Certificates Upload */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Upload Certificates (PDFs only)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      onChange={(e) => handleCertificateUpload(e, editingId)}
                      className="hidden"
                      id="certificate-upload"
                      capture="environment"
                    />
                    <label
                      htmlFor="certificate-upload"
                      className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                      style={{ background: 'var(--theme-gradient)' }}
                    >
                      <Upload className="w-5 h-5" />
                      Upload PDFs
                    </label>
                    {pendingCertUploads.length > 0 && (
                      <span className="text-sm text-cyan-400">
                        {pendingCertUploads.length} pending upload{pendingCertUploads.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Show pending uploads */}
                  {pendingCertUploads.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        Pending Uploads (will upload when you click "Update Experience")
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {pendingCertUploads.map((pendingFile) => (
                          <div key={pendingFile.id} className="relative group">
                            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 pr-10 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <span className="text-sm text-cyan-300 truncate flex-1">
                                {pendingFile.name}
                              </span>
                              <span className="text-xs text-cyan-500/70">NEW</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePendingUpload(pendingFile.id)}
                                className="absolute top-2 right-2 p-1 text-cyan-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-all"
                                title="Remove from upload queue"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show existing certificates with deletion status */}
                  {editingId && experienceCertificates[editingId] && experienceCertificates[editingId].length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-400">Existing Certificates</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {experienceCertificates[editingId]
                          .filter(cert => !pendingCertDeletions.some(d => d.path === cert.path))
                          .map((cert, certIndex) => (
                            <div key={certIndex} className="relative group">
                              <div className="bg-slate-700/50 border border-slate-600/30 rounded-lg p-3 pr-10 flex items-center gap-2 hover:border-slate-500/50 transition-all">
                                <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                <a 
                                  href={cert.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-sm text-gray-300 hover:text-white truncate flex-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {cert.name}
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteCertificate(editingId, cert.path, cert.name);
                                  }}
                                  className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all"
                                  title="Mark for deletion"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Show certificates marked for deletion */}
                  {pendingCertDeletions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-red-400 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        Marked for Deletion (will delete when you click "Update Experience")
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {pendingCertDeletions.map((cert, idx) => (
                          <div key={idx} className="relative group">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 pr-10 flex items-center gap-2 opacity-60">
                              <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                              <span className="text-sm text-red-300 truncate flex-1 line-through">
                                {cert.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUndoDeleteCertificate(cert.path)}
                                className="absolute top-2 right-2 p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-all"
                                title="Undo deletion"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
                    style={{ background: 'var(--theme-gradient)' }}
                  >
                    <Save className="w-5 h-5 inline mr-2" />
                    {editingId ? 'Update' : 'Add'} Experience
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
