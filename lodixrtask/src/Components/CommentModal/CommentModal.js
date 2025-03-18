import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import $ from "jquery";
import Swal from "sweetalert2";
import "./CommentModal.css";

const CommentModal = ({ fundId, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [oldContent, setOldContent] = useState("");
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [downloadLinkHtml, setDownloadLinkHtml] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replies, setReplies] = useState({});
  const [editReplyId, setEditReplyId] = useState(null);
  const [editedReplyContent, setEditedReplyContent] = useState("");
  const [oldReplyContent, setOldReplyContent] = useState("");
  const [removeReplyAttachment, setRemoveReplyAttachment] = useState(false);
  const [replyDownloadLinkHtml, setReplyDownloadLinkHtml] = useState("");

  // Function to auto-resize the textarea
  const autoResize = (textarea) => {
    textarea.style.height = "auto"; // Reset textarea height
    textarea.style.height = textarea.scrollHeight + "px"; // Set new height
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await axios.get("http://localhost:3001/comments");
      setComments(response.data);
      
      // Fetch replies for each comment
      response.data.forEach(comment => {
        fetchReplies(comment.cmt_id);
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchReplies = async (commentId) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/replies/${commentId}`);
      setReplies(prev => ({
        ...prev,
        [commentId]: response.data
      }));
    } catch (error) {
      console.error(`Error fetching replies for comment ${commentId}:`, error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        Swal.fire({
          icon: "error",
          title: "Invalid file type",
          text: "Please upload jpg, jpeg, png or pdf file only.",
          confirmButtonColor: "#8392ab",
        });
        e.target.value = "";
        setAttachment(null);
      } else {
        setAttachment(file);
      }
    }
  };

  const handleReplyFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        Swal.fire({
          icon: "error",
          title: "Invalid file type",
          text: "Please upload jpg, jpeg, png or pdf file only.",
          confirmButtonColor: "#8392ab",
        });
        e.target.value = "";
        setReplyAttachment(null);
      } else {
        setReplyAttachment(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("comment", newComment);
    formData.append("id", fundId);
    if (attachment) formData.append("file", attachment);

    try {
      await axios.post("http://localhost:3001/api/send-comment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewComment("");
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchComments();
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  const handleReplySubmit = async (commentId) => {
    if (!replyContent.trim()) return;
    
    // Create form data according to the database schema
    const formData = new FormData();
    formData.append("cmt_content", replyContent);
    formData.append("cmt_fnd_id", fundId); // This should match cmt_fnd_id in the database
    formData.append("cmt_isReply_to", commentId); // This is the key field for replies
    
    // If you have user authentication, add the user ID
    // formData.append("cmt_added_by", userId);
    
    if (replyAttachment) {
      formData.append("file", replyAttachment); // The file itself
    }

    try {
      const response = await axios.post("http://localhost:3001/api/comments", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        },
      });
      
      if (response.data.success) {
        setReplyContent("");
        setReplyAttachment(null);
        setReplyToCommentId(null);
        setShowReplyForm(false);
        
        // Refresh the comments and replies
        fetchComments();
        
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Reply submitted successfully!",
          confirmButtonColor: "#8392ab",
          timer: 1500
        });
      } else {
        console.error("Error submitting reply:", response.data.error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.data.message || "Failed to submit reply. Please try again.",
          confirmButtonColor: "#8392ab",
        });
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      
      // More detailed error logging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to submit reply. Please try again.",
        confirmButtonColor: "#8392ab",
      });
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure you want to delete this comment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ea0606",
      cancelButtonColor: "#8392ab",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:3001/api/delete-comment/${id}`);
          fetchComments();
        } catch (error) {
          console.error("Error deleting comment:", error);
        }
      }
    });
  };

  const handleDeleteReply = async (replyId, commentId) => {
    const replyElement = $(`.reply-item[data-id="${replyId}"]`);
    const commentElement = $(`.comment-item[data-id="${commentId}"]`);
    const hasAttachment = replyElement.find("span.reply-attachment").text();
    
    Swal.fire({
      title: "Are you sure you want to delete this reply?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ea0606",
      cancelButtonColor: "#8392ab",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const countReplies = commentElement.find("span.count-replies");
          if (countReplies.length) {
            const currentCount = parseInt(countReplies.text()) || 0;
            if (currentCount > 0) {
              countReplies.text(currentCount - 1);
            }
          }
          
          if (hasAttachment) {
            const countAttachments = commentElement.find("span.count-attachments");
            if (countAttachments.length) {
              const currentCount = parseInt(countAttachments.text()) || 0;
              if (currentCount > 0) {
                countAttachments.text(currentCount - 1);
              }
            }
          }
          
          const response = await axios.get(`http://localhost:3001/api/delete-reply/${replyId}`, {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem('token')}`,
              "Content-Type": "application/json"
            }
          });
          
          if (response.data.success) {
            replyElement.remove();
            
            setReplies(prev => {
              const updatedReplies = { ...prev };
              if (updatedReplies[commentId]) {
                updatedReplies[commentId] = updatedReplies[commentId].filter(
                  reply => reply.reply_id !== replyId
                );
              }
              return updatedReplies;
            });
          } else {
            console.error("Failed to delete reply:", response.data.error);
          }
        } catch (error) {
          console.error("Error deleting reply:", error);
        }
      }
    });
  };

  const handleEdit = (id, content, attachment) => {
    setEditCommentId(id);
    setEditedContent(content);
    setOldContent(content);
    
    if (attachment) {
      const fileExtension = attachment.split('.').pop().toLowerCase();
      const icon = (fileExtension === 'pdf') 
        ? '<i class="fas fa-file-pdf text-danger me-1" style="font-size:14px"></i>' 
        : '<i class="far fa-file-image text-danger me-1" style="font-size:14px"></i>';
      
      const downloadButton = `<a href="http://localhost:3001/uploads/${attachment}" 
        class="btn btn-sm btn-light mb-0 rounded-pill font-weight-normal px-3 border border-secondary text-truncate text-xs shadow-none" 
        style="max-width:150px" target="_blank" title="${attachment}">${icon} ${attachment}</a>`;
      
      setDownloadLinkHtml(downloadButton);
    } else {
      setDownloadLinkHtml("");
    }
    
    initializeJQueryForEdit(id);
  };

  const initializeJQueryForEdit = (id) => {
    setTimeout(() => {
      const commentItem = $(`.comment-item[data-id="${id}"]`);
      
      if (commentItem.length) {
        commentItem.removeClass("bg-light").addClass("bg-white border border-dark");
        
        const textarea = commentItem.find("textarea");
        if (textarea.length) {
          const height = textarea[0].scrollHeight;
          textarea.css("height", height + "px");
          textarea.focus();
        }
        
        if (commentItem.find(".attachment-preview").length && commentItem.find(".attachment-link").length) {
          commentItem.find(".attachment-link").hide();
          commentItem.find(".attachment-preview").removeClass("d-none");
        }
      }
    }, 100);
  };

  const handleUpdate = async (id) => {
    try {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("content", editedContent);
      formData.append("removeAttachment", removeAttachment);
      
      const fileInput = $(`.comment-item[data-id="${id}"] .edit-file-input`)[0];
      if (fileInput && fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
      }

      await axios.post("http://localhost:3001/api/update-comment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditCommentId(null);
      setRemoveAttachment(false);
      setDownloadLinkHtml("");
      fetchComments();
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditCommentId(null);
    setEditedContent("");
    setOldContent("");
    setRemoveAttachment(false);
  };

  const handleRemoveAttachment = () => {
    setRemoveAttachment(true);
    $(`.comment-item[data-id="${editCommentId}"] .attachment-preview`).addClass("d-none");
  };
  
  const handleShowReplyForm = (commentId) => {
    setReplyToCommentId(commentId);
    setShowReplyForm(true);
    
    setTimeout(() => {
      const commentItem = $(`.comment-item[data-id="${commentId}"]`);
      const replyTextarea = commentItem.find(".reply-textarea");
      if (replyTextarea.length) {
        replyTextarea.focus();
      }
    }, 100);
  };

  const handleEditReply = (replyId, content, attachment, commentId) => {
    setEditReplyId(replyId);
    setEditedReplyContent(content);
    setOldReplyContent(content);
    
    if (attachment) {
      const fileExtension = attachment.split('.').pop().toLowerCase();
      const icon = (fileExtension === 'pdf') 
        ? '<i class="fas fa-file-pdf text-danger me-1" style="font-size:14px"></i>' 
        : '<i class="far fa-file-image text-danger me-1" style="font-size:14px"></i>';
      
      const downloadButton = `<a href="http://localhost:3001/uploads/${attachment}" 
        class="btn btn-sm btn-light mb-0 rounded-pill font-weight-normal px-3 border border-secondary text-truncate text-xs shadow-none" 
        style="max-width:150px" target="_blank" title="${attachment}">${icon} ${attachment}</a>`;
      
      setReplyDownloadLinkHtml(downloadButton);
    } else {
      setReplyDownloadLinkHtml("");
    }
    
    initializeJQueryForEditReply(replyId);
  };

  const initializeJQueryForEditReply = (replyId) => {
    setTimeout(() => {
      const replyItem = $(`.reply-item[data-id="${replyId}"]`);
      
      if (replyItem.length) {
        replyItem.removeClass("bg-light").addClass("bg-white border border-dark");
        
        const textarea = replyItem.find("textarea");
        if (textarea.length) {
          const height = textarea[0].scrollHeight;
          textarea.css("height", height + "px");
          textarea.focus();
        }
        
        if (replyItem.find(".attachment-preview").length && replyItem.find(".reply-attachment-link").length) {
          replyItem.find(".reply-attachment-link").hide();
          replyItem.find(".attachment-preview").removeClass("d-none");
        }
        
        replyItem.find(".default-actions").hide();
        replyItem.find(".update-actions").show();
      }
    }, 100);
  };

  const handleUpdateReply = async (replyId, commentId) => {
    try {
      const formData = new FormData();
      formData.append("id", replyId);
      formData.append("content", editedReplyContent);
      formData.append("removeClip", removeReplyAttachment);
      
      const fileInput = $(`.reply-item[data-id="${replyId}"] .update-upload-clip`)[0];
      if (fileInput && fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
      }

      const response = await axios.post("http://localhost:3001/api/update-comment-reply", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (response.data.success) {
        setEditReplyId(null);
        setRemoveReplyAttachment(false);
        setReplyDownloadLinkHtml("");
        
        setReplies(prev => {
          const updatedReplies = { ...prev };
          if (updatedReplies[commentId]) {
            updatedReplies[commentId] = updatedReplies[commentId].map(reply => {
              if (reply.reply_id === replyId) {
                return {
                  ...reply,
                  reply_content: editedReplyContent,
                  reply_attachment: response.data.file || (removeReplyAttachment ? null : reply.reply_attachment)
                };
              }
              return reply;
            });
          }
          return updatedReplies;
        });
      } else {
        console.error("Error updating reply:", response.data.error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to update reply. Please try again.",
          confirmButtonColor: "#8392ab",
        });
      }
    } catch (error) {
      console.error("Error updating reply:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update reply. Please try again.",
        confirmButtonColor: "#8392ab",
      });
    }
  };

  const handleCancelEditReply = () => {
    setEditReplyId(null);
    setEditedReplyContent("");
    setOldReplyContent("");
    setRemoveReplyAttachment(false);
  };

  const handleRemoveReplyAttachment = () => {
    setRemoveReplyAttachment(true);
    $(`.reply-item[data-id="${editReplyId}"] .attachment-preview`).addClass("d-none");
  };

  useEffect(() => {
    $(document).on("click", ".cancel-update-comment", function () {
      handleCancelEdit();
    });

    $(document).on("click", ".update-comment-clip", function () {
      const fileInput = $(this).closest(".comment-item").find(".edit-file-input");
      fileInput.trigger("click");
    });

    $(document).on("click", ".reply-clip", function () {
      const fileInput = $(this).closest("form").find("input.upload-clip");
      fileInput.trigger("click");
    });

    $(document).on("change", ".edit-file-input", function () {
      const fileInput = $(this);
      const commentItem = fileInput.closest(".comment-item");
      const filePreview = commentItem.find(".attachment-preview p");
      const fileContainer = commentItem.find(".attachment-preview");
      
      const files = this.files;
      if (files.length > 0) {
        const fileName = files[0].name;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        if (!allowedExtensions.includes(fileExtension)) {
          Swal.fire({
            icon: "error",
            title: "Invalid file type",
            text: "Please upload jpg, jpeg, png or pdf file only.",
            confirmButtonColor: "#8392a b",
          });
          fileInput.val("");
        } else {
          filePreview.text(fileName);
          filePreview.attr("title", fileName);
          fileContainer.removeClass("d-none");
        }
      }
    });

    $(document).on("change", ".upload-clip", function () {
      const fileInput = $(this);
      const form = fileInput.closest("form");
      const filePreview = form.find("p.uploaded-clip");
      const fileContainer = form.find("div.uploaded-container");

      const files = this.files;
      if (files.length > 0) {
        const fileName = files[0].name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        if (!allowedExtensions.includes(fileExtension)) {
          Swal.fire({
            icon: "error",
            title: "Invalid file type",
            text: "Please upload jpg, jpeg, png or pdf file only.",
            confirmButtonColor: "#8392ab",
          });
          fileInput.val("");
          setReplyAttachment(null);
        } else {
          filePreview.attr("title", fileName);
          filePreview.text(fileName);
          fileContainer.removeClass("d-none");
          setReplyAttachment(files[0]);
        }
      }
    });

    $(document).on("click", ".remove-attachment", function () {
      handleRemoveAttachment();
    });

    $(document).on("click", ".remove-clip", function () {
      const uploadFile = $(this).closest("form").find("input.upload-clip");
      const uploadedClip = $(this).closest("form").find("p.uploaded-clip");
      const uploadedContainer = $(this).closest("form").find("div.uploaded-container");
      
      uploadFile.val("");
      uploadedClip.text("");
      uploadedContainer.addClass("d-none");
      setReplyAttachment(null);
    });

    $(document).on("click", ".send-reply", function () {
      try {
      const commentId = $(this).closest(".comment-item").data("id");
        if (!commentId) {
          console.error("Could not find comment ID");
          return;
        }
        console.log("Sending reply to comment ID:", commentId);
      handleReplySubmit(commentId);
      } catch (err) {
        console.error("Error in send-reply click handler:", err);
      }
    });

    $(document).on("click", ".cancel-update-reply", function () {
      handleCancelEditReply();
    });

    $(document).on("click", ".update-reply-clip", function () {
      const fileInput = $(this).closest(".reply-item").find(".update-upload-clip");
      fileInput.trigger("click");
    });

    $(document).on("change", ".update-upload-clip", function () {
      const fileInput = $(this);
      const replyItem = fileInput.closest(".reply-item");
      const filePreview = replyItem.find(".attachment-preview p");
      const fileContainer = replyItem.find(".attachment-preview");
      
      const files = this.files;
      if (files.length > 0) {
        const fileName = files[0].name;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        if (!allowedExtensions.includes(fileExtension)) {
          Swal.fire({
            icon: "error",
            title: "Invalid file type",
            text: "Please upload jpg, jpeg, png or pdf file only.",
            confirmButtonColor: "#8392ab",
          });
          fileInput.val("");
        } else {
          filePreview.text(fileName);
          filePreview.attr("title", fileName);
          fileContainer.removeClass("d-none");
        }
      }
    });

    $(document).on("click", ".update-remove-clip", function () {
      handleRemoveReplyAttachment();
    });

    $(document).on("click", ".update-reply", function () {
      const replyId = $(this).closest(".reply-item").data("id");
      const commentId = $(this).closest(".reply-list").prev(".comment-item").data("id");
      handleUpdateReply(replyId, commentId);
    });

    return () => {
      $(document).off("click", ".cancel-update-comment");
      $(document).off("click", ".update-comment-clip");
      $(document).off("change", ".edit-file-input");
      $(document).off("click", ".remove-attachment");
      $(document).off("click", ".reply-clip");
      $(document).off("change", ".upload-clip");
      $(document).off("click", ".remove-clip");
      $(document).off("click", ".send-reply");
      $(document).off("click", ".cancel-update-reply");
      $(document).off("click", ".update-reply-clip");
      $(document).off("change", ".update-upload-clip");
      $(document).off("click", ".update-remove-clip");
      $(document).off("click", ".update-reply");
    };
  }, [editCommentId, replyToCommentId, editReplyId, replyContent, replyAttachment, fundId]);

  return (
    <div className="modal-overlay">
      <div className="modal-content shadow-lg border-0">
        {/* Header */}
        <div className="modal-header bg-light border-bottom border-light d-flex justify-content-between align-items-center py-3">
          <h5 className="modal-title fw-bold text-primary m-0">
            <i className="fas fa-comments me-2"></i>Comment
          </h5>
          <button className="btn-close shadow-none" onClick={onClose}></button>
        </div>

        {/* Body */}
        <div className="modal-body p-4">
          {/* Comments List */}
          <div className="comment-list mb-4">
            {comments.length === 0 ? (
              <div className="text-center py-5">
                <i className="far fa-comment-dots text-muted mb-3" style={{ fontSize: "3rem" }}></i>
                <p className="text-muted">No comments yet. Be the first to start the discussion!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div 
                  key={comment.cmt_id} 
                  className={`comment-item bg-light rounded p-4 mb-4 ${editCommentId === comment.cmt_id ? "border border-primary" : ""}`}
                  data-id={comment.cmt_id}
                >
                  {/* Comment Author Info */}
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{ width: "40px", height: "40px", fontSize: "1rem" }}>
                        <span className="fw-bold">DF</span>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold">Donna Fidelino</h6>
                        <small className="text-muted">Proponent</small>
                      </div>
                    </div>
                    <div>
                      <small className="text-muted">{new Date(comment.created_at).toLocaleString()}</small>
                    </div>
                  </div>

                  {/* Comment Content */}
                  {editCommentId === comment.cmt_id ? (
                    <>
                      <div className="mb-3">
                        <textarea
                          className="form-control border-primary"
                          style={{ resize: "none" }}
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          onInput={(e) => autoResize(e.target)}
                          rows="3"
                        />
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          {comment.cmt_attachment && !removeAttachment && (
                            <div className="d-flex align-items-center mb-2">
                              <i className={`${comment.cmt_attachment.endsWith('.pdf') ? 'fas fa-file-pdf text-danger' : 'far fa-file-image text-primary'} me-2`}></i>
                              <span className="text-truncate" style={{ maxWidth: "200px" }}>{comment.cmt_attachment}</span>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-link text-danger p-0 ms-2 remove-attachment"
                                title="Remove attachment"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          )}
                          
                          <input 
                            type="file" 
                            className="d-none edit-file-input" 
                            accept="application/pdf,image/jpeg,image/jpg,image/png" 
                          />
                          
                          <div className={`attachment-preview ${!removeAttachment ? "d-none" : ""}`}>
                            <p className="mb-0 text-truncate"></p>
                          </div>
                        </div>
                        
                        <div className="btn-group">
                          <button className="btn btn-sm btn-outline-primary update-comment-clip" title="Attach file">
                            <i className="fas fa-paperclip"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-secondary cancel-update-comment">Cancel</button>
                          <button className="btn btn-sm btn-primary update-comment" onClick={() => handleUpdate(comment.cmt_id)}>
                            <i className="fas fa-check me-1"></i>Update
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="comment-content mb-3">{comment.cmt_content}</p>
                      
                      {/* Attachment */}
                      {comment.cmt_attachment && (
                        <div className="attachment-card mb-3 p-2 border rounded bg-white">
                          <a 
                            className="d-flex align-items-center text-decoration-none"
                            href={`http://localhost:3001/uploads/${comment.cmt_attachment}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <div className="attachment-icon me-2">
                              <i className="far fa-file-image text-primary"></i>
                            </div>
                            <div className="attachment-details">
                              <p className="mb-0 text-primary">{comment.cmt_attachment}</p>
                              <small className="text-muted">Click to view</small>
                            </div>
                          </a>
                        </div>
                      )}
                      
                      {/* Comment Actions */}
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <button className="btn btn-sm btn-outline-primary me-2" style={{ pointerEvents: 'none' }}>
                            <i className="far fa-comment-alt me-1"></i>{replies[comment.cmt_id]?.length || 0}
                          </button>
                          <button className="btn btn-sm btn-outline-primary" style={{ pointerEvents: 'none' }}>
                            <i className="fas fa-paperclip me-1"></i>
                            {(comment.cmt_attachment ? 1 : 0) + 
                             (replies[comment.cmt_id]?.filter(reply => reply.reply_attachment).length || 0)}
                          </button>
                        </div>
                        
                        <div>
                          <button 
                            className="btn btn-sm btn-outline-primary me-1 reply-to-comment"
                            onClick={() => handleShowReplyForm(comment.cmt_id)}
                          >
                            <i className="fas fa-reply me-1"></i>Reply
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-secondary me-1 edit-comment"
                            onClick={() => handleEdit(comment.cmt_id, comment.cmt_content, comment.cmt_attachment)}
                          >
                            <i className="fas fa-pencil-alt me-1"></i>Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger delete-comment"
                            onClick={() => handleDelete(comment.cmt_id)}
                          >
                            <i className="fas fa-trash me-1"></i>Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Reply Form */}
                  {replyToCommentId === comment.cmt_id && (
                    <div className="reply-form mt-3 p-3 bg-white rounded border">
                      <form className="rounded">
                        <div className="mb-3">
                          <textarea
                            className="form-control reply-textarea"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onInput={(e) => autoResize(e.target)}
                            placeholder="Write a reply..."
                            rows="2"
                            required
                          ></textarea>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <input 
                              type="file" 
                              className="d-none upload-clip" 
                              accept="application/pdf,image/jpeg,image/jpg,image/png"
                              onChange={handleReplyFileChange}
                            />
                            
                            {replyAttachment && (
                              <div className="d-flex align-items-center mb-2 p-2 bg-light rounded border">
                                <i className={`${replyAttachment.type.includes('pdf') ? 'fas fa-file-pdf text-danger' : 'far fa-file-image text-primary'} me-2`}></i>
                                <span className="text-truncate" style={{ maxWidth: "200px" }}>{replyAttachment.name}</span>
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-link text-danger p-0 ms-2 remove-clip"
                                  title="Remove attachment"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="btn-group">
                            <button type="button" className="btn btn-sm btn-outline-primary reply-clip" title="Attach file">
                              <i className="fas fa-paperclip"></i>
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setReplyToCommentId(null);
                                setReplyContent("");
                                setReplyAttachment(null);
                              }}
                            >
                              Cancel
                            </button>
                            <button type="button" className="btn btn-sm btn-primary send-reply">
                              <i className="fas fa-paper-plane me-1"></i>Send
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Replies List */}
                  {replies[comment.cmt_id] && replies[comment.cmt_id].length > 0 && (
                    <div className="reply-list mt-3 ms-4 ps-2 border-start">
                      {replies[comment.cmt_id].map(reply => (
                        <div 
                          key={reply.reply_id} 
                          className={`reply-item bg-white rounded p-3 mb-2 ${editReplyId === reply.reply_id ? "border border-primary" : "border"}`}
                          data-id={reply.reply_id}
                        >
                          {/* Reply Author Info */}
                          <div className="d-flex align-items-center mb-2">
                            <div className="bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{ width: "30px", height: "30px", fontSize: "0.8rem" }}>
                              <span className="fw-bold">DF</span>
                            </div>
                            <div>
                              <h6 className="mb-0 fw-bold fs-6">Donna Fidelino</h6>
                              <small className="text-muted">Proponent • {new Date(reply.reply_created_at).toLocaleString()}</small>
                            </div>
                          </div>
                          
                          {/* Reply Content */}
                          {editReplyId === reply.reply_id ? (
                            <>
                              <div className="mb-3">
                                <textarea
                                  className="form-control border-primary"
                                  style={{ resize: "none" }}
                                  value={editedReplyContent}
                                  onChange={(e) => setEditedReplyContent(e.target.value)}
                                  onInput={(e) => autoResize(e.target)}
                                  rows="2"
                                />
                              </div>
                              
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  {reply.reply_attachment && !removeReplyAttachment && (
                                    <div className="d-flex align-items-center mb-2">
                                      <i className={`${reply.reply_attachment.endsWith('.pdf') ? 'fas fa-file-pdf text-danger' : 'far fa-file-image text-primary'} me-2`}></i>
                                      <span className="text-truncate" style={{ maxWidth: "200px" }}>{reply.reply_attachment}</span>
                                      <button 
                                        type="button" 
                                        className="btn btn-sm btn-link text-danger p-0 ms-2 update-remove-clip"
                                        title="Remove attachment"
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                    </div>
                                  )}
                                  
                                  <input 
                                    type="file" 
                                    className="d-none update-upload-clip" 
                                    accept="application/pdf,image/jpeg,image/jpg,image/png" 
                                  />
                                </div>
                                
                                <div className="btn-group">
                                  <button className="btn btn-sm btn-outline-primary update-reply-clip" title="Attach file">
                                    <i className="fas fa-paperclip"></i>
                                  </button>
                                  <button className="btn btn-sm btn-outline-secondary cancel-update-reply">Cancel</button>
                                  <button className="btn btn-sm btn-primary update-reply">
                                    <i className="fas fa-check me-1"></i>Update
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="card-text reply-content mb-2">{reply.reply_content}</p>
                              
                              {/* Reply Attachment */}
                              {reply.reply_attachment && (
                                <div className="attachment-card mb-3 p-2 border rounded bg-light">
                                  <a 
                                    className="d-flex align-items-center text-decoration-none"
                                    href={`http://localhost:3001/uploads/${reply.reply_attachment}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <div className="attachment-icon me-2">
                                      {reply.reply_attachment.endsWith('.pdf') ? (
                                        <i className="fas fa-file-pdf text-danger"></i>
                                      ) : (
                                        <i className="far fa-file-image text-primary"></i>
                                      )}
                                    </div>
                                    <div className="attachment-details">
                                      <p className="mb-0 text-truncate" style={{ maxWidth: "180px" }}>
                                        <span className="reply-attachment">{reply.reply_attachment}</span>
                                      </p>
                                      <small className="text-muted">Click to view</small>
                                    </div>
                                  </a>
                                </div>
                              )}
                              
                              {/* Reply Actions */}
                              <div className="d-flex justify-content-end">
                                <div className="btn-group">
                                  <button 
                                    className="btn btn-sm btn-outline-secondary edit-reply default-actions" 
                                    onClick={() => handleEditReply(reply.reply_id, reply.reply_content, reply.reply_attachment, comment.cmt_id)}
                                  >
                                    <i className="fas fa-pencil-alt"></i>
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-danger delete-reply default-actions" 
                                    onClick={() => handleDeleteReply(reply.reply_id, comment.cmt_id)}
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* New Comment Form */}
          <div className="card shadow-sm">
            <div className="card-body p-3">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onInput={(e) => autoResize(e.target)}
                    placeholder="Write a comment..."
                    rows="3"
                    required
                  ></textarea>
                </div>
                
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <button type="button" className="btn btn-outline-primary" onClick={() => fileInputRef.current.click()}>
                      <i className="fas fa-paperclip me-1"></i>Attach File
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="d-none"
                        accept="application/pdf,image/jpeg,image/jpg,image/png"
                      />
                    </button>
                    
                    {attachment && (
                      <div className="d-flex align-items-center mt-2 p-2 bg-light rounded border">
                        <i className={attachment.type.includes('pdf') ? "fas fa-file-pdf text-danger me-2" : "far fa-file-image text-primary me-2"}></i>
                        <span className="text-truncate" style={{ maxWidth: "200px" }}>{attachment.name}</span>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-link text-danger p-0 ms-2"
                          onClick={() => {
                            setAttachment(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-paper-plane me-1"></i>Post Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;