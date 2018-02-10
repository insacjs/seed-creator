const chai = require('chai')

global.LIB = `${__dirname}/../`

process.env.DB_USER = 'postgres'
process.env.DB_PASS = '12345678'
process.env.DB_NAME = 'insac_seed'

global.expect = chai.expect
