const db = require('./db');

db.exec(`
  DROP TABLE IF EXISTS animals;
  DROP TABLE IF EXISTS categories;
  DROP TABLE IF EXISTS users;

  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    cpf TEXT,
    endereco TEXT,
    celular TEXT,
    nascimento TEXT
  );

  CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    sexo TEXT NOT NULL,
    peso REAL,
    pelagem TEXT,
    nascimento TEXT,
    raca TEXT,
  );

`);

const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
['Cachorro', 'Gato', 'Coelho'].forEach(name => insertCategory.run(name));

const insertPet = db.prepare(`
  INSERT INTO animals (nome, sexo, peso, pelagem, nascimento, raca)
  VALUES (?, ?, ?, ?, ?, ?)
`);

console.log('✅ Banco populado!');
