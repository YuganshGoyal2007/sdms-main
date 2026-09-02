import dotenv from "dotenv";
import sequelize, { connectDB } from './lib/db.js';
import Coordinator from "./models/coordinator.model.js";
import User from "./models/user.model.js";
import bcrypt from "bcryptjs";

dotenv.config();

const admins = [
    {
        name: "Arun Solanki",
        email: "hod.cs@gbu.ac.in",
        phone: "9650906633",
        role: "admin"
    }
];

const seedDatabase = async () => {
    try {
        await connectDB();
        console.log("MySQL connected");

        // Create admin user
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const adminUser = await User.create({
            name: admins[0].name,
            username: admins[0].email.toLowerCase(),
            password: hashedPassword,
            role: "admin"
        });

        // Create coordinator/admin record linked to the same user
        await Coordinator.create({
            userId: adminUser.id,
            coordinatorId: "ADMIN001",
            role: "admin",
            name: admins[0].name,
            email: admins[0].email.toLowerCase(),
            phone: admins[0].phone,
            createdBy: adminUser.id
        });

        console.log("Admins seeded");
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedDatabase();