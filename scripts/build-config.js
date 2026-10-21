// ============================================
// Gera config.browser.js a partir de supabase-config.js
// Uso: npm run build-config
// ============================================
const fs = require('fs');
const path = require('path');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../supabase-config');

if (!SUPABASE_URL.startsWith('http') || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('COLE_AQUI')) {
    console.error('❌ Edite supabase-config.js primeiro com a URL e a chave anon do seu projeto Supabase.');
    process.exit(1);
}

const out = `// Gerado automaticamente por scripts/build-config.js — não edite à mão.
window.SUPABASE_URL = ${JSON.stringify(SUPABASE_URL)};
window.SUPABASE_ANON_KEY = ${JSON.stringify(SUPABASE_ANON_KEY)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'config.browser.js'), out);
console.log('✅ config.browser.js gerado com sucesso.');
