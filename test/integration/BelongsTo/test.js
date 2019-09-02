/* global describe it expect */
const Sequelize = require('sequelize')
const path      = require('path')
const Seed      = require(global.LIB)
const _         = require('lodash')

const DB_CONFIG = {
  username : process.env.DB_USER,
  password : process.env.DB_PASS,
  database : process.env.DB_NAME,
  params   : {
    dialect : 'postgres',
    host    : '127.0.0.1',
    port    : '5432',
    lang    : 'es',
    logging : false,
    define  : {
      underscored     : true,
      freezeTableName : true,
      timestamps      : false
    }
  }
}

const LIBROS  = require(path.resolve(__dirname, 'seeds/libro.seed.js'))()
const AUTORES = require(path.resolve(__dirname, 'seeds/autor.seed.js'))()

/**
* Crea la base de datos.
*/
async function createDatabase (DATABASE, USERNAME, PASSWORD, PARAMS) {
  const sequelize = new Sequelize(DATABASE, USERNAME, PASSWORD, PARAMS)
  const pathModels = path.resolve(__dirname, './models')
  sequelize.import(`${pathModels}/autor.model.js`)
  sequelize.import(`${pathModels}/libro.model.js`)
  sequelize.models.libro.associate(sequelize.models)
  try {
    await sequelize.authenticate()
  } catch (e) {
    const MSG = e.message
    const DATABASE_DOES_NOT_EXIST = (MSG.includes('database') && MSG.includes('does not exist')) || MSG.includes('no existe la base de datos') || MSG.includes('Unknown database')
    if (e.name === 'SequelizeConnectionError' && DATABASE_DOES_NOT_EXIST) {
      const DIALECT          = PARAMS.dialect
      const DEFAULT_DATABASE = DIALECT === 'postgres' ? 'postgres' : null
      const sequelizeTMP     = new Sequelize(DEFAULT_DATABASE, USERNAME, PASSWORD, PARAMS)
      await sequelizeTMP.query(`CREATE DATABASE ${DATABASE}`).then(() => { sequelizeTMP.close() })
    } else { throw e }
  }
  await sequelize.dropSchema('dos', { force: true })
  await sequelize.dropSchema('uno', { force: true })
  await sequelize.createSchema('uno')
  await sequelize.createSchema('dos')
  await sequelize.sync({ force: true })
  return sequelize
}

describe('\n - Función create con registros anidados [BelongsTo]', () => {
  it('Prueba con el dialecto postgres', async () => {
    const PARAMS    =  _.cloneDeep(DB_CONFIG.params)
    PARAMS.dialect  = 'postgres'
    PARAMS.port     = '5432'
    const DB_NAME   = 'seed_creator_test'
    const DB_USER   = 'postgres'
    const DB_PASS   = 'postgres'
    const DB_PARAMS = PARAMS
    const sequelize = await createDatabase(DB_NAME, DB_USER, DB_PASS, DB_PARAMS)
    await Seed.create(sequelize.models.libro, _.cloneDeep(LIBROS), { schemas: ['uno', 'dos'] })
    await Seed.create(sequelize.models.autor, _.cloneDeep(AUTORES), { schemas: ['uno', 'dos'] })
    expect(true).to.equal(true)
    await sequelize.close()
  })
  it('Prueba con el dialecto mysql', async () => {
    const PARAMS    =  _.cloneDeep(DB_CONFIG.params)
    PARAMS.dialect  = 'mysql'
    PARAMS.port     = '3306'
    const DB_NAME   = 'seed_creator_test'
    const DB_USER   = 'root'
    const DB_PASS   = '12345678'
    const DB_PARAMS = PARAMS
    const sequelize = await createDatabase(DB_NAME, DB_USER, DB_PASS, DB_PARAMS)
    await Seed.create(sequelize.models.libro, _.cloneDeep(LIBROS), { schemas: ['uno', 'dos'] })
    await Seed.create(sequelize.models.autor, _.cloneDeep(AUTORES), { schemas: ['uno', 'dos'] })
    expect(true).to.equal(true)
    await sequelize.close()
  })
  it('Prueba con el dialecto mssql', async () => {
    const PARAMS    =  _.cloneDeep(DB_CONFIG.params)
    PARAMS.dialect  = 'mssql'
    PARAMS.port     = '1433'
    const DB_NAME   = 'seed_creator_test'
    const DB_USER   = 'sa'
    const DB_PASS   = 'Abc123456*'
    const DB_PARAMS = PARAMS
    const sequelize = await createDatabase(DB_NAME, DB_USER, DB_PASS, DB_PARAMS)
    await Seed.create(sequelize.models.libro, _.cloneDeep(LIBROS), { schemas: ['uno', 'dos'] })
    await Seed.create(sequelize.models.autor, _.cloneDeep(AUTORES), { schemas: ['uno', 'dos'] })
    expect(true).to.equal(true)
    await sequelize.close()
  })
  it('Prueba con el dialecto sqlite', async () => {
    const PARAMS    =  _.cloneDeep(DB_CONFIG.params)
    PARAMS.dialect  = 'sqlite'
    PARAMS.storage  = 'seed_creator_test.sqlite'
    const DB_NAME   = 'null'
    const DB_USER   = 'null'
    const DB_PASS   = 'null'
    const DB_PARAMS = PARAMS
    const sequelize = await createDatabase(DB_NAME, DB_USER, DB_PASS, DB_PARAMS)
    await Seed.create(sequelize.models.libro, _.cloneDeep(LIBROS), { schemas: ['uno', 'dos'] })
    await Seed.create(sequelize.models.autor, _.cloneDeep(AUTORES), { schemas: ['uno', 'dos'] })
    expect(true).to.equal(true)
    await sequelize.close()
  })
})
