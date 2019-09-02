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
  * @param {Logger}         [options.logger]     - Instancia de logger.
  * @return {Promise}
  */
  static async create (model, data, options = {}) {
    Seed.total = data.length
    Seed.cnt   = 0
    options.schemas   = options.schemas || []
    options.logger    = options.logger  || { appPrimary: () => {}, OK: '', FAIL: 'x' }
    Seed.startAt = Date.now()
    if (_verifyToBulkInsert(model, data)) {
      await model.options.sequelize.transaction(async (t) => {
        options.t = options.transaction || t
        options.logger.appPrimary()
        return _bulkInsert(model, data, options)
      })
    } else {
      await model.options.sequelize.transaction(async (t) => {
        options.t = options.transaction || t
        options.logger.appPrimary()
        for (const i in data) {
          await _create(model, data[i], options)
          options.logger.appPrimary()
        }
      })
    }
    Seed.endAt = Date.now()
    const elapsedTime = (Seed.endAt - Seed.startAt) / 1000
    const result = {
      entries     : Seed.total,
      elapsedTime : elapsedTime
    }
    delete Seed.total
    delete Seed.cnt
    return result
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
  for (const i in data) {
    let hasPK = false
    for (const fieldName in data[i]) {
      if (typeof data[i][fieldName] === 'object' && !Array.isArray(data[i][fieldName])) { return false }
      if (!(model.attributes || model.rawAttributes)[fieldName]) { return false }
      if (fieldName === PK) { hasPK = true }
    }
    if (!hasPK) { return false }
  }
  return true
}

/**
* Inserta un conjunto de registros en la base de datos.
* Si la clave primaria es autoincrementabe, también se actualiza la secuencia.
* @param {SequelizeModel} model   - Modelo Sequelize.
* @param {!Object[]}      data    - Datos del registro.
* @param {!Object}        options - Opciones de configuración.
*                                   para la inserción de registros.
* @return {Promise<Number>} ID del registro insertado.
*/
async function _bulkInsert (model, data, options) {
  const schema = model.options.schema ? `${model.options.schema}.` : ''
  const countMsg = data.length !== 1 ? `${data.length} registros` : `${data.length} registro`
  options.logger.appPrimary('BULK INSERT', `${schema}${model.name} [${countMsg}] ...\n`)
  _verifyAccess(model, options)
  const PK = Object.keys(model.primaryKeys)[0]
  await model.bulkCreate(data, { returning: true, transaction: options.t })
  if ((model.attributes || model.rawAttributes)[PK].autoIncrement === true) {
    await _updateAutoIncrement(model, PK, options)
  }
}

/**
* Verifica si el modelo tiene un esquema que se encuentre entre la lista de esquemas permitidos.
* @param {SequelizeModel} model   - modelo Sequelize.
* @param {!Object}        options - Opciones de configuración.
*                                   para la inserción de registros.
*/
function _verifyAccess (model, options) {
  const SCHEMA = model.options.schema
  if (options.schemas.length > 0) {
    if (SCHEMA && !options.schemas.includes(SCHEMA)) {
      const esquemasPermitidos = options.schemas.toString()
      let errMsg = `Se necesitan permisos para modificar la tabla '${SCHEMA}.${model.name}'.\n`
      errMsg = `  El esquema '${SCHEMA}' no se encuentra en la lista de esquemas que pueden ser modificados\n`
      errMsg += `  Los esquemas permitidos son: ${esquemasPermitidos}\n\n`
      errMsg += '  Verifique que el módulo al que pertenece la tabla tenga permisos de instalación (setup = true)'
      throw new Error(errMsg)
    }
  }
}

/**
* Prepara los datos para insertarlos en la base de datos.
* @param {SequelizeModel} model   - Modelo Sequelize.
* @param {!Object[]}      data    - Lista de registros.
* @param {!Object}        options - Opciones de configuración.
* @return {Promise<Number>} ID del registro insertado.
*/
async function _create (model, data, options) {
  if (Array.isArray(data)) {
    for (const i in data) { await _create(model, data[i], options) } return
  }
  const dataToInsert = {}
  for (const prop in (model.attributes || model.rawAttributes)) {
    const field = (model.attributes || model.rawAttributes)[prop]
    if (_isForeignKey(field) && !data[prop]) {
      const ASSOCIATION = _getAssociationModelFromFK(model, field.fieldName)
      if (ASSOCIATION === null) {
        throw new Error(`Se esperaba que el modelo ${model.name} esté asociado con otro modelo como ${prop}.`)
      }
      if (!data[ASSOCIATION.as]) {
        const schema = model.options.schema ? `${model.options.schema}.` : ''
        throw new Error(`Se requiere el campo ${prop} o el objeto ${ASSOCIATION.as} para crear el registro '${schema}${model.name}'.`)
      }
      Seed.total += Array.isArray(data[ASSOCIATION.as]) ? data[ASSOCIATION.as].length : 1
      data[prop] = await _create(ASSOCIATION.target, data[ASSOCIATION.as], options)
    }
    if (typeof data[prop] !== 'undefined') {
      dataToInsert[prop] = data[prop]
    }
  }
  const ID = await _insert(model, dataToInsert, options)
  for (const prop in data) {
    if (!(model.attributes || model.rawAttributes)[prop]) {
      const ASSOC = _getAssociationModelFromAs(model, prop)
      if (ASSOC && (ASSOC.associationType === 'HasOne' || ASSOC.associationType === 'HasMany')) {
        if (Array.isArray(data[prop])) {
          for (const i in data[prop]) {
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
* @param {SequelizeModel} model   - Modelo Sequelize.
* @param {!Object[]}      data    - Datos del registro.
* @param {!Object}        options - Opciones de configuración.
* @return {Promise<Number>} ID del registro insertado.
*/
async function _insert (model, data, options) {
  const schema = model.options.schema ? `${model.options.schema}.` : ''
  try {
    _verifyAccess(model, options)
    const PK     = Object.keys(model.primaryKeys)[0]
    const RESULT = await model.create(data, { transaction: options.t })
    const ID     = RESULT[PK]
    await _updateAutoIncrement(model, PK, options)
    options.logger.appPrimary('INSERT', `[${++Seed.cnt}/${Seed.total}] ${schema}${model.name} .... [${PK}: ${ID}] ${options.logger.OK}`)
    return ID
  } catch (e) {
    options.logger.appError('INSERT', `[${++Seed.cnt}/${Seed.total}] ${schema}${model.name} ${options.logger.FAIL}\n`)
    throw e
  }
}

/**
* Actualiza el valor del contador de una clave primaria, solamente si éste fuera de tipo entero y autoincrementable.
* @param {SequelizeModel} model   - Modelo Sequelize.
* @param {String}         PK      - Nombre del campo de la clave primaria.
* @param {!Object}        options - Opciones de configuración.
*/
async function _updateAutoIncrement (model, PK, options) {
  const SCHEMA        = model.options.schema
  const DIALECT       = model.options.sequelize.options.dialect
  const MODEL_NAME    = model.name
  const TABLE_NAME    = `${(!SCHEMA) ? '' : `${SCHEMA}.`}${MODEL_NAME}`
  const SEQUENCE_NAME = `${(!SCHEMA) ? '' : `${SCHEMA}.`}${MODEL_NAME}_${PK}_seq`
  const seq           = model.options.sequelize
  const OPT           = { transaction: options.t, paranoid: false }
  if ((model.attributes || model.rawAttributes)[PK].type.key === 'INTEGER' && (model.attributes || model.rawAttributes)[PK].autoIncrement === true) {
    const ID = (await model.max(PK, OPT)) || 1
    let errMsg = `No existe el dialecto '${DIALECT}'.\n`
    errMsg += '  Dialectos soportados: postgres, mysql, mssql y sqlite.\n'
    switch (DIALECT) {
      case 'postgres' : await seq.query(`ALTER SEQUENCE ${SEQUENCE_NAME} RESTART WITH ${ID + 1}`,          OPT); break
      case 'mysql'    : await seq.query(`ALTER TABLE \`${TABLE_NAME}\` AUTO_INCREMENT = ${ID + 1}`,        OPT); break
      case 'mssql'    : await seq.query(`DBCC CHECKIDENT ('${TABLE_NAME}', RESEED, ${ID})`,                OPT); break
      case 'sqlite'   : await seq.query(`UPDATE SQLITE_SEQUENCE SET SEQ=${ID} WHERE NAME='${TABLE_NAME}'`, OPT); break
      default         : throw new Error(errMsg)
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
  for (const key in model.associations) {
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
  for (const key in model.associations) {
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
