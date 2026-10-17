//for lg,sm, md images

import React, { useEffect, useState } from "react";
import Profiles from '../../templates/ImagesLoader'
import Sidebar from './templates/Sidebar'
import { imageUrl } from '../../../utils/imageUrl';

import { PhotoProvider, PhotoView } from 'react-photo-view';
import { 
  fetchUserGallery, 
  uploadUserGallery, 
  updateProfileStatus,
  deleteGalleryRecord  // ✅ Import the delete function
} from '../../../services/userService';

const AddGallery = () => {
  const [files, setFiles] = useState([]);
  const [fileDetails, setFileDetails] = useState([]);
  const [getGallery, setGetGallery] = useState([]);
  const [imgcount, setimgcount] = useState(0)
  const [trigger, setTrigger] = useState(false)
  
  const loggedInUserId = localStorage.getItem("userId");

  useEffect(() => { 
    const fetchUserData = async () => {  
      try {
        const res = await fetchUserGallery(loggedInUserId);
        setGetGallery(res.data);
        setimgcount((res.data).length);
      }
      catch (error) { 
        console.error('Error fetching user gallery:', error); 
      }
    };
    fetchUserData(); 
  }, [loggedInUserId, trigger]); 

  const maxFiles = 3;

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const dbfilescount  = imgcount;

    if (dbfilescount + selectedFiles.length > maxFiles) {
      alert(`Limit ${maxFiles} reached. ${maxFiles - dbfilescount} files can upload.`);
      return;
    }

    // ── Convert to base64 only — Sharp on backend handles all resizing ────────
    const base64Files = await Promise.all(
      selectedFiles.map((file) => convertBase64(file))
    );

    setFiles(base64Files);
    setFileDetails(selectedFiles.map((file, index) => ({
      name:    file.name,
      size:    (file.size / 1024).toFixed(2) + ' KB',
      preview: base64Files[index]
    })));
  };

  // ── Convert file to base64 string ─────────────────────────────────────────
  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload  = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;
    
    const dbfilescount = imgcount;
    if (dbfilescount >= maxFiles) {
      alert(`Limit ${maxFiles} reached.`);
      return;
    }
    
    const gallery = files.map((file) => ({
      imagepath:   file,   // base64 — Sharp on backend creates original/medium/thumb
      isprofile:   false,
      userid:      loggedInUserId,
      updateddate: new Date().toISOString().split('T')[0],
    }));

    // ── Send as JSON — backend Sharp processes into 3 sizes ───────────────────
    try {
      const response = await uploadUserGallery({ gallery: JSON.stringify(gallery) });
      console.log("Files uploaded successfully:", response.data);
      setTrigger(!trigger);  // Refresh gallery
      setFiles([]);          // Clear pending files
      setFileDetails([]);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Upload failed. Please try again.");
    }
  };
 
  // ✅ Delete from pending uploads (before server upload)
  const handleDeletePending = (index, event) => { 
    event.preventDefault();
    const updatedFiles = files.filter((_, i) => i !== index); 
    const updatedFileDetails = fileDetails.filter((_, i) => i !== index); 
    setFiles(updatedFiles); 
    setFileDetails(updatedFileDetails); 
  };

  // ✅ NEW: Delete from database (existing gallery images)
  const handleDeleteGalleryImage = async (galleryRecordId, event) => {
    if (event) event.preventDefault();
    
    // 🔐 Confirm before delete
    if (!window.confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      return;
    }

    try {
      // ✅ Call userService with BOTH gallery ID and user ID
      const response = await deleteGalleryRecord(galleryRecordId, Number(loggedInUserId));
      
      console.log("[DELETE] response:", response.data);
      
      if (response.data.status === "Success") {
        // ✨ Remove deleted image from UI instantly
        setGetGallery(prev => prev.filter(img => img.id !== galleryRecordId));
        setimgcount(prev => prev - 1);
        alert("Photo deleted successfully!");
      } else {
        alert(response.data.result || "Failed to delete photo.");
      }
    } catch (error) {
      console.error("[DELETE] error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const makeProfile = async (imgid) => { 
    try {
      await updateProfileStatus(imgid);
      setTrigger(!trigger);  // Refresh gallery to show updated profile status
    }
    catch(error) {
      console.error("Error updating profile status:", error);
      alert("Failed to set profile picture.");
    }
  }

  return (
    <>
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>Gallery & Profile Settings
             {/* {imgcount}/3 Images */}
            
          </h3>
        </div>
      </div>
      
      <div className="inner-content">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">
              <Sidebar trigger={trigger}></Sidebar>
              
              <div className="col-lg-8 col-md-8">
                <div className="translateY-60"> 
                  <div className="add-listing-box opening-day mrg-bot-25 padd-bot-30 padd-top-25">
                    
                    {/* Header */}
                    <div className="listing-box-header"> 
                      <i className="fas fa-images"></i>
                      <h3>Manage Photos & Profile Pictures</h3>
                      <p>You can upload max {maxFiles} images. <a href="#">Upgrade</a> for more.</p>
                    </div>
                    
                    {/* Upload Form */}
                    <form onSubmit={handleUpload}>
                      <div className="mrg-r-10 mrg-l-10"> 
                        <div className="dropzone">
                          <input type="file" multiple onChange={handleFileChange} accept="image/*" />
                          
                          {/* Pending Files Preview */}
                          {fileDetails.length > 0 && ( 
                            <div> 
                              <h4>Selected Files:</h4> 
                              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                {fileDetails.map((file, index) => ( 
                                  <div key={index} style={{ margin: '10px', textAlign: 'center', position: 'relative' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '500' }}>{file.name}</div> 
                                    <img 
                                      src={file.preview} 
                                      alt={`Preview ${index}`} 
                                      style={{ maxWidth: '100px', margin: '10px 0', borderRadius: '4px' }} 
                                    />
                                    <div>
                                      {/* Delete Pending File Button */}
                                      <button 
                                        type="button"
                                        className="btn btn-danger btn-sm" 
                                        onClick={(event) => handleDeletePending(index, event)}
                                        style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0 }}
                                        title="Remove from upload"
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>{file.size}</div> 
                                  </div> 
                                ))} 
                              </div> 
                            </div> 
                          )} 
                        </div>
                      </div>
                      
                      <div className="text-center mt-3">
                        <button type="submit" className="sub" disabled={files.length === 0}>
                          Upload {files.length > 0 && `(${files.length})`}
                        </button>
                      </div>
                    </form>
                    
                    <hr/>
                    
                    {/* Existing Gallery Images */}
                    <div className="text-center mt-3"> 
                      <h3>SET AS PROFILE PICTURE</h3>
                      <p style={{ fontSize: '13px', color: '#666' }}>Click "Set as Profile" to change your main profile picture</p>
                    </div>
                   
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '20px' }}>
                      <PhotoProvider>
                        {getGallery.length > 0 ? (
                          getGallery.map((file) => (
                            <div
                              key={file.id}  // ✅ Use file.id (gallery record ID)
                              style={{
                                margin: '10px',
                                textAlign: 'center',
                                background: "#f8f9fa",
                                borderRadius: '8px',
                                padding: '10px',
                                border: file.isprofile ? '2px solid #28a745' : '1px solid #dee2e6',
                                position: 'relative',
                                width: '180px'
                              }}
                            >
                              {/* Profile Badge */}
                              {file.isprofile && (
                                <span className="badge badge-success" 
                                  style={{ 
                                    position: 'absolute', 
                                    top: '8px', 
                                    left: '8px', 
                                    zIndex: 10,
                                    fontSize: '10px',
                                    padding: '3px 8px'
                                  }}>
                                  <i className="fas fa-star"></i> Profile
                                </span>
                              )}
                              
                              {/* ✅ Delete Button for Existing Images */}
                              {!file.isprofile && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={(e) => handleDeleteGalleryImage(file.id, e)}  // ✅ file.id = gallery record ID
                                  style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    zIndex: 10,
                                    borderRadius: '50%',
                                    width: '28px',
                                    height: '28px',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                  }}
                                  title="Delete this photo"
                                >
                                  <i className="fas fa-trash" style={{ fontSize: '12px' }}></i>
                                </button>
                              )}
                              
                              {/* Image */}
                              {/* <div> */}
                                {/* ── original for lightbox, medium for card display ── */}
                                {/* <PhotoView src={file.imagepath}> */}
                                  {/* <img
                                    // src={file.imagepath_medium || file.imagepath}
                                  //   src={imageUrl(file.imagepath_medium) || imageUrl(file.imagepath)}
                                  //   alt={`Gallery ${file.id}`}
                                  //   style={{
                                  //     width: '100%',
                                  //     height: '220px',
                                  //     objectFit: 'cover',
                                  //     borderRadius: '4px',
                                  //     cursor: 'pointer'
                                  //   }}
                                  // /> */}
                                {/* // </PhotoView>
                              // </div> */}
                              {/* Image */}
                              <div>
                                {/* ── ✅ FIXED: Medium for BOTH lightbox and card display ── */}
                                <PhotoView src={imageUrl(file.imagepath_medium) || imageUrl(file.imagepath)}>
                                  <img
                                    src={imageUrl(file.imagepath_medium) || imageUrl(file.imagepath)}
                                    alt={`Gallery ${file.id}`}
                                    style={{
                                      width: '100%',
                                      height: '220px',
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  />
                                </PhotoView>
                              </div>
                              {/* Action Buttons */}
                              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                {/* Set as Profile Button */}
                                <button
                                  type="button"
                                  className={`btn ${file.isprofile ? 'btn-success' : 'btn-primary'} btn-sm`}
                                  onClick={() => makeProfile(file.id)}
                                  disabled={file.isprofile}
                                  style={{ fontSize: '11px', padding: '4px 10px' }}
                                >
                                  {file.isprofile ? "✓ Current" : "Set Profile"}
                                </button>
                                
                                {/* Delete Button (Mobile-friendly text version) */}
                                {!file.isprofile && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={(e) => handleDeleteGalleryImage(file.id, e)}
                                    style={{ fontSize: '11px', padding: '4px 10px' }}
                                  >
                                    <i className="fas fa-trash"></i> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ 
                            width: '100%', 
                            padding: '40px', 
                            textAlign: 'center', 
                            color: '#666',
                            background: '#f8f9fa',
                            borderRadius: '8px'
                          }}>
                            <i className="fas fa-images" style={{ fontSize: '48px', marginBottom: '10px', display: 'block' }}></i>
                            <p>No gallery images yet.</p>
                            <p style={{ fontSize: '13px' }}>Upload photos to get started!</p>
                          </div>
                        )}
                      </PhotoProvider>
                    </div>

                  </div> 
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddGallery;
 