import mysql from "mysql2/promise";
(async () => {
  const conn = await mysql.createConnection({ host: "localhost", port: 3306, user: "root", password: "A@eofyug2007", database: "gbu_sdms" });
  try {
    const [rows] = await conn.query("SHOW INDEX FROM students");
    const keep = {};
    const drop = [];
    for (const row of rows) {
      const col = row.Column_name;
      if (col !== "rollNo" && col !== "enrollmentNo") continue;
      if (!keep[col]) {
        keep[col] = row.Key_name;
      } else if (row.Key_name !== keep[col]) {
        drop.push(row.Key_name);
      }
    }
    const uniqueDrop = [...new Set(drop)];
    console.log("Indexes to drop:", uniqueDrop);
    for (const name of uniqueDrop) {
      console.log(`Dropping index: ${name}`);
      await conn.query(`ALTER TABLE students DROP INDEX \`${name}\``);
    }
    console.log("Done dropping duplicate rollNo/enrollmentNo indexes.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();
