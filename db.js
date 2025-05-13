const Database = require('better-sqlite3');
const db = new Database('pets.db', { verbose: console.log });

module.exports = db;
