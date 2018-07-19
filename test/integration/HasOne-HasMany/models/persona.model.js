module.exports = (sequelize, Sequelize) => {
  const MODEL = sequelize.define('persona', {
    id_persona : { type: Sequelize.INTEGER(), primaryKey: true, autoIncrement: true },
    nombre     : Sequelize.STRING(),
    direccion  : Sequelize.TEXT()
  }, {
    schema: 'auth'
  })

  MODEL.associate = (models) => {
    const PERSONA = models.persona
    const USUARIO = models.usuario

    PERSONA.belongsTo(USUARIO, { as: 'usuario', foreignKey: { name: 'fid_usuario', targetKey: 'id_usuario', allowNull: false } })
    USUARIO.hasOne(PERSONA,    { as: 'persona', foreignKey: { name: 'fid_usuario' } })
  }

  return MODEL
}
