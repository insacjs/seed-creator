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
    },
    operatorsAliases: false
  }
}

const DATA = [
  {
    titulo      : 'El gato negro',
    precio      : 11.99,
    descripcion : 'Cuento de terror',
    estado      : true,
    autor       : {
      id_autor : 10,
      nombre   : 'Edgar Allan Poe',
      ci       : 111111,
      tipo     : 'NACIONAL',
      telefono : [ '22464756', '78675867' ]
    }
  },
  {
    titulo    : 'El cuervo',
    precio    : 15.99,
    fid_autor : 10
  },
  {
    titulo : 'Juego de tronos',
    precio : 49.50,
    tipo   : 'INTERNACIONAL',
    autor  : {
      nombre   : 'George R. Martin',
      ci       : 222222,
      telefono : [ '22464756', '78675867' ]
    }
  }
]

const AUTORES = [
  { id_autor: 100, nombre: 'George R. Martin', ci: 222222, telefono: [ '22464756', '78675867' ] },
  { id_autor: 200, nombre: 'George R. Martin', ci: 222222, telefono: [ '22464756', '78675867' ] },
  { id_autor: 300, nombre: 'George R. Martin', ci: 222222, telefono: [ '22464756', '78675867' ] },
  { id_autor: 400, nombre: 'George R. Martin', ci: 222222, telefono: [ '22464756', '78675867' ] },
  { id_autor: 500, nombre: 'George R. Martin', ci: 222222, telefono: [ '22464756', '78675867' ] }
]

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

describe('\n - Clase Seed', () => {
  it('Prueba con el dialecto postgres', async () => {
    const PARAMS    =  _.cloneDeep(DB_CONFIG.params)
    PARAMS.dialect  = 'postgres'
    PARAMS.port     = '5432'
    const DB_NAME   = 'seed_creator_test'
    const DB_USER   = 'postgres'
    const DB_PASS   = '12345678'
    const DB_PARAMS = PARAMS
    const sequelize = await createDatabase(DB_NAME, DB_USER, DB_PASS, DB_PARAMS)
    await Seed.create(sequelize.models.libro, _.cloneDeep(DATA), { schemas: ['uno', 'dos'] })
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
    await Seed.create(sequelize.models.libro, _.cloneDeep(DATA), { schemas: ['uno', 'dos'] })
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
    await Seed.create(sequelize.models.libro, _.cloneDeep(DATA), { schemas: ['uno', 'dos'] })
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
    await Seed.create(sequelize.models.libro, _.cloneDeep(DATA), { schemas: ['uno', 'dos'] })
    await Seed.create(sequelize.models.autor, _.cloneDeep(AUTORES), { schemas: ['uno', 'dos'] })
    expect(true).to.equal(true)
    await sequelize.close()
  })
})
