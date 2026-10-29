require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const q = require('./queries');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET belum diisi di .env');
  process.exit(1);
}

const app = express();
app.use(express.json());

// ===== HELPER =====
const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
};

const isText = (v) => typeof v === 'string' && v.trim() !== '';

// Middleware: lolos hanya kalau request membawa token yang sah
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Sesi tidak valid, silakan login ulang' });
  }
}

// ===== REGISTER =====
app.post('/api/register', async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!isText(full_name) || !isText(email) || !isText(password)) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    const [existing] = await pool.execute(q.users.findIdByEmail, [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(q.users.create, [
      full_name,
      email,
      hashedPassword,
      isText(phone) ? phone : null,
    ]);

    res.status(201).json({ message: 'Register berhasil' });
  } catch (err) {
    serverError(res, err);
  }
});

// ===== LOGIN =====
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isText(email) || !isText(password)) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    const [rows] = await pool.execute(q.users.findForLogin, [email]);

    // Pesan sengaja sama agar tidak membocorkan email mana yang terdaftar
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: 'Akun tidak aktif' });
    }

    const cocok = await bcrypt.compare(password, user.password);
    if (!cocok) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    await pool.execute(q.users.touchLastLogin, [user.id]);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    serverError(res, err);
  }
});

// ===== DAFTAR KATEGORI =====
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.execute(q.categories.list);
    res.json(rows);
  } catch (err) {
    serverError(res, err);
  }
});

// ===== DAFTAR PRODUK (opsional filter ?category=slug) =====
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;

    if (category !== undefined && !isText(category)) {
      return res.status(400).json({ message: 'Kategori tidak valid' });
    }

    const [rows] = category
      ? await pool.execute(q.products.listByCategory, [category])
      : await pool.execute(q.products.list);

    res.json(rows);
  } catch (err) {
    serverError(res, err);
  }
});

// ===== DETAIL PRODUK + UKURAN & STOK =====
app.get('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }

    const [products] = await pool.execute(q.products.findById, [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const [variants] = await pool.execute(q.products.variantsByProductId, [id]);

    res.json({ ...products[0], variants });
  } catch (err) {
    serverError(res, err);
  }
});

// ===== KERANJANG (wajib login) =====

app.get('/api/cart', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(q.cart.listByUser, [req.user.id]);

    const items = rows.map((r) => ({ ...r, subtotal: r.price * r.quantity }));
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    res.json({ items, total });
  } catch (err) {
    serverError(res, err);
  }
});

app.post('/api/cart', authRequired, async (req, res) => {
  try {
    const variantId = Number(req.body.variant_id);
    const qty = req.body.quantity === undefined ? 1 : Number(req.body.quantity);

    if (!Number.isInteger(variantId) || variantId <= 0 || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Data tidak valid' });
    }

    const [variants] = await pool.execute(q.cart.findVariant, [variantId]);
    if (variants.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const [existing] = await pool.execute(q.cart.findQty, [req.user.id, variantId]);
    const newQty = (existing.length > 0 ? existing[0].quantity : 0) + qty;

    if (newQty > variants[0].stock) {
      return res.status(400).json({ message: `Stok tidak cukup (tersedia ${variants[0].stock})` });
    }

    await pool.execute(q.cart.upsert, [req.user.id, variantId, newQty]);

    res.status(201).json({ message: 'Ditambahkan ke keranjang' });
  } catch (err) {
    serverError(res, err);
  }
});

app.patch('/api/cart/:id', authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const qty = Number(req.body.quantity);

    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Data tidak valid' });
    }

    const [rows] = await pool.execute(q.cart.findStockByItem, [id, req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }
    if (qty > rows[0].stock) {
      return res.status(400).json({ message: `Stok tidak cukup (tersedia ${rows[0].stock})` });
    }

    await pool.execute(q.cart.updateQty, [qty, id, req.user.id]);

    res.json({ message: 'Jumlah diperbarui' });
  } catch (err) {
    serverError(res, err);
  }
});

app.delete('/api/cart/:id', authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID tidak valid' });
    }

    const [result] = await pool.execute(q.cart.remove, [id, req.user.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    res.json({ message: 'Item dihapus' });
  } catch (err) {
    serverError(res, err);
  }
});

// ===== ALAMAT (wajib login) =====

app.get('/api/addresses', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(q.addresses.listByUser, [req.user.id]);
    res.json(rows);
  } catch (err) {
    serverError(res, err);
  }
});

app.post('/api/addresses', authRequired, async (req, res) => {
  const { recipient, street, city, province, postal_code, country, is_default } = req.body;

  if (![recipient, street, city, province, postal_code].every(isText)) {
    return res.status(400).json({
      message: 'Penerima, jalan, kota, provinsi, dan kode pos wajib diisi',
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Alamat pertama otomatis jadi alamat utama
    const [cnt] = await conn.execute(q.addresses.countByUser, [req.user.id]);
    const makeDefault = Number(cnt[0].total) === 0 || is_default === true;

    if (makeDefault) {
      await conn.execute(q.addresses.clearDefault, [req.user.id]);
    }

    await conn.execute(q.addresses.create, [
      req.user.id,
      recipient,
      street,
      city,
      province,
      postal_code,
      isText(country) ? country : 'Indonesia',
      makeDefault ? 1 : 0,
    ]);

    await conn.commit();
    res.status(201).json({ message: 'Alamat ditambahkan' });
  } catch (err) {
    if (conn) await conn.rollback();
    serverError(res, err);
  } finally {
    if (conn) conn.release();
  }
});

app.patch('/api/addresses/:id/default', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'ID tidak valid' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.execute(q.addresses.clearDefault, [req.user.id]);
    const [result] = await conn.execute(q.addresses.setDefault, [id, req.user.id]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }

    await conn.commit();
    res.json({ message: 'Alamat utama diperbarui' });
  } catch (err) {
    if (conn) await conn.rollback();
    serverError(res, err);
  } finally {
    if (conn) conn.release();
  }
});

app.delete('/api/addresses/:id', authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID tidak valid' });
    }

    const [result] = await pool.execute(q.addresses.remove, [id, req.user.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }

    res.json({ message: 'Alamat dihapus' });
  } catch (err) {
    serverError(res, err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});