# St. Peter Anglican Church — Parish Website

A full-stack church website for St. Peter Anglican Church, Nungua, Accra, Ghana.

---

## Features

- Public website with home, about, worship, sermons, events, gallery, media feed, and Book of Common Prayer pages
- Social media-style media feed with likes and comments (posts expire after 7 days)
- Member registration with passport photo upload and automatic PDF generation
- Admin panel at `/admin` (JWT-protected)
- Full admin management: posts, sermons, events, gallery, members, contact submissions, settings
- SQLite database (zero configuration)
- Automatic cleanup of expired media posts (runs hourly)

---

## Installation

### Prerequisites
- Node.js v16 or higher
- npm

### Steps

```bash
# 1. Enter the project folder
cd church-website

# 2. Install dependencies
npm install

# 3. Start the server
node server.js
```

The server will start on **http://localhost:3000**

---

## Default Admin Login

| Username | Password  |
|----------|-----------|
| admin    | admin123  |

> **Important:** Change the default password immediately after first login via the Admin Users panel.

---

## URLs

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Main church website |
| http://localhost:3000/login | Admin login page |
| http://localhost:3000/admin | Admin panel (requires login) |

---

## Project Structure

```
church-website/
├── server.js                 # Main entry point
├── package.json
├── config/
│   └── database.js           # SQLite setup & schema
├── controllers/
│   ├── authController.js
│   ├── adminController.js
│   ├── memberController.js
│   ├── mediaController.js
│   └── eventController.js
├── routes/
│   ├── authRoutes.js
│   ├── adminRoutes.js
│   └── publicRoutes.js
├── middleware/
│   ├── authMiddleware.js      # JWT verification
│   └── uploadMiddleware.js    # Multer file uploads
├── services/
│   └── pdfService.js         # PDFKit membership form generator
├── uploads/
│   ├── members/              # Member passport photos
│   ├── gallery/              # Gallery & post images
│   ├── events/               # Event images
│   └── pdfs/                 # Generated membership PDFs
├── public/
│   ├── index.html            # Main church website
│   ├── admin.html            # Admin panel
│   ├── login.html            # Admin login
│   ├── css/style.css
│   ├── js/main.js
│   └── images/               # Static images (logo, building photos)
└── database/
    └── church.db             # SQLite database (auto-created)
```

---

## Environment Variables (optional)

Create a `.env` file to override defaults:

```
PORT=3000
JWT_SECRET=your_secret_key_here
```

---

## Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT + bcrypt
- **File Uploads:** Multer
- **PDF Generation:** PDFKit
- **Frontend:** Vanilla HTML/CSS/JavaScript

---

© 2025 St. Peter Anglican Church, Nungua · Diocese of Accra · Province of West Africa
