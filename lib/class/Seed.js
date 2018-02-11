'use strict'
/** @ignore */ const async = require('async')

/**
* Clase que permite crear seeders
*/
class Seed {
  /**
  * Inserta un conjunto de registros en la base de datos.
  * @param {!String} sequelize Instancia sequelize.
  * @param {!String} modelName Nombre del modelo.
  * @param {!Object[]} DATA Lista de registros.
  * @return {Promise}
  */
  static async create (sequelize, modelName, DATA) {
    return new Promise((resolve, reject) => {
      console.log(`\x1b[2m - Procesando seed '${modelName}'\x1b[0m`)
      let tasks = []
      for (let i in DATA) {
        let data = DATA[i]
        let container = {}
        container[modelName] = {}
        let level = 1
        let task = _createSubmodelTask(sequelize.models[modelName], data, container, modelName, level, sequelize.models)
        tasks.push(task)
      }
      async.waterfall(tasks, (err) => {
        if (err) { return reject(err) } else { resolve(null) }
      })
    })
  }
}

/**
* Indica si un objeto es atributo de un modelo.
* @param {Object} obj Objeto.
* @return {Boolean}
*/
function _isField (obj) {
  if (obj && obj._modelAttribute && (obj._modelAttribute === true)) {
    return true
  }
  return false
}

/**
* Indica si un objeto es atributo con clave foránea..
* @param {Object} obj Objeto.
* @return {Boolean}
*/
function _isForeignKey (obj) {
  if (_isField(obj) && obj.references) {
    return true
  }
  return false
}

/**
* Devuelve una funciton callback que Inserta los registros de un modelo anidado.
* @param {SequelizeModel} MODEL Modelo sequelize.
* @param {Object} data Datos.
* @param {Object[]} container Contenedor de objetos creados.
* @param {String} fieldName Nombre del campo actual.
* @param {Number} level Nivel de anidación.
* @param {SequelizeModel[]} models Lista de modelos.
* @return {Function}
*/
function _createSubmodelTask (MODEL, data, container, fieldName, level, models) {
  let modelName = MODEL.name
  let modelData = {}
  let asyncFunctions = []
  for (let prop in MODEL.attributes) {
    let field = MODEL.attributes[prop]
    if (_isForeignKey(field) && !data[prop]) {
      let modelReference = field.references.model
      container[fieldName][modelReference] = {}
      let task = _createSubmodelTask(
        models[modelReference], data[modelReference], container[fieldName], modelReference, level + 1, models
      )
      asyncFunctions.push(task)
    } else {
      if ((field.primaryKey === true) && !data[prop]) {
        continue
      }
      modelData[prop] = data[prop]
    }
  }
  if (asyncFunctions.length > 0) {
    return (callback) => {
      async.waterfall(asyncFunctions, (err) => {
        if (err) {
          callback(err)
        } else {
          modelData = {}
          for (let prop in MODEL.attributes) {
            let field = MODEL.attributes[prop]
            if (_isForeignKey(field) && !data[prop]) {
              const pk = Object.keys(models[field.references.model].primaryKeys)[0].fieldName
              modelData[prop] = container[fieldName][field.references.model][pk]
            } else {
              if ((field.primaryKey === true) && !data[prop]) {
                continue
              }
              modelData[prop] = data[prop]
            }
          }
          return MODEL.create(modelData).then(result => {
            const pk = Object.keys(MODEL.primaryKeys)[0]
            container[fieldName][pk] = result[pk]
            return MODEL.options.sequelize.query(`ALTER SEQUENCE ${modelName}_${pk}_seq RESTART WITH ${result[pk] + 1}`).then(() => {
              callback(null)
            }).catch(err => {
              callback(err)
            })
          }).catch(err => {
            callback(err)
          })
        }
      })
    }
  } else {
    return (callback) => {
      return MODEL.create(modelData).then(result => {
        const pk = Object.keys(MODEL.primaryKeys)[0]
        container[fieldName][pk] = result[pk]
        return MODEL.options.sequelize.query(`ALTER SEQUENCE ${modelName}_${pk}_seq RESTART WITH ${result[pk] + 1}`).then(() => {
          callback(null)
        }).catch(err => {
          callback(err)
        })
      }).catch(err => {
        callback(err)
      })
    }
  }
}

module.exports = Seed
