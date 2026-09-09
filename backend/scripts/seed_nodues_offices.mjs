import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function main() {
  const conn = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "A@eofyug2007",
    database: "gbu_sdms"
  });

  console.log("Connected to MySQL.");

  // 1. Backfill ICT stage for existing applications that lack it
  const [apps] = await conn.query("SELECT id, rollNo, status FROM no_dues_applications");
  console.log(`Found ${apps.length} applications in database.`);

  let backfilledCount = 0;
  for (const app of apps) {
    const [existingIct] = await conn.query(
      "SELECT id FROM no_dues_stages WHERE applicationId = ? AND stageCode = 'ICT'",
      [app.id]
    );

    if (existingIct.length === 0) {
      await conn.query(
        `INSERT INTO no_dues_stages 
        (applicationId, stageCode, stageName, verifierRole, status, duesAmount, sequenceOrder, createdAt, updatedAt)
        VALUES (?, 'ICT', 'Information & Communication Technology (ICT) Office', 'staff', 'pending', 0.00, 4, NOW(), NOW())`,
        [app.id]
      );
      backfilledCount++;
    }
  }
  console.log(`Backfilled ICT stage for ${backfilledCount} applications.`);

  // 2. Create / ensure test officer personas in users table (role 'coordinator' or 'admin' so they can access staff queues)
  const officers = [
    { username: "library@gbu.ac.in", name: "Central Library Officer" },
    { username: "hostel@gbu.ac.in", name: "Hostel Warden Office" },
    { username: "sports@gbu.ac.in", name: "Sports Council Officer" },
    { username: "dean.soict@gbu.ac.in", name: "Dean SOICT Office" },
    { username: "ict@gbu.ac.in", name: "ICT Networks Officer" },
  ];

  const hashedPwd = await bcrypt.hash("TestPass@123", 10);

  for (const off of officers) {
    const [existing] = await conn.query("SELECT id FROM users WHERE username = ?", [off.username]);
    if (existing.length === 0) {
      await conn.query(
        "INSERT INTO users (name, username, password, role, createdAt, updatedAt) VALUES (?, ?, ?, 'admin', NOW(), NOW())",
        [off.name, off.username, hashedPwd]
      );
      console.log(`Created officer account: ${off.username}`);
    } else {
      await conn.query("UPDATE users SET password = ? WHERE id = ?", [hashedPwd, existing[0].id]);
      console.log(`Updated password for existing officer account: ${off.username}`);
    }
  }

  // 3. Verify counts
  const [stagesSummary] = await conn.query("SELECT stageCode, COUNT(*) as cnt FROM no_dues_stages GROUP BY stageCode");
  console.log("Stage distribution:", stagesSummary);

  await conn.end();
  console.log("Seeding and backfill complete!");
}

main().catch(console.error);
