const { db } = require('../config/database');
const { generateMemberPDF } = require('../services/pdfService');

exports.register = async (req, res) => {
  try {
    const d = req.body;
    const photoPath = req.file ? `/uploads/members/${req.file.filename}` : null;
    let guilds = d.guilds ? (Array.isArray(d.guilds) ? d.guilds : [d.guilds]) : [];
    const id = db.members.insert({
      full_name: d.full_name, date_of_birth: d.date_of_birth, gender: d.gender,
      address: d.address, phone: d.phone, email: d.email,
      baptized: d.baptized, baptism_date: d.baptism_date, baptism_church: d.baptism_church,
      confirmed: d.confirmed, confirmed_by: d.confirmed_by, confirmation_date: d.confirmation_date,
      prev_parish: d.prev_parish, occupation: d.occupation, marital_status: d.marital_status,
      nationality: d.nationality, hometown: d.hometown,
      emergency_contact: d.emergency_contact, emergency_phone: d.emergency_phone,
      guilds: JSON.stringify(guilds), photo_path: photoPath
    });
    const member = db.members.findById(id);
    const pdf = await generateMemberPDF(member);
    db.members.updatePdf(id, pdf.url);
    res.json({ success: true, member_id: id, pdfUrl: pdf.url });
  } catch (err) {
    console.error('[Register]', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

exports.getAll  = (req, res) => res.json(db.members.all());
exports.getOne  = (req, res) => {
  const m = db.members.findById(req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  res.json(m);
};
exports.delete  = (req, res) => { db.members.delete(req.params.id); res.json({ success: true }); };
