import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';

/**
 * TimetableSnapshot — point-in-time snapshot of class-wise timetable and
 * faculty assignments at semester boundaries (start and end).
 * Preserves historical schedule compliance as electives and allocations evolve.
 */
const TimetableSnapshot = sequelize.define('TimetableSnapshot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  academicYear: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '2025-2026',
  },
  semesterTerm: {
    type: DataTypes.ENUM('odd', 'even'),
    allowNull: false,
    defaultValue: 'odd',
  },
  snapshotType: {
    type: DataTypes.ENUM('term_start', 'term_end', 'manual'),
    allowNull: false,
    defaultValue: 'manual',
  },
  school: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  program: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  batch: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
  specialization: {
    type: DataTypes.STRING(120),
    allowNull: false,
    defaultValue: 'None',
  },
  timetableData: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Snapshot of entries matrix (days, slots, subjects, rooms, faculty)',
    get() {
      const rawValue = this.getDataValue('timetableData');
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return {};
        }
      }
      return rawValue || {};
    },
    set(val) {
      this.setDataValue('timetableData', typeof val === 'object' && val !== null ? val : {});
    },
  },
  facultyAssignments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Subject-faculty allocations active when snapshot was captured',
    get() {
      const rawValue = this.getDataValue('facultyAssignments');
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return [];
        }
      }
      return Array.isArray(rawValue) ? rawValue : [];
    },
    set(val) {
      this.setDataValue('facultyAssignments', Array.isArray(val) ? val : []);
    },
  },
  capturedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  capturedBy: {
    type: DataTypes.STRING(120),
    allowNull: true,
    defaultValue: 'system',
  },
  remarks: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'timetable_snapshots',
  timestamps: true,
  indexes: [
    { name: 'idx_tt_snap_term', fields: ['academicYear', 'semesterTerm', 'snapshotType'] },
    { name: 'idx_tt_snap_class', fields: ['school', 'department', 'program', 'batch', 'specialization'] },
    { name: 'idx_tt_snap_time', fields: ['capturedAt'] },
  ],
});

export default TimetableSnapshot;
