module.exports = (sequelize, Sequelize) => {
  const MODEL = sequelize.define('rol_usuario', {
    id_rol_usuario: { type: Sequelize.INTEGER(), primaryKey: true, autoIncrement: true }
  })

  MODEL.associate = (models) => {
    const ROL_USUARIO = models.rol_usuario
    const ROL         = models.rol
    const USUARIO     = models.usuario

    ROL_USUARIO.belongsTo(ROL, { as: 'rol',      foreignKey: { name: 'fid_rol', targetKey: 'id_rol', allowNull: false } })
    ROL.hasMany(ROL_USUARIO,   { as: 'usuarios', foreignKey: { name: 'fid_rol' } })

    ROL_USUARIO.belongsTo(USUARIO, { as: 'usuario', foreignKey: { name: 'fid_usuario', targetKey: 'id_usuario', allowNull: false } })
    USUARIO.hasMany(ROL_USUARIO,   { as: 'roles',   foreignKey: { name: 'fid_usuario' } })
  }

  return MODEL
}
