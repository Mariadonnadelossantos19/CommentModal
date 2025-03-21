const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Change to your DB username
  password: "", // Change to your DB password
  database: "commentmodal_db", // Change to your DB name
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to database");
});

// Configure file upload storage
const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Fetch comments and replies as a nested structure
app.get("/comments", (req, res) => {
  const sql = `SELECT * FROM tblcomments ORDER BY created_at ASC`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const commentMap = {};
    const rootComments = [];

    results.forEach((comment) => {
      comment.replies = [];
      commentMap[comment.cmt_id] = comment;

      if (comment.cmt_isReply_to === null) {
        rootComments.push(comment);
      } else {
        const parent = commentMap[comment.cmt_isReply_to];
        if (parent) {
          parent.replies.push(comment);
        }
      }
    });

    res.json(rootComments);
  });
});

// Add a new comment with attachment support
app.post("/api/send-comment", upload.single("file"), (req, res) => {
  const { comment, id, conceptID, conceptType } = req.body;
  const cmt_attachment = req.file ? req.file.filename : null;

  if (!comment || !id) {
    return res.status(400).json({ error: "Comment content and ID are required!" });
  }

  const sql = `
    INSERT INTO tblcomments (cmt_fnd_id, cmt_content, cmt_attachment, cmt_added_by, created_at) 
    VALUES (?, ?, ?, ?, NOW())
  `;

  db.query(sql, [id, comment, cmt_attachment, conceptID], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Comment added successfully", commentId: result.insertId, file: cmt_attachment });
  });
});

// Update a comment
app.post("/api/update-comment", upload.single("file"), (req, res) => {
  const { id, content, removeClip } = req.body;
  const newAttachment = req.file ? req.file.filename : null;

  let sql = "UPDATE tblcomments SET cmt_content = ?, updated_at = NOW()";
  const values = [content, id];

  if (removeClip === "true") {
    sql += ", cmt_attachment = NULL";
  } else if (newAttachment) {
    sql += ", cmt_attachment = ?";
    values.unshift(newAttachment);
  }

  sql += " WHERE cmt_id = ?";

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Comment updated successfully", file: newAttachment });
  });
});

// Delete a comment
app.delete("/api/delete-comment/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM tblcomments WHERE cmt_id = ?`;
  
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Comment deleted successfully" });
  });
});

// POST /api/comments - Create a new comment or reply
app.post('/api/comments', upload.single('file'), async (req, res) => {
  try {
    const { cmt_content, cmt_fnd_id, cmt_isReply_to, cmt_added_by } = req.body;
    
    // Handle file upload if present
    let cmt_attachment = null;
    if (req.file) {
      cmt_attachment = req.file.filename;
    }
    
    // Insert into database
    const result = await db.query(
      'INSERT INTO tblcomments (cmt_content, cmt_fnd_id, cmt_isReply_to, cmt_added_by, cmt_attachment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [cmt_content, cmt_fnd_id, cmt_isReply_to || null, cmt_added_by || null, cmt_attachment]
    );
    
    res.json({ success: true, commentId: result.insertId });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
});

// GET /api/comments - Get all top-level comments (not replies)
app.get('/api/comments', async (req, res) => {
  try {
    const comments = await db.query(
      'SELECT * FROM tblcomments WHERE cmt_isReply_to IS NULL AND cmt_isArchived = 0 ORDER BY created_at DESC'
    );
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});