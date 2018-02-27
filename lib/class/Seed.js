/**
* Clase para crear seeders
*/
class Seed {
  /**
  * Inserta un conjunto de registros en la base de datos.
  * @param {SequelizeModel} model - Modelo Sequelize.
  * @param {!Object[]}      data  - Lista de registros.
  * @return {Promise}
  */
  static async create (model, data) {
    for (let i in data) {
      await _create(model, data[i])
    }
  }
}

/**
* Inserta un único registro en la base de datos.
* @param {SequelizeModel} model - Modelo Sequelize.
* @param {Object}         data  - Datos del registro.
* @return {Promise<Number>} ID del registro insertado.
*/
async function _create (model, data) {
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
      data[prop] = await _create(ASSOCIATION.target, data[ASSOCIATION.as])
    }
    if (typeof data[prop] !== 'undefined') {
      dataToInsert[prop] = data[prop]
    }
  }
  return _insert(model, dataToInsert)
}

/**
* Inserta un registro en la base de datos y devuelve su ID.
* Si la clave primaria es autoincrementabe, también se actualiza la secuencia.
* @param {SequelizeModel} model - Modelo Sequelize.
* @param {Object}         data  - Datos del registro.
* @return {Promise<Number>} ID del registro insertado.
*/
async function _insert (model, data) {
  const SCHEMA     = model.options.schema
  const MODEL_NAME = model.name
  const PK         = Object.keys(model.primaryKeys)[0]
  const RESULT     = await model.create(data)
  const ID         = RESULT[PK]
  if (model.attributes[PK].autoIncrement === true) {
    const SEQUENCE_NAME = `${(!SCHEMA) ? '' : `${SCHEMA}.`}${MODEL_NAME}_${PK}_seq`
    await model.options.sequelize.query(`ALTER SEQUENCE ${SEQUENCE_NAME} RESTART WITH ${ID + 1}`)
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
