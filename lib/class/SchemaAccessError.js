/**
* Clase SchemaAccessError
*/
class SchemaAccessError extends Error {
  /**
  * Crea una instancia.
  * @param {String} message - Detalle del error.
  */
  constructor (message, parent) {
    super(message)
    /**
    * Nombre del objeto
    * @type {String}
    */
    this.name = SchemaAccessError.NAME

    /**
    * Error padre.
    * @type {Error}
    */
    this.parent = parent
  }
}

SchemaAccessError.NAME   = 'SchemaAccessError'

module.exports = SchemaAccessError
