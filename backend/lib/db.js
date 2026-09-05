import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const dialect = process.env.DB_DIALECT || 'mysql';
const logging = process.env.DEBUG_SQL === 'true' ? (msg) => logger.debug(msg) : false;

let sequelize;

if (dialect === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'gbu_sdms',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      dialect: 'mysql',
      logging,
      dialectOptions: {
        charset: 'utf8mb4',
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: true,
        typeCast: true,
        timezone: '+00:00',
        flags: '-FOUND_ROWS,IGNORE_SPACE,NO_AUTO_VALUE_ON_ZERO,NO_ENGINE_SUBSTITUTION'
      },
      pool: {
        max: 25,
        min: 4,
        acquire: 30000,
        idle: 30000,
        afterConnect: (connection, done) => {
          connection.query(
            'SET SESSION sort_buffer_size = 4 * 1024 * 1024, tmp_table_size = 64 * 1024 * 1024, max_heap_table_size = 64 * 1024 * 1024;',
            (err) => done(err, connection)
          );
        },
      },
    }
  );
} else if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE || 'database.sqlite',
    logging,
  });
} else {
  throw new Error(`Unsupported DB_DIALECT value: ${dialect}`);
}

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info(
      {
        dialect,
        host: process.env.DB_HOST,
        db: process.env.DB_NAME,
        poolMax: 25,
        poolAcquireMs: 30000,
      },
      `Database connected using ${dialect}`
    );

    if (dialect === 'mysql') {
      try {
        await sequelize.query("SET SESSION sort_buffer_size = 4 * 1024 * 1024, tmp_table_size = 64 * 1024 * 1024, max_heap_table_size = 64 * 1024 * 1024;");
        logger.info('MySQL session tuned: sort_buffer_size=4MB, tmp_table_size=64MB, max_heap_table_size=64MB');
      } catch (tuneErr) {
        logger.warn({ err: tuneErr.message }, 'Could not tune MySQL session vars (non-super user)');
      }
    }

    if (process.env.ALLOW_SYNC === 'true') {
      logger.warn('ALLOW_SYNC=true - running sequelize.sync() (dev only)');
      await sequelize.sync();
      logger.info('sequelize.sync() completed');
    } else {
      logger.info('sequelize.sync() skipped (set ALLOW_SYNC=true to enable, dev only)');
    }
    return true;
  } catch (error) {
    logger.fatal(
      {
        err: { name: error.name, message: error.message, stack: error.stack },
        dialect,
        host: process.env.DB_HOST,
        db: process.env.DB_NAME,
      },
      'Database connection failed'
    );
    return false;
  }
};

export default sequelize;
