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

// Set up associations here if needed
// Already defined in individual models

export { User, Student, Coordinator, Specialization, ChangeLog, Notification, Chairperson, ChairpersonClass, Message };
export default sequelize;
