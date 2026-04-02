const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generateMemberPDF(member) {
  return new Promise((resolve, reject) => {
    const dir = path.join(__dirname, '../uploads/pdfs');
    fs.mkdirSync(dir, { recursive: true });
    const filename = `member-${member.id}-${Date.now()}.pdf`;
    const filepath = path.join(dir, filename);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header bar
    doc.rect(0, 0, 595, 90).fill('#4B0082');
    doc.fontSize(22).fillColor('#C9A227').font('Helvetica-Bold')
      .text('ST. PETER ANGLICAN CHURCH', 50, 22, { align: 'center' });
    doc.fontSize(11).fillColor('#ffffff').font('Helvetica')
      .text('Nungua · Accra · Ghana · Diocese of Accra · Est. 1940', 50, 50, { align: 'center' });
    doc.fontSize(13).fillColor('#C9A227').font('Helvetica-Bold')
      .text('PARISH MEMBERSHIP REGISTRATION FORM', 50, 68, { align: 'center' });

    // Member ID badge
    doc.rect(50, 106, 495, 30).fill('#F5E8C0');
    doc.fontSize(11).fillColor('#4B0082').font('Helvetica-Bold')
      .text(`MEMBER ID: SPM-${String(member.id).padStart(5, '0')}`, 50, 114, { align: 'center' });

    let y = 150;

    // Photo placeholder or actual photo
    if (member.photo_path && fs.existsSync(path.join(__dirname, "..", member.photo_path))) {
      try {
        doc.image(path.join(__dirname, "..", member.photo_path), 430, y, { width: 100, height: 120 });
        doc.rect(430, y, 100, 120).stroke('#4B0082');
      } catch (e) { /* skip */ }
    } else {
      doc.rect(430, y, 100, 120).stroke('#4B0082');
      doc.fontSize(9).fillColor('#888').text('PASSPORT', 450, y + 50).text('PHOTO', 458, y + 63);
    }

    function section(title) {
      y += 10;
      doc.rect(50, y, 360, 22).fill('#4B0082');
      doc.fontSize(10).fillColor('#C9A227').font('Helvetica-Bold').text(title, 56, y + 6);
      y += 28;
    }

    function field(label, value, half = false) {
      const w = half ? 170 : 360;
      doc.fontSize(8).fillColor('#888').font('Helvetica').text(label.toUpperCase(), 50, y);
      y += 12;
      doc.rect(50, y, w, 18).stroke('#cccccc');
      doc.fontSize(10).fillColor('#222').font('Helvetica')
        .text(value || '—', 54, y + 4, { width: w - 8 });
      y += 22;
    }

    function fieldPair(l1, v1, l2, v2) {
      doc.fontSize(8).fillColor('#888').font('Helvetica').text(l1.toUpperCase(), 50, y);
      doc.fontSize(8).fillColor('#888').font('Helvetica').text(l2.toUpperCase(), 235, y);
      y += 12;
      doc.rect(50, y, 175, 18).stroke('#cccccc');
      doc.rect(235, y, 175, 18).stroke('#cccccc');
      doc.fontSize(10).fillColor('#222').font('Helvetica').text(v1 || '—', 54, y + 4, { width: 167 });
      doc.fontSize(10).fillColor('#222').font('Helvetica').text(v2 || '—', 239, y + 4, { width: 167 });
      y += 22;
    }

    section('PERSONAL INFORMATION');
    field('Full Name', member.full_name);
    fieldPair('Date of Birth', member.date_of_birth, 'Gender', member.gender);
    fieldPair('Marital Status', member.marital_status, 'Nationality', member.nationality);
    fieldPair('Hometown', member.hometown, 'Occupation', member.occupation);

    section('CONTACT DETAILS');
    fieldPair('Phone Number', member.phone, 'Email Address', member.email);
    field('Home Address', member.address);
    fieldPair('Emergency Contact', member.emergency_contact, 'Emergency Phone', member.emergency_phone);

    section('ANGLICAN HISTORY');
    fieldPair('Baptized', member.baptized, 'Baptism Date', member.baptism_date);
    field('Church of Baptism', member.baptism_church);
    fieldPair('Confirmed', member.confirmed, 'Date of Confirmation', member.confirmation_date);
    fieldPair('Confirmed By (Bishop)', member.confirmed_by, 'Previous Parish', member.prev_parish);

    // Guild interests
    section('GUILD / MINISTRY INTERESTS');
    let guilds = [];
    try { guilds = JSON.parse(member.guilds || '[]'); } catch { guilds = []; }
    doc.fontSize(10).fillColor('#333').font('Helvetica')
      .text(guilds.length ? guilds.join(', ') : 'None specified', 50, y, { width: 360 });
    y += 30;

    // Signature area
    doc.rect(50, y, 360, 50).stroke('#cccccc');
    doc.fontSize(8).fillColor('#888').text('MEMBER SIGNATURE / DATE', 56, y + 6);
    y += 60;

    // Footer
    doc.rect(0, 770, 595, 72).fill('#4B0082');
    doc.fontSize(9).fillColor('#C9A227').font('Helvetica-Bold')
      .text('St. Peter Anglican Church · Nungua, Accra, Ghana', 50, 780, { align: 'center' });
    doc.fontSize(8).fillColor('rgba(255,255,255,0.6)').font('Helvetica')
      .text(`Registered: ${new Date(member.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}  ·  Diocese of Accra  ·  Church of the Province of West Africa`, 50, 796, { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve({ filepath, filename, url: `/uploads/pdfs/${filename}` }));
    stream.on('error', reject);
  });
}

module.exports = { generateMemberPDF };
