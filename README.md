# Seed Creator

Inserta registros en la base de datos, utilizando Sequelize.

# Características

- Inserta una **lista** de registros.
- Soporta registros **anidados**.
- Soporta modelos definidos con **esquemas**.
- Las claves primarias son opcionales siempre y cuando sean **autoincrementables**.
- La inserción es **secuencial**, por lo tanto, al insertar el segundo
  segistro es posible enviar los resultados del primer registro.

# Instalación

Para instalar sobre un proyecto, ejecutar el siguiente comando:

$ `npm install --save seed-creator`

# Ejemplos

## Ejemplo 1

Inserta datos anidados.

``` js
const Seed = require('seed-creator')

Seed.create(sequelize.models.libro, [
  {
    titulo : 'El gato negro',
    precio : 11.99,
    autor  : {
      id_autor : 10,
      nombre   : 'Edgar Allan Poe'
    }
  },
  {
    titulo    : 'El cuervo',
    precio    : 15.99,
    fid_autor : 10
  }
])
```
