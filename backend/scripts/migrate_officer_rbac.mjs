import sequelize from "../lib/db.js";

async function main() {
  console.log("Starting RBAC Migration for Departmental Officers...");

  try {
    await sequelize.query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('admin','student','coordinator','chairperson','faculty','officer') NOT NULL DEFAULT 'student'"
    );
    console.log("Successfully updated role ENUM to include 'officer'.");
  } catch (err) {
    console.log("Role ENUM update status:", err.message);
  }

  try {
    await sequelize.query("ALTER TABLE users ADD COLUMN officeCode VARCHAR(50) NULL AFTER role");
    console.log("Successfully added officeCode column.");
  } catch (err) {
    console.log("Add officeCode column status:", err.message);
  }

  const officers = [
    { username: "library@gbu.ac.in", name: "Central Library Officer", officeCode: "LIB" },
    { username: "hostel@gbu.ac.in", name: "Hostel Administration Officer", officeCode: "HST" },
    { username: "sports@gbu.ac.in", name: "Sports Council Officer", officeCode: "SPT" },
    { username: "dean.soict@gbu.ac.in", name: "Dean SOICT Office", officeCode: "DEAN" },
    { username: "ict@gbu.ac.in", name: "ICT Infrastructure Officer", officeCode: "ICT" },
  ];

  for (const off of officers) {
    await sequelize.query(
      "UPDATE users SET role = 'officer', officeCode = ?, name = ? WHERE username = ?",
      { replacements: [off.officeCode, off.name, off.username] }
    );
    console.log(`Assigned role 'officer' and officeCode '${off.officeCode}' to ${off.username}`);
  }

  // Ensure HOD is superadmin
  await sequelize.query(
    "UPDATE users SET role = 'admin', officeCode = NULL WHERE username = 'hod.cs@gbu.ac.in'"
  );
  console.log("Confirmed hod.cs@gbu.ac.in as master admin with full access.");

  const [activeUsers] = await sequelize.query(
    "SELECT id, username, name, role, officeCode FROM users WHERE role IN ('admin', 'officer')"
  );
  console.log("\nVerified Administrative & Departmental Users:");
  console.table(activeUsers);

  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
