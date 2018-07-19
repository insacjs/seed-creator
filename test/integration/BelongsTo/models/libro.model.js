module.exports = (sequelize, Sequelize) => {
  const MODEL = sequelize.define('libro', {
    id_libro: {
      type          : Sequelize.INTEGER(),
      primaryKey    : true,
      autoIncrement : true
    },
    titulo      : Sequelize.STRING(),
    precio      : Sequelize.FLOAT(),
    descripcion : Sequelize.TEXT(),
    estado      : Sequelize.BOOLEAN()
  }, {
    schema: 'dos'
  })

  MODEL.associate = (models) => {
    const LIBRO = models.libro
    const AUTOR = models.autor

    LIBRO.belongsTo(AUTOR, { as: 'autor',  foreignKey: { name: 'fid_autor', targetKey: 'id_autor', allowNull: false } })
    AUTOR.hasMany(LIBRO,   { as: 'libros', foreignKey: { name: 'fid_autor' } })
  }

  return MODEL
}
