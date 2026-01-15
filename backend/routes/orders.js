await db.query(
  `INSERT INTO orders (user_id, total_amount, address, status)
   VALUES (?, ?, ?, 'placed')`,
  [userId, total, address]
);
