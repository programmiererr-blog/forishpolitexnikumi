// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express(); 
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = 'admin123'; // admin token

let currentStatus = {
  status: false,
  subject: '',
  startTime: null,
  endTime: null
};

// 📌 Middlewarelar
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔐 Admin login qilish
app.post('/api/admin-login', (req, res) => {
  const { login, password } = req.body;
  const adminPath = path.join(__dirname, 'admins.json');

  fs.readFile(adminPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Serverda xatolik' });

    let admins;
    try {
      admins = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ message: 'Admin fayl xato' });
    }

    const found = admins.find(a => a.login === login && a.password === password);

    if (!found) return res.status(401).json({ message: 'Login yoki parol xato' });

    res.json({ success: true, role: found.role, login: found.login });
  });
});

// 🔧 Superadmin yordamchi admin qo‘shadi
app.post('/api/add-helper-admin', (req, res) => {
  const { superToken, newAdmin } = req.body;

  if (superToken !== 'super123') {
    return res.status(403).json({ message: 'Faqat superadmin kirishi mumkin' });
  }

  const adminPath = path.join(__dirname, 'admins.json');

  fs.readFile(adminPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Fayl o‘qilmadi' });

    let admins = JSON.parse(data);

    if (admins.some(a => a.login === newAdmin.login)) {
      return res.status(400).json({ message: 'Bu login avval mavjud' });
    }

    admins.push({ ...newAdmin, role: 'helper' });

    fs.writeFile(adminPath, JSON.stringify(admins, null, 2), err => {
      if (err) return res.status(500).json({ message: 'Saqlab bo‘lmadi' });
      res.json({ message: 'Yangi yordamchi admin qo‘shildi' });
    });
  });
});

// 🗑 Superadmin yordamchi adminni o‘chiradi
app.post('/api/delete-helper-admin', (req, res) => {
  const { superToken, login } = req.body;

  if (superToken !== 'super123') {
    return res.status(403).json({ message: 'Faqat superadmin kirishi mumkin' });
  }

  const adminPath = path.join(__dirname, 'admins.json');

  fs.readFile(adminPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Fayl o‘qilmadi' });

    let admins = JSON.parse(data);

    const newAdmins = admins.filter(a => !(a.login === login && a.role === 'helper'));

    if (newAdmins.length === admins.length) {
      return res.status(404).json({ message: 'Bunday yordamchi admin topilmadi' });
    }

    fs.writeFile(adminPath, JSON.stringify(newAdmins, null, 2), err => {
      if (err) return res.status(500).json({ message: 'O‘chirib bo‘lmadi' });
      res.json({ message: 'Yordamchi admin o‘chirildi' });
    });
  });
});

// 🔐 Admin tomonidan test holatini sozlash
app.post('/api/set-status', (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(403).json({ message: 'Ruxsat berilmagan' });
  }

  const { status, subject, startTime, endTime } = req.body;

  if (!startTime || !endTime || !subject) {
    return res.status(400).json({ message: 'Maʼlumotlar to‘liq emas' });
  }

  currentStatus = {
    status,
    subject,
    startTime: new Date(startTime),
    endTime: new Date(endTime)
  };

  console.log('✅ Test holati yangilandi:', currentStatus);
  res.json({ message: 'Test holati muvaffaqiyatli saqlandi' });
});

// 📅 Talabaga test holatini tekshirish
app.get('/api/check-status', (req, res) => {
  const now = new Date();

  if (!currentStatus.status) {
    return res.json({ allowed: false, reason: 'Test hali ochilmagan' });
  }

  if (now < currentStatus.startTime) {
    return res.json({ allowed: false, reason: 'Test boshlanish vaqti hali yetmagan' });
  }

  if (now > currentStatus.endTime) {
    return res.json({ allowed: false, reason: 'Test vaqti tugagan' });
  }

  res.json({ allowed: true, subject: currentStatus.subject });
});

// 🧑‍🎓 Talabaning login parolini json fayldan tekshirish
app.post('/api/student-login', (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ success: false, message: 'Login va parol talab qilinadi' });
  }

  const studentFilePath = path.join(__dirname, '/', 'students.json');

  fs.readFile(studentFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Talabalar bazasini o‘qishda xatolik:', err);
      return res.status(500).json({ success: false, message: 'Serverda xatolik yuz berdi' });
    }

    let students;
    try {
      students = JSON.parse(data);
    } catch (parseErr) {
      console.error('❌ JSON parsing xatosi:', parseErr);
      return res.status(500).json({ success: false, message: 'Bazani o‘qishda xatolik' });
    }

    const student = students.find(
      s => s.login === login && s.password === password
    );

    if (student) {
      res.json({ success: true, student });
    } else {
      res.status(401).json({ success: false, message: 'Login yoki parol noto‘g‘ri' });
    }
  });
});

// 📄 Asosiy sahifa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 🚀 Serverni ishga tushirish
app.listen(PORT, () => {
  console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
});
