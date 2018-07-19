/** @ignore */ const SchemaAccessError = require('./SchemaAccessError')

/**
* Clase para crear seeders
*/
class Seed {
  /**
  * Inserta un conjunto de registros en la base de datos.
  * @param {SequelizeModel} model                - Modelo Sequelize.
  * @param {!Object[]}      data                 - Lista de registros.
  * @param {Object}         [options]            - Opciones de configuración.
  * @param {String[]}       [options.schemas=[]] - Esquemas permitidos para la
  *                                                inserción de registros.
  * @return {Promise}
  */
  static async create (model, data, options = {}) {
    Seed.total      = data.length
    Seed.cnt        = 0
    options.schemas = options.schemas || []
    Seed.log('\n')
    Seed.startAt = Date.now()
    if (_verifyToBulkInsert(model, data)) {
      await _bulkInsert(model, data, options)
    } else {
      for (let i in data) {
        await _create(model, data[i], options)
        Seed.log('\n')
      }
    }
    Seed.endAt = Date.now()
    const elapsedTime = (Seed.endAt - Seed.startAt) / 1000
    Seed.log(`\x1b[2m   Se crearon ${Seed.total} registros en ${elapsedTime} segundos.\x1b[0m\n\n`)
    delete Seed.total
    delete Seed.cnt
  }

  static log (message) {
    if (!process.env.LOG || process.env.LOG === 'true') {
      process.stdout.write(message)
    }
  }
}

/**
* Indica si es posible insertar registros en masa.
* Verifica que todos los registros tengan la clave primaria y no incluyan asociaciones.
* @param {SequelizeModel} model - Modelo Sequelize.
* @param {!Object[]}      data  - Lista de registros.
* @return {Boolean}
*/
function _verifyToBulkInsert (model, data) {
  const PK = Object.keys(model.primaryKeys)[0]
  for (let i in data) {
    let hasPK = false
    for (let fieldName in data[i]) {
      if (typeof data[i][fieldName] === 'object' && !Array.isArray(data[i][fieldName])) { return false }
      if (!model.attributes[fieldName]) { return false }
      if (fieldName === PK) { hasPK = true }
    }
    if (!hasPK) { return false }
  }
  return true
}

/**
* Inserta un conjunto de registros en la base de datos.
* Si la clave primaria es autoincrementabe, también se actualiza la secuencia.
* @param {SequelizeModel} model           - Modelo Sequelize.
* @param {!Object[]}      data            - Datos del registro.
* @param {!Object}        options         - Opciones de configuración.
* @param {!Object}        options.schemas - Esquemas permitidos
*                                           para la inserción de registros.
* @return {Promise<Number>} ID del registro insertado.
*/
async function _bulkInsert (model, data, options) {
  const SCHEMA = model.options.schema
  if (SCHEMA && ((options.schemas.length === 0) || !options.schemas.includes(SCHEMA))) {
    throw new SchemaAccessError(`No se permite insertar regstros en la tabla '${model.name}' del esquema '${SCHEMA}'.`)
  }
  const PK     = Object.keys(model.primaryKeys)[0]
  const RESULT = await model.bulkCreate(data, { returning: true })
  let index = 0
  if (model.attributes[PK].autoIncrement === true) {
    RESULT.forEach(result => { if (result[PK] > index) index = result[PK] })
    await _updateAutoIncrement(model, PK, index)
  }
  const ID_INFO = index !== 0 ? ` (${PK}: ${index})` : ''
  Seed.log(`\x1b[2m - \x1b[0m\x1b[32mBULK INSERT\x1b[0m\x1b[2m ${model.name}${ID_INFO} ..... [${data.length}/${data.length}]\x1b[0m \u2713\n`)
}

/**
* Prepara los datos para insertarlos en la base de datos.
* @param {SequelizeModel} model           - Modelo Sequelize.
* @param {!Object[]}      data            - Lista de registros.
* @param {!Object}        options         - Opciones de configuración.
* @param {!Object}        options.schemas - Esquemas permitidos
*                                           para la inserción de registros.
* @return {Promise<Number>} ID del registro insertado.
*/
async function _create (model, data, options) {
  if (Array.isArray(data)) {
    for (let i in data) { await _create(model, data[i], options) } return
  }
  const dataToInsert = {}
  for (let prop in model.attributes) {
    const field = model.attributes[prop]
    if (_isForeignKey(field) && !data[prop]) {
      const ASSOCIATION = _getAssociationModelFromFK(model, field.fieldName)
      if (ASSOCIATION === null) {
        throw new Error(`Se esperaba que el modelo ${model.name} esté asociado con otro modelo como ${prop}.`)
      }
      if (!data[ASSOCIATION.as]) {
        throw new Error(`Se requiere el campo ${prop} o el objeto ${ASSOCIATION.as} para crear el registro ${model.name}.`)
      }
      Seed.total += Array.isArray(data[ASSOCIATION.as]) ? data[ASSOCIATION.as].length : 1
      data[prop] = await _create(ASSOCIATION.target, data[ASSOCIATION.as], options)
    }
    if (typeof data[prop] !== 'undefined') {
      dataToInsert[prop] = data[prop]
    }
  }
  const ID = await _insert(model, dataToInsert, options)
  for (let prop in data) {
    if (!model.attributes[prop]) {
      const ASSOC = _getAssociationModelFromAs(model, prop)
      if (ASSOC && (ASSOC.associationType === 'HasOne' || ASSOC.associationType === 'HasMany')) {
        if (Array.isArray(data[prop])) {
          for (let i in data[prop]) {
            data[prop][i][ASSOC.foreignKey] = ID
          }
        } else {
          data[prop][ASSOC.foreignKey] = ID
        }
        Seed.total += Array.isArray(data[prop]) ? data[prop].length : 1
        await _create(ASSOC.target, data[prop], options)
      }
    }
  }
  return ID
}

/**
* Inserta un registro en la base de datos y devuelve su ID.
* Si la clave primaria es autoincrementabe, también se actualiza la secuencia.
* @param {SequelizeModel} model           - Modelo Sequelize.
* @param {!Object[]}      data            - Datos del registro.
* @param {!Object}        options         - Opciones de configuración.
* @param {!Object}        options.schemas - Esquemas permitidos
*                                           para la inserción de registros.
* @return {Promise<Number>} ID del registro insertado.
*/
async function _insert (model, data, options) {
  const SCHEMA = model.options.schema
  if (SCHEMA && ((options.schemas.length === 0) || !options.schemas.includes(SCHEMA))) {
    throw new SchemaAccessError(`No se permite insertar regstros en la tabla '${model.name}' del esquema '${SCHEMA}'.`)
  }
  const PK     = Object.keys(model.primaryKeys)[0]
  const RESULT = await model.create(data)
  const ID     = RESULT[PK]
  await _updateAutoIncrement(model, PK, ID)
  Seed.log(`\x1b[2m - \x1b[0m\x1b[32mINSERT\x1b[0m\x1b[2m [${++Seed.cnt}/${Seed.total}] ${model.name} (${PK}: ${ID})\x1b[0m \u2713\n`)
  return ID
}

/**
* Actualiza el valor del contador de una clave primaria, solamente si éste fuera de tipo entero y autoincrementable.
* @param {SequelizeModel} model - Modelo Sequelize.
* @param {String}         PK    - Nombre del campo de la clave primaria.
*/
async function _updateAutoIncrement (model, PK) {
  const SCHEMA        = model.options.schema
  const DIALECT       = model.options.sequelize.options.dialect
  const MODEL_NAME    = model.name
  const TABLE_NAME    = `${(!SCHEMA) ? '' : `${SCHEMA}.`}${MODEL_NAME}`
  const SEQUENCE_NAME = `${(!SCHEMA) ? '' : `${SCHEMA}.`}${MODEL_NAME}_${PK}_seq`
  if (model.attributes[PK].type.key === 'INTEGER' && model.attributes[PK].autoIncrement === true) {
    const ID = await model.max(PK)
    switch (DIALECT) {
      case 'postgres':
        await model.options.sequelize.query(`ALTER SEQUENCE ${SEQUENCE_NAME} RESTART WITH ${ID + 1}`)
        break
      case 'mysql':
        await model.options.sequelize.query(`ALTER TABLE \`${TABLE_NAME}\` AUTO_INCREMENT = ${ID + 1}`)
        break
      case 'mssql':
        await model.options.sequelize.query(`DBCC CHECKIDENT ('${TABLE_NAME}', RESEED, ${ID})`)
        break
      case 'sqlite':
        await model.options.sequelize.query(`UPDATE SQLITE_SEQUENCE SET SEQ=${ID} WHERE NAME='${TABLE_NAME}'`)
        break
      default:
        throw new Error(`El dialecto ${DIALECT} no existe. Dialectos soportados: postgres, mysql, mssql y sqlite`)
    }
  }
}

/**
* Devuelve la asociación correspondiente a una clave foránea.
* @param {SequelizeModel} model      - Modelo sequelize.
* @param {String}         foreignKey - Clave foranea
* @return {Object}
*/
function _getAssociationModelFromFK (model, foreignKey) {
  for (let key in model.associations) {
    const ASSOCIATION = model.associations[key]
    if (ASSOCIATION.foreignKey === foreignKey) { return ASSOCIATION }
  }
  return null
}

/**
* Devuelve la asociación correspondiente a partir del nombre asociado.
* @param {SequelizeModel} model - Modelo sequelize.
* @param {String}         as    - Nombre de la asociacion.
* @return {Object}
*/
function _getAssociationModelFromAs (model, as) {
  for (let key in model.associations) {
    const ASSOCIATION = model.associations[key]
    if (ASSOCIATION.as === as) { return ASSOCIATION }
  }
  return null
}

/**
* Indica si un objeto es atributo con clave foránea.
* @param {Object} obj Objeto.
* @return {Boolean}
*/
function _isForeignKey (obj) {
  if (obj && obj._modelAttribute && (obj._modelAttribute === true) && obj.references) {
    return true
  }
  return false
}

module.exports = Seed
