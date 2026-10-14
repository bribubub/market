require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('./db');

const app = express();
app.use(express.json());

// ===== REGISTER =====
app.post('/api/register', async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    // 1. Validasi input
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    // 2. Cek email sudah terdaftar atau belum
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    // 3. Hash password lalu simpan ke database
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (full_name, email, password, phone) VALUES (?, ?, ?, ?)',
      [full_name, email, hashedPassword, phone || null]
    );

    res.status(201).json({ message: 'Register berhasil' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

const PORT = process.env.PORT || 3000;
// ===== LOGIN =====
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validasi input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    // 2. Cari user berdasarkan email
    const [rows] = await pool.query(
      'SELECT id, full_name, email, password, role, is_active FROM users WHERE email = ?',
      [email]
    );

    // Pesan sengaja dibuat sama agar tidak membocorkan email mana yang terdaftar
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const user = rows[0];

    // 3. Cek akun aktif
    if (!user.is_active) {
      return res.status(403).json({ message: 'Akun tidak aktif' });
    }

    // 4. Cocokkan password dengan hash di database
    const cocok = await bcrypt.compare(password, user.password);
    if (!cocok) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // 5. Catat waktu login terakhir
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    // 6. Kirim data user (tanpa password)
    res.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});