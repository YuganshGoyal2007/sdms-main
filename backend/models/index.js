import sequelize from '../lib/db.js';
import User from './user.model.js';
import Student from './student.model.js';
import Coordinator from './coordinator.model.js';
import { Specialization } from './specialization.model.js';
import ChangeLog from './changeLog.model.js';
import Notification from './notification.model.js';
import Chairperson from './chairperson.model.js';
import ChairpersonClass from './chairpersonClass.model.js';
import Message from './message.model.js';
import Subject from './subject.model.js';
import FacultyAssignment from './facultyAssignment.model.js';
import AttendanceSession from './attendanceSession.model.js';
import AttendanceRecord from './attendanceRecord.model.js';

// Set up associations here if needed
// Already defined in individual models

import Faculty from './faculty.model.js';

export {
  User,
  Student,
  Coordinator,
  Faculty,
  Specialization,
  ChangeLog,
  Notification,
  Chairperson,
  ChairpersonClass,
  Message,
  Subject,
  FacultyAssignment,
  AttendanceSession,
  AttendanceRecord,
};
export default sequelize;
