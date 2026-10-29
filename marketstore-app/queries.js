const PRODUCT_LIST_BASE = `
  SELECT p.id, p.name, p.description, p.price, p.image_url,
         c.name AS category, c.slug AS category_slug,
         CAST(COALESCE(SUM(v.stock), 0) AS UNSIGNED) AS total_stock
  FROM products p
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN product_variants v ON v.product_id = p.id
  WHERE p.is_active = 1`;

const PRODUCT_LIST_END = `
  GROUP BY p.id, c.name, c.slug
  ORDER BY p.id DESC`;

module.exports = {
  users: {
    findIdByEmail: 'SELECT id FROM users WHERE email = ?',
    create: 'INSERT INTO users (full_name, email, password, phone) VALUES (?, ?, ?, ?)',
    findForLogin:
      'SELECT id, full_name, email, password, role, is_active FROM users WHERE email = ?',
    touchLastLogin: 'UPDATE users SET last_login_at = NOW() WHERE id = ?',
  },

  categories: {
    list: 'SELECT id, name, slug FROM categories ORDER BY name',
  },

  products: {
    list: `${PRODUCT_LIST_BASE} ${PRODUCT_LIST_END}`,
    listByCategory: `${PRODUCT_LIST_BASE} AND c.slug = ? ${PRODUCT_LIST_END}`,
    findById: `
      SELECT p.id, p.name, p.description, p.price, p.image_url,
             c.name AS category, c.slug AS category_slug
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.id = ? AND p.is_active = 1`,
    variantsByProductId: `
      SELECT id, size, stock
      FROM product_variants
      WHERE product_id = ?
      ORDER BY CAST(size AS UNSIGNED)`,
  },

  cart: {
    listByUser: `
      SELECT ci.id, ci.quantity,
             v.id AS variant_id, v.size, v.stock,
             p.id AS product_id, p.name, p.price, p.image_url
      FROM cart_items ci
      JOIN product_variants v ON v.id = ci.variant_id
      JOIN products p ON p.id = v.product_id
      WHERE ci.user_id = ? AND p.is_active = 1
      ORDER BY ci.id DESC`,
    findVariant: `
      SELECT v.id, v.stock
      FROM product_variants v
      JOIN products p ON p.id = v.product_id
      WHERE v.id = ? AND p.is_active = 1`,
    findQty: 'SELECT quantity FROM cart_items WHERE user_id = ? AND variant_id = ?',
    upsert: `
      INSERT INTO cart_items (user_id, variant_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
    findStockByItem: `
      SELECT v.stock
      FROM cart_items ci
      JOIN product_variants v ON v.id = ci.variant_id
      WHERE ci.id = ? AND ci.user_id = ?`,
    updateQty: 'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
    remove: 'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
  },

  addresses: {
    listByUser: `
      SELECT id, recipient, street, city, province, postal_code, country, is_default
      FROM addresses
      WHERE user_id = ?
      ORDER BY is_default DESC, id DESC`,
    countByUser: 'SELECT COUNT(*) AS total FROM addresses WHERE user_id = ?',
    create: `
      INSERT INTO addresses
        (user_id, recipient, street, city, province, postal_code, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    clearDefault: 'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
    setDefault: 'UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?',
    remove: 'DELETE FROM addresses WHERE id = ? AND user_id = ?',
  },
};