module.exports = (app) => {
  const DATA = [
    {
      titulo      : 'El gato negro',
      precio      : 11.99,
      descripcion : 'Cuento de terror',
      estado      : true,
      autor       : {
        id_autor : 10,
        nombre   : 'Edgar Allan Poe',
        ci       : 111111,
        tipo     : 'NACIONAL',
        telefono : ['22464756', '78675867']
      }
    },
    {
      titulo    : 'El cuervo',
      precio    : 15.99,
      fid_autor : 10
    },
    {
      titulo : 'Juego de tronos',
      precio : 49.50,
      tipo   : 'INTERNACIONAL',
      autor  : {
        nombre   : 'George R. Martin',
        ci       : 222222,
        telefono : ['22464756', '78675867']
      }
    }
  ]

  return DATA
}
