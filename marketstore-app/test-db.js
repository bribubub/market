const pool = require('./db');

async function testKoneksi() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM users');
    console.log('Koneksi database BERHASIL');
    console.log('Jumlah user saat ini:', rows[0].total);
  } catch (err) {
    console.error('Koneksi database GAGAL');
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

testKoneksi();