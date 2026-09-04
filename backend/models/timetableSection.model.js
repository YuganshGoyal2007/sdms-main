import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';

/**
 * TimetableSection — maps our 5-tuple class key to the mygbu.in section id
 * that the public portal uses (e.g. 1282 = B.Tech CSE BCS-III-A).
 *
 * Admins set these mappings once. The scraper then pulls `?name=SOICT&dept=CSE&section=1282`
 * to get the live data and caches it in `Timetables` table.
 */
const TimetableSection = sequelize.define('TimetableSection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  school: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  program: { type: DataTypes.STRING, allowNull: false },
  batch: { type: DataTypes.STRING, allowNull: false },
  specialization: { type: DataTypes.STRING, allowNull: false },
  mygbuSchool: { type: DataTypes.STRING, allowNull: false, defaultValue: 'SOICT', comment: 'e.g. SOICT, SOBT, SOE' },
  mygbuDepartment: { type: DataTypes.STRING, allowNull: false, defaultValue: 'CSE' },
  mygbuSectionId: { type: DataTypes.STRING, allowNull: false, comment: 'e.g. 1282' },
  label: { type: DataTypes.STRING, allowNull: true, comment: 'e.g. B.Tech CSE BCS-III-A' },
  academicYear: { type: DataTypes.STRING, allowNull: true, comment: 'e.g. 2026-27' },
  semester: { type: DataTypes.STRING, allowNull: true, comment: 'e.g. Odd/Even, Sem 7' },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['school', 'department', 'program', 'batch', 'specialization', 'academicYear', 'semester'] },
  ],
});

export default TimetableSection;
