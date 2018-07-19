module.exports = (sequelize, Sequelize) => {
  const MODEL = sequelize.define('autor', {
    id_autor: {
      type          : Sequelize.INTEGER(),
      primaryKey    : true,
      autoIncrement : true
    },
    nombre : Sequelize.STRING(),
    ci     : Sequelize.INTEGER(),
    tipo   : Sequelize.ENUM(['NACIONAL', 'INTERNACIONAL'])
  }, {
    schema: 'uno'
  })

  return MODEL
}
