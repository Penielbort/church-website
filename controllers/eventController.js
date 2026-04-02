const { db } = require('../config/database');

exports.getAll  = (req, res) => res.json(db.events.all());

exports.create  = (req, res) => {
  const { title, description, date, time, location, type } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
  const imagePath = req.file ? `/uploads/events/${req.file.filename}` : null;
  const id = db.events.insert({ title, description, date, time, location, type: type || 'general', image_path: imagePath });
  res.json({ success: true, id });
};

exports.update  = (req, res) => {
  const { title, description, date, time, location, type } = req.body;
  db.events.update(req.params.id, { title, description, date, time, location, type });
  res.json({ success: true });
};

exports.delete  = (req, res) => { db.events.delete(req.params.id); res.json({ success: true }); };
