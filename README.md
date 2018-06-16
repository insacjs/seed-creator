# Seed Creator

Cuando se crea una nueva base de datos, casi siempre es necesario insertar los registros iniciales, especialmente en entornos de desarrollo y pruebas, porque para probar ciertas funcionalidades del sistema, es necesario contar con datos de prueba. Es ahí donde entran los seeders, son aquellos archivos encargados de insertar registros directamente en la base de datos.

La forma tradicional de insertar estos registros es creando para cada tabla un archivo diferente con la fecha de creación incluida en el nombre del fichero, esto permite insertarlos ordenadamente. Sin embargo, este trabajo se complica cuando se tienen registros referenciados, haciendo mas dificil la creación de estos.

Esta librería permite crear registros utilizando instancias de modelos Sequelize. Utiliza un sistema de inserción de datos secuencial, con la que es posible detectar automáticamente las relaciones entre las tablas y crear los registros de manera ordenada incluso haciendo uso de un solo fichero.

## Características

- Puede insertar un conjunto de registros **anidados**.
- Soporta modelos definidos con **esquemas**.
- Las claves primarias son opcionales siempre y cuando sean **autoincrementables**.
- La inserción es **secuencial**, por lo tanto, al insertar el segundo
  segistro es posible enviar los resultados del primer registro.
- Se puede **restringir** la inserción de registros mediante los esquemas.

## Instalación

Para instalar sobre un proyecto, ejecutar el siguiente comando:

$ `npm install --save seed-creator`

## Ejemplo

Inserción de registros en las tablas relacionadas `libro` y `autor`, desde un solo fichero.

``` js
const Seed = require('seed-creator')

const LIBRO = sequelize.define('libro', { ... }, { schema: 'uno' })
const AUTOR = sequelize.define('autor', { ... }, { schema: 'dos' })

LIBRO.belongsTo(AUTOR, { as: 'autor', foreignKey: { name: 'fid_autor', targetKey: 'id_autor' } })

const options = { schemas: ['uno', 'dos'] }

Seed.create(LIBRO, [
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
], options)
```
