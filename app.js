require('dotenv').config(); // Carrega variáveis do .env
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/adoption-form', async (req, res) => {
  const {
    nome,
    email,
    dataNascimento,
    profissao,
    telefone,
    endereco,
    nomeCao
  } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_REMETENTE,
      pass: process.env.EMAIL_SENHA
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_REMETENTE,
    to: process.env.EMAIL_RECEBEDOR,
    subject: 'Novo pedido de adoção',
    text: `
📋 NOVO FORMULÁRIO DE ADOÇÃO

Nome: ${nome}
Email: ${email}
Data de Nascimento: ${dataNascimento}
Profissão: ${profissao}
Telefone/WhatsApp: ${telefone}
Endereço: ${endereco}
Nome do cãozinho: ${nomeCao}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Formulário enviado com sucesso!' });
    console.log('Formulário enviado com sucesso!')
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao enviar e-mail.' });
  }
});
/*
app.get('/ping', (req, res) => {
  res.json({ message: 'Pong! Backend funcionando perfeitamente!' });
});
*/
// Cadastro
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Campos obrigatórios' });

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    stmt.run(name, email, hashedPassword);
    res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      res.status(409).json({ error: 'E-mail já cadastrado' });
    } else {
      res.status(500).json({ error: 'Erro no servidor' });
    }
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email);

  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Senha incorreta' });

  // Remover a senha antes de retornar
  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({ user: userWithoutPassword });
});


app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, cpf, endereco, celular, nascimento } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE users
      SET name = ?, email = ?, cpf = ?, endereco = ?, celular = ?, nascimento = ?
      WHERE id = ?
    `);
    stmt.run(name, email, cpf, endereco, celular, nascimento, id);

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    const { password, ...userWithoutPassword } = updatedUser;

    res.status(200).json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

app.put('/change-password/:id', async (req, res) => {
  const { id } = req.params; // Aqui está o id do usuário
  console.log(`Requisição recebida para mudar senha do usuário com ID: ${id}`);
  const { currentPassword, newPassword } = req.body;

  // Corrigir a variável userId para id
  console.log(`Recebendo PUT para /change-password/${id}`); // Aqui também deve ser ${id}, não ${userId}

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }

  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(id);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Senha atual incorreta' });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const updateStmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
  updateStmt.run(hashedNewPassword, id);

  return res.status(200).json({ message: 'Senha atualizada com sucesso!' });
});




app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
