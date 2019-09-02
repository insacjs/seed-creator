module.exports = (sequelize, Sequelize) => {
  const MODEL = sequelize.define('usuario', {
    id_usuario : { type: Sequelize.INTEGER(), primaryKey: true, autoIncrement: true },
    username   : Sequelize.STRING(),
    password   : Sequelize.STRING()
  })

  MODEL.associate = (models) => {}

  return MODEL
}
