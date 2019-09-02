const chai = require('chai')

global.LIB = `${__dirname}/../`

process.env.DB_USER = 'postgres'
process.env.DB_PASS = 'postgres'
process.env.DB_NAME = 'insac_seed'

global.expect = chai.expect
