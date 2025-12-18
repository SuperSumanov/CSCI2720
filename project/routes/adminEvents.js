const express = require("express");
const Event = require("../models/Event");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireAdmin);

// 获取所有活动
router.get("/", async (req, res) => {
  try {
    const allEvents = await Event.find({});
    
    const formatted = allEvents.map((ev) => ({
      id: ev._id.toString(),
      name: ev.name,
      description: ev.description,
      presenter: ev.presenter,
      time: ev.time,
      locId: ev.locId
    }));
    return res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 添加新活动
router.post("/", async (req, res) => {
  try {
    // 验证必填字段
    const { name, time, locId } = req.body;
    if (!name || !time || !locId) {
      return res.status(400).json({ 
        error: "Missing required fields: name, time, and locId are required" 
      });
    }

    const event = new Event({
      name: req.body.name,
      description: req.body.description || "",
      presenter: req.body.presenter || "",
      time: req.body.time,
      locId: req.body.locId
    });
    
    const savedEvent = await event.save();
    
    res.status(201).json({
      id: savedEvent._id.toString(),
      name: savedEvent.name,
      description: savedEvent.description,
      presenter: savedEvent.presenter,
      time: savedEvent.time,
      locId: savedEvent.locId
    });
  } catch (err) {
    console.error("Error adding event:", err);
    
    // 处理验证错误
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// 更新活动
router.put("/:id", async (req, res) => {
  try {
    const { name, time, locId } = req.body;
    if (!name || !time || !locId) {
      return res.status(400).json({ 
        error: "Missing required fields: name, time, and locId are required" 
      });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id, 
      {
        name: req.body.name,
        description: req.body.description || "",
        presenter: req.body.presenter || "",
        time: req.body.time,
        locId: req.body.locId
      }, 
      {
        new: true, // 返回更新后的文档
        runValidators: true // 运行模式验证
      }
    );
    
    if (!event) return res.status(404).json({ error: "Event not found" });
    
    res.json({
      id: event._id.toString(),
      name: event.name,
      description: event.description,
      presenter: event.presenter,
      time: event.time,
      locId: event.locId
    });
  } catch (err) {
    console.error("Error updating event:", err);
    
    // 处理验证错误
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// 删除活动
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Event not found" });
    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("Error deleting event:", err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;