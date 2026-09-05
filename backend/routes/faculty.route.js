import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  getFaculties,
  addFaculty,
  deleteFaculty,
  getFacultyProfile,
} from "../controllers/faculty.controller.js";

const router = express.Router();

// Admin endpoints
router.get("/faculty", isAuthenticated, allowRoles("admin"), getFaculties);
router.get("/get-faculties", isAuthenticated, allowRoles("admin"), getFaculties);
router.post("/faculty/add-faculty", isAuthenticated, allowRoles("admin"), addFaculty);
router.post("/add-faculty", isAuthenticated, allowRoles("admin"), addFaculty);
router.delete("/faculty/:id", isAuthenticated, allowRoles("admin"), deleteFaculty);
router.delete("/delete-faculty/:id", isAuthenticated, allowRoles("admin"), deleteFaculty);

// Faculty portal endpoint
router.get("/me", isAuthenticated, allowRoles("faculty", "admin"), getFacultyProfile);

export default router;
