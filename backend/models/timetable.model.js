import { DataTypes } from 'sequelize';
import sequelize from '../lib/db.js';

/**
 * Timetable — one row per class (5-tuple key), `entries` is a JSON object
 * shaped like:
 *   {
 *     "Mon": { "I": [{ code, room, faculty, group, color }, ...], "II": [...], ... },
 *     "Tue": { ... },
 *     ...
 *   }
 *
 * Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun
 * Slots: I, II, III, IV, V, VI, VII, VIII, IX, X, XI  (free text — frontend renders)
 *
 * `contentHash` lets us detect changes from mygbu.in to notify users.
 */
const Timetable = sequelize.define('Timetable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  school: { type: DataTypes.STRING(100), allowNull: false },
  department: { type: DataTypes.STRING(100), allowNull: false },
  program: { type: DataTypes.STRING(100), allowNull: false },
  batch: { type: DataTypes.STRING(40), allowNull: false },
  specialization: { type: DataTypes.STRING(100), allowNull: false },
  entries: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    get() {
      const rawValue = this.getDataValue('entries');
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
      this.setDataValue('entries', typeof val === 'object' && val !== null ? val : {});
    },
  },
  subjects: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Optional subject details parsed from Remarks table',
    get() {
      const rawValue = this.getDataValue('subjects');
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
      this.setDataValue('subjects', Array.isArray(val) ? val : []);
    },
  },
  semester: { type: DataTypes.STRING, allowNull: true },
  academicYear: { type: DataTypes.STRING, allowNull: true },
  sourceUrl: { type: DataTypes.STRING, allowNull: true },
  contentHash: { type: DataTypes.STRING, allowNull: true, comment: 'SHA-256 of normalized entries JSON' },
  lastFetchedAt: { type: DataTypes.DATE, allowNull: true },
  lastChangedAt: { type: DataTypes.DATE, allowNull: true },
  fetchStatus: { type: DataTypes.STRING, allowNull: true, defaultValue: 'pending' },
  fetchError: { type: DataTypes.STRING, allowNull: true },
  isStale: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  manuallyEdited: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  timestamps: true,
  indexes: [
    { name: 'idx_tt_unique', unique: true, fields: ['school', 'department', 'program', 'batch', 'specialization'] },
  ],
});

export default Timetable;
