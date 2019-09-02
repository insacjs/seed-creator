module.exports = (sequelize, Sequelize) => {
  const MODEL = sequelize.define('rol', {
    id_rol : { type: Sequelize.INTEGER(), primaryKey: true, autoIncrement: true },
    nombre : Sequelize.STRING(),
    peso   : Sequelize.INTEGER()
  })

  MODEL.associate = (models) => {}

  return MODEL
}
