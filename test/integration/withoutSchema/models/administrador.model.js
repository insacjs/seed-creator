module.exports = (sequelize, Sequelize) => {
  const MODEL = sequelize.define('administrador', {
    id_administrador : { type: Sequelize.INTEGER(), primaryKey: true, autoIncrement: true },
    cargo            : Sequelize.STRING()
  })

  MODEL.associate = (models) => {
    const ADMINISTRADOR = models.administrador
    const PERSONA       = models.persona

    ADMINISTRADOR.belongsTo(PERSONA, { as: 'persona',       foreignKey: { name: 'fid_persona', targetKey: 'id_persona', allowNull: false } })
    PERSONA.hasOne(ADMINISTRADOR,    { as: 'administrador', foreignKey: { name: 'fid_persona' } })
  }

  return MODEL
}
