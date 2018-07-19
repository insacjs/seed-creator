/* global describe it expect */
const Sequelize = require('sequelize')
const path      = require('path')
const Seed      = require(global.LIB)
const _         = require('lodash')
const util      = require(path.resolve(process.cwd(), `lib/tools/util`))

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
    },
    operatorsAliases: false
  }
}

/**
* Crea la base de datos.
*/
async function createDatabase (DATABASE, USERNAME, PASSWORD, PARAMS) {
  const sequelize = new Sequelize(DATABASE, USERNAME, PASSWORD, PARAMS)
  const pathModels = path.resolve(__dirname, './models')
  util.find(pathModels, '.model.js', ({ filePath }) => { sequelize.import(filePath) })
  for (let modelName in sequelize.models) { sequelize.models[modelName].associate(sequelize.models) }
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
  await sequelize.dropSchema('auth', { force: true })
  await sequelize.createSchema('auth')
  await sequelize.sync({ force: true })
  return sequelize
}

describe('\n - Función create con registros anidados [HasOne, HasMany]', () => {
  it('Prueba con el dialecto postgres', async () => {
    const PARAMS    =  _.cloneDeep(DB_CONFIG.params)
    PARAMS.dialect  = 'postgres'
    PARAMS.port     = '5432'
    const DB_NAME   = 'seed_creator_test'
    const DB_USER   = 'postgres'
    const DB_PASS   = '12345678'
    const DB_PARAMS = PARAMS
    await _test(DB_NAME, DB_USER, DB_PASS, DB_PARAMS)
  })
  it('Prueba con el dialecto mysql', async () => {
    const PARAMS    =  _.cloneDeep(DB_CONFIG.params)
    PARAMS.dialect  = 'mysql'
    PARAMS.port     = '3306'
    const DB_NAME   = 'seed_creator_test'
    const DB_USER   = 'root'
    const DB_PASS   = '12345678'
    const DB_PARAMS = PARAMS
    await _test(DB_NAME, DB_USER, DB_PASS, DB_PARAMS)
  })
  it('Prueba con el dialecto mssql', async () => {
    const PARAMS    =  _.cloneDeep(DB_CONFIG.params)
    PARAMS.dialect  = 'mssql'
    PARAMS.port     = '1433'
    const DB_NAME   = 'seed_creator_test'
    const DB_USER   = 'sa'
    const DB_PASS   = 'Abc123456*'
    const DB_PARAMS = PARAMS
    await _test(DB_NAME, DB_USER, DB_PASS, DB_PARAMS)
  })
  it('Prueba con el dialecto sqlite', async () => {
    const PARAMS    =  _.cloneDeep(DB_CONFIG.params)
    PARAMS.dialect  = 'sqlite'
    PARAMS.storage  = 'seed_creator_test.sqlite'
    const DB_NAME   = 'null'
    const DB_USER   = 'null'
    const DB_PASS   = 'null'
    const DB_PARAMS = PARAMS
    await _test(DB_NAME, DB_USER, DB_PASS, DB_PARAMS)
  })
})

async function _test (DB_NAME, DB_USER, DB_PASS, DB_PARAMS) {
  const sequelize1 = await createDatabase(`${DB_NAME}_1`, DB_USER, DB_PASS, _.cloneDeep(_.merge(DB_PARAMS, { storage: `${DB_PARAMS.storage}_1` })))
  const sequelize2 = await createDatabase(`${DB_NAME}_2`, DB_USER, DB_PASS, _.cloneDeep(_.merge(DB_PARAMS, { storage: `${DB_PARAMS.storage}_2` })))
  const sequelize3 = await createDatabase(`${DB_NAME}_3`, DB_USER, DB_PASS, _.cloneDeep(_.merge(DB_PARAMS, { storage: `${DB_PARAMS.storage}_3` })))
  const PERSONAS  = require(path.resolve(__dirname, 'seeds/persona.seed.js'))()
  const USUARIOS  = require(path.resolve(__dirname, 'seeds/usuario.seed.js'))()
  const ROLES     = require(path.resolve(__dirname, 'seeds/rol.seed.js'))()
  await Seed.create(sequelize1.models.persona, _.cloneDeep(PERSONAS), { schemas: ['auth'] })
  await Seed.create(sequelize2.models.usuario, _.cloneDeep(USUARIOS), { schemas: ['auth'] })
  await Seed.create(sequelize3.models.rol,     _.cloneDeep(ROLES),    { schemas: ['auth'] })
  expect(await sequelize1.models.persona.count()).to.equal(PERSONAS.length)
  expect(await sequelize2.models.persona.count()).to.equal(PERSONAS.length)
  expect(await sequelize3.models.persona.count()).to.equal(PERSONAS.length)
  expect(await sequelize1.models.usuario.count()).to.equal(USUARIOS.length)
  expect(await sequelize2.models.usuario.count()).to.equal(USUARIOS.length)
  expect(await sequelize3.models.usuario.count()).to.equal(USUARIOS.length)
  expect(await sequelize1.models.rol.count()).to.equal(ROLES.length)
  expect(await sequelize2.models.rol.count()).to.equal(ROLES.length)
  expect(await sequelize3.models.rol.count()).to.equal(ROLES.length)
  await sequelize1.close()
  await sequelize2.close()
  await sequelize3.close()
}
