module.exports = (app) => {
  const DATA = [
    {
      id_rol   : 1,
      nombre   : 'superadmin',
      peso     : 10,
      usuarios : [
        {
          usuario: {
            username : '1000',
            password : '123',
            persona  : {
              nombre    : 'Alex',
              direccion : 'Distrito Sur, La Paz, Av. del poeta #456'
            }
          }
        }
      ]
    },
    {
      id_rol   : 2,
      nombre   : 'admin',
      peso     : 5,
      usuarios : [
        {
          usuario: {
            username : '2000',
            password : '123',
            persona  : {
              nombre        : 'John',
              direccion     : 'Zona Sur, #68',
              administrador : { cargo: 'Encargado del sistema.' }
            }
          }
        }
      ]
    },
    {
      id_rol   : 3,
      nombre   : 'user',
      peso     : 0,
      usuarios : [
        {
          usuario: {
            username : '3000',
            password : '123',
            persona  : {
              nombre    : 'John',
              direccion : 'Zona los valles, #567.'
            }
          }
        },
        {
          usuario: {
            username : '4000',
            password : '123',
            persona  : {
              nombre    : 'Anna',
              direccion : 'Zona de obrajes, #586.'
            }
          }
        }
      ]
    }
  ]

  return DATA
}
