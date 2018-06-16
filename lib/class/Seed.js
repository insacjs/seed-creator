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
  * @param {Object}         [options.schemas=[]] - Esquemas permitidos
  *                                                para la inserción de registros.
  * @return {Promise}
  */
  static async create (model, data, options = {}) {
    options.schemas = options.schemas || []
    for (let i in data) {
      await _create(model, data[i], options)
    }
  }
}

/**
* Inserta un único registro en la base de datos.
* @param {SequelizeModel} model           - Modelo Sequelize.
* @param {!Object[]}      data            - Lista de registros.
* @param {!Object}        options         - Opciones de configuración.
* @param {!Object}        options.schemas - Esquemas permitidos
*                                           para la inserción de registros.
* @return {Promise<Number>} ID del registro insertado.
*/
async function _create (model, data, options) {
  const dataToInsert = {}
  for (let prop in model.attributes) {
    const field = model.attributes[prop]
    if (_isForeignKey(field) && !data[prop]) {
      const ASSOCIATION = _getAssociationModel(model, field.fieldName)
      if (ASSOCIATION === null) {
        throw new Error(`Se esperaba que el modelo ${model.name} esté asociado con otro modelo como ${prop}.`)
      }
      if (!data[ASSOCIATION.as]) {
        throw new Error(`Se requiere el campo ${prop} o el objeto ${ASSOCIATION.as} para crear el registro ${model.name}.`)
      }
      data[prop] = await _create(ASSOCIATION.target, data[ASSOCIATION.as], options)
    }
    if (typeof data[prop] !== 'undefined') {
      dataToInsert[prop] = data[prop]
    }
  }
  return _insert(model, dataToInsert, options)
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
  const SCHEMA  = model.options.schema
  const DIALECT = model.options.sequelize.options.dialect
  if (SCHEMA && ((options.schemas.length === 0) || !options.schemas.includes(SCHEMA))) {
    throw new SchemaAccessError(`No se permite la inserción de registros sobre la tabla '${model.name}' del esquema '${SCHEMA}'.`)
  }
  const MODEL_NAME = model.name
  const TABLE_NAME = `${(!SCHEMA) ? '' : `${SCHEMA}.`}${MODEL_NAME}`
  const PK         = Object.keys(model.primaryKeys)[0]
  const RESULT     = await model.create(data)
  const ID         = RESULT[PK]
  if (model.attributes[PK].autoIncrement === true) {
    switch (DIALECT) {
      case 'postgres':
        const SEQUENCE_NAME = `${(!SCHEMA) ? '' : `${SCHEMA}.`}${MODEL_NAME}_${PK}_seq`
        await model.options.sequelize.query(`ALTER SEQUENCE ${SEQUENCE_NAME} RESTART WITH ${ID + 1}`)
        break
      case 'mysql':
        await model.options.sequelize.query(`ALTER TABLE \`${TABLE_NAME}\` AUTO_INCREMENT = ${ID + 1}`)
        break
      case 'sqlite':
        await model.options.sequelize.query(`UPDATE SQLITE_SEQUENCE SET SEQ=${ID + 1} WHERE NAME='${TABLE_NAME}'`)
        break
      default:
        throw new Error(`El dialecto ${DIALECT} no existe. Dialectos soportados: postgres, mysql, sqlite`)
    }
  }
  return ID
}

/**
* Devuelve la asociación correspondiente a una clave foránea.
* @param {SequelizeModel} model      - Modelo sequelize.
* @param {String}         foreignKey - Clave foranea
* @return {Object}
*/
function _getAssociationModel (model, foreignKey) {
  for (let key in model.associations) {
    const ASSOCIATION = model.associations[key]
    if (ASSOCIATION.foreignKey === foreignKey) {
      return ASSOCIATION
    }
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
