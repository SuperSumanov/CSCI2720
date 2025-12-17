const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comments');
const Location = require('../models/Location');
const { requireAuth, requireUser } = require('../middleware/auth');

const router = express.Router();

// POST /comment/send
// 对某个location发出评论
router.post('/send', requireAuth, requireUser, async (req, res) => {
  try {
    const { locID, content } = req.body;

    if (!locID || typeof locID !== 'string' || locID.trim().length === 0) {
      return res.status(400).json({ error: 'locID is required and must be a non-empty string' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content is required and must be a non-empty string' });
    }

    // 限制评论内容长度（例如最多5000字符）
    const trimmedContent = content.trim();
    if (trimmedContent.length > 5000) {
      return res.status(400).json({ error: 'Comment content is too long (maximum 5000 characters)' });
    }

    const trimmedLocID = locID.trim();

    const location = await Location.findOne({ id: trimmedLocID });
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const comment = new Comment({
      userId: req.user._id,
      locationId: trimmedLocID,
      content: trimmedContent
    });
    await comment.save();

    res.status(201).json({ message: 'Comment created successfully', comment });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /comment/del/:cmtID
// 删除某条评论（只能删除自己的）
router.delete('/del/:cmtID', requireAuth, requireUser, async (req, res) => {
  try {
    const commentId = req.params.cmtID;

    if (!commentId || typeof commentId !== 'string' || commentId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId.trim())) {
      return res.status(400).json({ error: 'Invalid comment ID format' });
    }

    const trimmedCommentId = commentId.trim();
    const userId = req.user._id;

    const comment = await Comment.findById(trimmedCommentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own comments' });
    }

    await Comment.findByIdAndDelete(trimmedCommentId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /comment/my-all
// 展示该用户发出的所有评论
router.get('/my-all', requireAuth, requireUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const comments = await Comment.find({ userId }).sort({ timestamp: -1 });

    const locationIds = [...new Set(comments.map(cmt => cmt.locationId))];
    const locations = await Location.find({ id: { $in: locationIds } });

    const commentsWithLocation = comments.map(comment => {
      const location = locations.find(loc => loc.id === comment.locationId);
      return {
        commentId: comment._id,
        locationId: comment.locationId,
        content: comment.content,
        timestamp: comment.timestamp,
        location: location || null
      };
    });

    res.json(commentsWithLocation);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /loc-all/:locID
// 该location的所有评论（不需要鉴权）
router.get('/loc-all/:locID', async (req, res) => {
  try {
    const locationId = req.params.locID;

    if (!locationId || typeof locationId !== 'string' || locationId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid location ID' });
    }

    const trimmedLocationId = locationId.trim();

    const location = await Location.findOne({ id: trimmedLocationId });
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const comments = await Comment.find({ locationId: trimmedLocationId }).sort({ timestamp: -1 });

    const commentsWithUser = comments.map(comment => ({
      commentId: comment._id,
      userId: comment.userId,
      locationId: comment.locationId,
      content: comment.content,
      timestamp: comment.timestamp
    }));

    res.json(commentsWithUser);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

