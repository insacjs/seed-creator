# Insac Seed
Inserta registros en la base de datos, utilizando Sequelize.

# Características
- Soporta registros anidados.

# Ejemplo 1
``` js
const { Seed } = require('insac-seed')

Seed.create(sequelize, 'libro', [
  {
    titulo: 'El gato negro',
    precio: 11.99,
    autor: {
      nombre: 'Edgar Allan Poe'
    }
  },
  {
    titulo: 'El cuervo',
    precio: 15.99,
    autor: {
      nombre: 'Edgar Allan Poe'
    }
  }
])
```
