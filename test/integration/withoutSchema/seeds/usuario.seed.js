module.exports = (app) => {
  const DATA = [
    {
      username : '1000',
      password : '123',
      roles    : [{ rol: { id_rol: 1, nombre: 'superadmin', peso: 10 } }],
      persona  : {
        nombre    : 'Alex',
        direccion : 'Distrito Sur, La Paz, Av. del poeta #456'
      }
    },
    {
      username : '2000',
      password : '123',
      roles    : [{ rol: { id_rol: 2, nombre: 'admin', peso: 5 } }],
      persona  : {
        nombre        : 'John',
        direccion     : 'Zona Sur, #68',
        administrador : { cargo: 'Encargado del sistema.' }
      }
    },
    {
      username : '3000',
      password : '123',
      roles    : [{ rol: { id_rol: 3, nombre: 'user', peso: 0 } }],
      persona  : {
        nombre    : 'John',
        direccion : 'Zona los valles, #567.'
      }
    },
    {
      username : '4000',
      password : '123',
      roles    : [{ fid_rol: 3 }],
      persona  : {
        nombre    : 'Anna',
        direccion : 'Zona de obrajes, #586.'
      }
    }
  ]

  return DATA
}
