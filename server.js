// ============================================
// Carona Bairro - Servidor estático local (dev)
// ============================================
// O banco de dados e o login ficam no Supabase. Este servidor apenas serve a
// pasta public/ para desenvolvimento local. Na Vercel este arquivo não é
// usado: a pasta public/ é servida como site estático automaticamente.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Carona Bairro rodando em http://localhost:${PORT}`);
});
