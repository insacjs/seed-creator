/* global describe it expect */
const Sequelize = require('sequelize')
const path      = require('path')
const Seed      = require(global.LIB)

const DB_CONFIG = {
  username : process.env.DB_USER,
  password : process.env.DB_PASS,
  database : process.env.DB_NAME,
  params   : {
    dialect : 'postgres',
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

describe('\n - Clase: Seed\n', () => {
  describe(` Método: create`, () => {
    it('Ejecución con parámetros', () => {
      const sequelize = new Sequelize(
        DB_CONFIG.database,
        DB_CONFIG.username,
        DB_CONFIG.password,
        DB_CONFIG.params
      )
      const pathModels = path.resolve(__dirname, './models')
      sequelize.import(`${pathModels}/autor.model.js`)
      sequelize.import(`${pathModels}/libro.model.js`)
      sequelize.models.autor.associate(sequelize.models)
      sequelize.models.libro.associate(sequelize.models)

      sequelize.sync({ force: true }).then(result => {
        Seed.create(sequelize.models.libro, [
          {
            titulo : 'El gato negro',
            precio : 11.99,
            autor  : {
              id_autor : 10,
              nombre   : 'Edgar Allan Poe'
            }
          },
          {
            titulo    : 'El cuervo',
            precio    : 15.99,
            fid_autor : 10
          }
        ]).then(result => {
          expect(true).to.equal(true)
          setTimeout(() => { process.exit(0) }, 200)
        }).catch(err => {
          console.log(err)
          setTimeout(() => { process.exit(0) }, 200)
        })
      })
    })
  })
})
