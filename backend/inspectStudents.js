const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: 'A@eofyug2007', database: 'gbu_sdms' });
    const [rows] = await conn.query('SHOW INDEX FROM Students');
    console.log(JSON.stringify(rows, null, 2));
    const [create] = await conn.query('SHOW CREATE TABLE Students');
    console.log(create[0]['Create Table']);
    await conn.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
