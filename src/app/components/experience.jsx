// import { useState, useEffect } from 'react';
// import { Briefcase, Calendar, Edit2, Trash2, Plus, X, Save, Building } from 'lucide-react';
// import { useAdmin } from '@/app/contexts/admin-context';
// import { supabase } from '@/lib/supabase';
// import { toast } from 'sonner';

// export default function Experience() {
//   const { adminMode } = useAdmin();
//   const [experiences, setExperiences] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [formData, setFormData] = useState({
//     company: '',
//     position: '',
//     start_date: '',
//     end_date: '',
//     is_current: false,
//     description: '',
//     display_order: 0
//   });

//   useEffect(() => {
//     fetchExperiences();
//   }, []);

//   const fetchExperiences = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('experience')
//         .select('*')
//         .order('display_order', { ascending: true });

//       if (error) throw error;
//       setExperiences(data || []);
//     } catch (error) {
//       console.error('Error fetching experiences:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (editingId) {
//         const { error } = await supabase
//           .from('experience')
//           .update(formData)
//           .eq('id', editingId);
//         if (error) throw error;
//         toast.success('Experience updated successfully!');
//       } else {
//         const { error } = await supabase
//           .from('experience')
//           .insert([formData]);
//         if (error) throw error;
//         toast.success('Experience added successfully!');
//       }
//       fetchExperiences();
//       resetForm();
//     } catch (error) {
//       toast.error('Error saving experience');
//       console.error(error);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!confirm('Delete this experience?')) return;
//     try {
//       const { error } = await supabase
//         .from('experience')
//         .delete()
//         .eq('id', id);
//       if (error) throw error;
//       toast.success('Experience deleted');
//       fetchExperiences();
//     } catch (error) {
//       toast.error('Error deleting experience');
//     }
//   };

//   const handleEdit = (exp) => {
//     setEditingId(exp.id);
//     setFormData({
//       company: exp.company,
//       position: exp.position,
//       start_date: exp.start_date,
//       end_date: exp.end_date || '',
//       is_current: exp.is_current,
//       description: exp.description,
//       display_order: exp.display_order
//     });
//     setShowAddModal(true);
//   };

//   const resetForm = () => {
//     setFormData({
//       company: '',
//       position: '',
//       start_date: '',
//       end_date: '',
//       is_current: false,
//       description: '',
//       display_order: experiences.length
//     });
//     setEditingId(null);
//     setShowAddModal(false);
//   };

//   if (loading) {
//     return (
//       <section className="py-20 px-4">
//         <div className="max-w-5xl mx-auto text-center text-gray-400">
//           Loading...
//         </div>
//       </section>
//     );
//   }

//   return (
//     <section className="py-20 px-4 min-h-screen">
//       <div className="max-w-5xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-16">
//           <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
//             Professional Experience
//           </h2>
//           <p className="text-gray-400 max-w-2xl mx-auto text-lg">
//             My journey through various roles in Web Development , building scalable solutions and innovative applications
//           </p>
//         </div>

//         {/* Add Button for Admin */}
//         {adminMode && (
//           <div className="mb-8 text-center">
//             <button
//               onClick={() => setShowAddModal(true)}
//               className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105 flex items-center gap-2 mx-auto"
//               style={{ background: 'var(--theme-gradient)' }}
//             >
//               <Plus className="w-5 h-5" />
//               Add Experience
//             </button>
//           </div>
//         )}

//         {/* Timeline */}
//         <div className="relative">
//           {/* Experience Items - Grid Layout */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {experiences.map((exp, index) => (
//               <div key={exp.id} className="relative">
//                 {/* Content Card */}
//                 <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-slate-700/50 hover:border-cyan-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-cyan-500/10 backdrop-blur-sm h-full">
//                   {/* Company & Badge */}
//                   <div className="flex items-start justify-between mb-3">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-700/50">
//                         <Building className="w-5 h-5" style={{ color: 'var(--theme-text-accent)' }} />
//                       </div>
//                       <div>
//                         <h3 className="text-lg font-bold text-white">{exp.company}</h3>
//                         {exp.is_current && (
//                           <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
//                             Current
//                           </span>
//                         )}
//                         {!exp.is_current && (
//                           <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-slate-700/50 text-gray-400 border border-slate-600/30">
//                             Past
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                     {adminMode && (
//                       <div className="flex gap-2">
//                         <button onClick={() => handleEdit(exp)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded">
//                           <Edit2 className="w-4 h-4" />
//                         </button>
//                         <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded">
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     )}
//                   </div>

//                   {/* Position */}
//                   <h4 className="text-base font-semibold mb-2" style={{ color: 'var(--theme-text-accent)' }}>
//                     {exp.position}
//                   </h4>

//                   {/* Date */}
//                   <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
//                     <Calendar className="w-4 h-4" />
//                     <span>
//                       {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
//                     </span>
//                   </div>

//                   {/* Description */}
//                   <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
//                     {exp.description}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {experiences.length === 0 && (
//           <div className="text-center py-12 text-gray-400">
//             No experience added yet.
//           </div>
//         )}
//       </div>

//       {/* Add/Edit Modal */}
//       {showAddModal && (
//         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
//             <div className="p-6">
//               <div className="flex items-center justify-between mb-6">
//                 <h3 className="text-xl font-bold text-white">
//                   {editingId ? 'Edit Experience' : 'Add Experience'}
//                 </h3>
//                 <button onClick={resetForm} className="text-gray-400 hover:text-white">
//                   <X className="w-6 h-6" />
//                 </button>
//               </div>

//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-2">Company *</label>
//                   <input
//                     type="text"
//                     required
//                     value={formData.company}
//                     onChange={(e) => setFormData({ ...formData, company: e.target.value })}
//                     className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-2">Position *</label>
//                   <input
//                     type="text"
//                     required
//                     value={formData.position}
//                     onChange={(e) => setFormData({ ...formData, position: e.target.value })}
//                     className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
//                     <input
//                       type="text"
//                       required
//                       placeholder="Jan 2023"
//                       value={formData.start_date}
//                       onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
//                       className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
//                     <input
//                       type="text"
//                       placeholder="Dec 2023"
//                       value={formData.end_date}
//                       onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
//                       disabled={formData.is_current}
//                       className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
//                     />
//                   </div>
//                 </div>



// {/* Certificates Upload */}
//                 {/* <div className="mt-4">
//                   <label className="block text-sm font-medium text-gray-300 mb-2">Upload Certificates (PDFs only)</label>
//                   <div className="flex items-center gap-2">
//                     <input
//                       type="file"
//                       accept="application/pdf"
//                       multiple
//                       onChange={(e) => handleCertificateUpload(e, editingId)}
//                       className="hidden"
//                       id="certificate-upload"
//                     />
//                     <label
//                       htmlFor="certificate-upload"
//                       className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105 flex items-center gap-2"
//                       style={{ background: 'var(--theme-gradient)' }}
//                     >
//                       <Upload className="w-5 h-5 inline mr-2" />
//                       Upload
//                     </label>
//                     {uploadingCerts && (
//                       <span className="text-sm text-gray-400">Uploading...</span>
//                     )}
//                   </div>
//                   {formData.certificates && formData.certificates.length > 0 && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
//                       {formData.certificates.map((cert, certIndex) => (
//                         <div key={certIndex} className="relative">
//                           <div className="bg-slate-700/50 border border-slate-600/30 rounded-lg p-2 flex items-center gap-2">
//                             <FileText className="w-4 h-4" />
//                             <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-300 hover:text-white">
//                               {cert.name}
//                             </a>
//                             {adminMode && (
//                               <button
//                                 onClick={() => handleRemoveCertFromForm(certIndex)}
//                                 className="absolute top-1 right-1 p-1 text-red-400 hover:bg-red-500/10 rounded"
//                               >
//                                 <Trash2 className="w-4 h-4" />
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>  */}
                

//                 <div className="flex items-center gap-2">
//                   <input
//                     type="checkbox"
//                     id="is_current"
//                     checked={formData.is_current}
//                     onChange={(e) => setFormData({ ...formData, is_current: e.target.checked, end_date: e.target.checked ? '' : formData.end_date })}
//                     className="w-4 h-4 rounded border-slate-600"
//                   />
//                   <label htmlFor="is_current" className="text-sm text-gray-300">Currently working here</label>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
//                   <textarea
//                     required
//                     rows={6}
//                     value={formData.description}
//                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                     className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 resize-none"
//                     placeholder="• Describe your responsibilities&#10;• Highlight key achievements&#10;• Mention technologies used"
//                   />
//                 </div>

//                 <div className="flex gap-3 pt-4">
//                   <button
//                     type="submit"
//                     className="flex-1 px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
//                     style={{ background: 'var(--theme-gradient)' }}
//                   >
//                     <Save className="w-5 h-5 inline mr-2" />
//                     {editingId ? 'Update' : 'Add'} Experience
//                   </button>
//                   <button
//                     type="button"
//                     onClick={resetForm}
//                     className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}
//     </section>
//   );
// }

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
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
    display_order: 0,
    certificates: []
  });

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experience')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        // Check if it's the certificates column error
        if (error.message?.includes("Could not find the 'certificates' column")) {
          toast.error(
            <div className="space-y-2">
              <p className="font-semibold">Database column missing!</p>
              <p className="text-sm">The 'certificates' column needs to be added.</p>
              <p className="text-xs">Run the SQL in /EXPERIENCE_TABLE_SETUP.sql</p>
            </div>,
            { duration: 10000 }
          );
        }
        throw error;
      }
      setExperiences(data || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateUpload = async (e, experienceId = null) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate files are PDFs
    const invalidFiles = files.filter(file => file.type !== 'application/pdf');
    if (invalidFiles.length > 0) {
      toast.error('Only PDF files are allowed');
      return;
    }

    setUploadingCerts(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${experienceId || 'temp'}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `certificates/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('experience-certificates')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('experience-certificates')
          .getPublicUrl(filePath);

        uploadedUrls.push({
          name: file.name,
          url: urlData.publicUrl,
          path: filePath
        });
      }

      if (experienceId) {
        // If editing existing experience, update it immediately
        const experience = experiences.find(exp => exp.id === experienceId);
        const updatedCerts = [...(experience.certificates || []), ...uploadedUrls];
        
        const { error } = await supabase
          .from('experience')
          .update({ certificates: updatedCerts })
          .eq('id', experienceId);

        if (error) throw error;
        
        toast.success(`${uploadedUrls.length} certificate(s) uploaded successfully!`);
        fetchExperiences();
      } else {
        // If adding new experience, just update form data
        setFormData(prev => ({
          ...prev,
          certificates: [...prev.certificates, ...uploadedUrls]
        }));
        toast.success(`${uploadedUrls.length} certificate(s) added!`);
      }
    } catch (error) {
      console.error('Error uploading certificates:', error);
      
      if (error.message?.includes('Bucket not found')) {
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">Storage bucket not found!</p>
            <p className="text-sm">Please verify bucket 'experience-certificates' exists</p>
          </div>,
          { duration: 8000 }
        );
      } else if (error.message?.includes('row-level security') || error.statusCode === '42501') {
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">Permission denied!</p>
            <p className="text-sm">Storage policies need to be configured.</p>
            <p className="text-xs">Run the SQL in /EXPERIENCE_TABLE_SETUP.sql</p>
          </div>,
          { duration: 8000 }
        );
      } else if (error.code === 'PGRST204') {
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">Database column missing!</p>
            <p className="text-sm">Run SQL: ALTER TABLE experience ADD COLUMN certificates JSONB DEFAULT '[]'</p>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error('Upload failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setUploadingCerts(false);
    }
  };

  const handleDeleteCertificate = async (experienceId, certIndex) => {
    if (!confirm('Delete this certificate?')) return;

    try {
      const experience = experiences.find(exp => exp.id === experienceId);
      const certToDelete = experience.certificates[certIndex];
      
      // Delete from storage
      if (certToDelete.path) {
        const { error: storageError } = await supabase.storage
          .from('experience-certificates')
          .remove([certToDelete.path]);

        if (storageError) console.error('Storage delete error:', storageError);
      }

      // Update database
      const updatedCerts = experience.certificates.filter((_, idx) => idx !== certIndex);
      const { error } = await supabase
        .from('experience')
        .update({ certificates: updatedCerts })
        .eq('id', experienceId);

      if (error) throw error;

      toast.success('Certificate deleted');
      fetchExperiences();
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error('Error deleting certificate');
    }
  };

  const handleRemoveCertFromForm = (certIndex) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, idx) => idx !== certIndex)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('experience')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Experience updated successfully!');
      } else {
        const { error } = await supabase
          .from('experience')
          .insert([formData]);
        if (error) throw error;
        toast.success('Experience added successfully!');
      }
      fetchExperiences();
      resetForm();
    } catch (error) {
      toast.error('Error saving experience');
      console.error(error);
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
      display_order: exp.display_order,
      certificates: exp.certificates || []
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
      display_order: experiences.length,
      certificates: []
    });
    setEditingId(null);
    setShowAddModal(false);
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
                  {exp.certificates && exp.certificates.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <h5 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" style={{ color: 'var(--theme-text-accent)' }} />
                        Certificates ({exp.certificates.length})
                      </h5>
                      <div className="grid grid-cols-1 gap-2">
                        {exp.certificates.map((cert, certIndex) => (
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
                                  handleDeleteCertificate(exp.id, certIndex);
                                }}
                                className="absolute top-1 right-1 p-1 text-red-400 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete certificate"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Certificate Button (Admin Mode) */}
                  {adminMode && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={(e) => handleCertificateUpload(e, exp.id)}
                        className="hidden"
                        id={`cert-upload-${exp.id}`}
                      />
                      <label
                        htmlFor={`cert-upload-${exp.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-cyan-500/50 rounded-lg text-sm text-gray-300 hover:text-white cursor-pointer transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Certificate
                      </label>
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
                      accept="application/pdf"
                      multiple
                      onChange={(e) => handleCertificateUpload(e, editingId)}
                      className="hidden"
                      id="certificate-upload"
                    />
                    <label
                      htmlFor="certificate-upload"
                      className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105 flex items-center gap-2"
                      style={{ background: 'var(--theme-gradient)' }}
                    >
                      <Upload className="w-5 h-5 inline mr-2" />
                      Upload
                    </label>
                    {uploadingCerts && (
                      <span className="text-sm text-gray-400">Uploading...</span>
                    )}
                  </div>
                  {formData.certificates && formData.certificates.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {formData.certificates.map((cert, certIndex) => (
                        <div key={certIndex} className="relative">
                          <div className="bg-slate-700/50 border border-slate-600/30 rounded-lg p-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-300 hover:text-white">
                              {cert.name}
                            </a>
                            {adminMode && (
                              <button
                                onClick={() => handleRemoveCertFromForm(certIndex)}
                                className="absolute top-1 right-1 p-1 text-red-400 hover:bg-red-500/10 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
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
