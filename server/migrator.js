import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './models/index.js';
import path from 'path';

function makeMigrator() {
  return new Umzug({
    migrations: { glob: path.join(new URL('.', import.meta.url).pathname, 'migrations/*.cjs') },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });
}

export default makeMigrator;
