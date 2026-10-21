// ============================================
// Carona Bairro - Servidor estático
// ============================================
// O banco de dados e o login ficam no Supabase (veja supabase-schema.sql
// e supabase-config.js). Este servidor apenas serve os arquivos do site.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`Carona Bairro rodando em http://localhost:${PORT}`);
});
