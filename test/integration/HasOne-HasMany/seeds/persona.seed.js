module.exports = (app) => {
  const DATA = [
    {
      nombre    : 'Alex',
      direccion : 'Distrito Sur, La Paz, Av. del poeta #456',
      usuario   : {
        username : '1000',
        password : '123',
        roles    : [{ rol: { id_rol: 1, nombre: 'superadmin', peso: 10 } }]
      }
    },
    {
      nombre    : 'John',
      direccion : 'Zona Sur, #68',
      usuario   : {
        username : '2000',
        password : '123',
        roles    : [{ rol: { id_rol: 2, nombre: 'admin', peso: 5 } }]
      },
      administrador: { cargo: 'Encargado del sistema.' }
    },
    {
      nombre    : 'John',
      direccion : 'Zona los valles, #567.',
      usuario   : {
        username : '3000',
        password : '123',
        roles    : [{ rol: { id_rol: 3, nombre: 'user', peso: 0 } }]
      }
    },
    {
      nombre    : 'Anna',
      direccion : 'Zona de obrajes, #586.',
      usuario   : {
        username : '4000',
        password : '123',
        roles    : [{ fid_rol: 3 }]
      }
    }
  ]

  return DATA
}
