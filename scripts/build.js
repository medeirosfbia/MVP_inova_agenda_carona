// ============================================
// Carona Bairro - build para a Vercel (e para rodar local)
// ============================================
// A URL e a chave anon do Supabase ficam SEMPRE escondidas no .env (local)
// ou nas Environment Variables da Vercel (nuvem). Este script:
//   1. lê SUPABASE_URL / SUPABASE_ANON_KEY do ambiente;
//   2. se não encontrar no ambiente, tenta carregar o arquivo .env local
//      (simples parser caseiro — sem dependências externas);
//   3. gera public/config.browser.js com os valores já embutidos, que é o
//      único arquivo público servido pelo site.
// Na Vercel isso roda em "Build Command" e o resultado fica versionado
// apenas na pasta .vercel/output — o .env nunca vai para o git nem para o cliente.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ---------- carrega .env local, se existir (não pisa variáveis já definidas) ----------
function loadDotEnv() {
    const envPath = path.join(ROOT, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        // remove aspas simples/duplas ao redor do valor
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
    }
}
loadDotEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes('SEU-PROJETO') || SUPABASE_ANON_KEY.includes('cole_a_chave')) {
    console.error(
        '❌ Variáveis SUPABASE_URL e SUPABASE_ANON_KEY não encontradas.\n' +
        '   Local : copie .env.example para .env e preencha.\n' +
        '   Vercel: Project > Settings > Environment Variables > adicione as duas.'
    );
    process.exit(1);
}

// ---------- gera public/config.browser.js ----------
const publicDir = path.join(ROOT, 'public');
fs.mkdirSync(publicDir, { recursive: true });

const banner = '// Gerado automaticamente por scripts/build.js a partir de variáveis de ambiente.\n' +
               '// NÃO edite à mão e NÃO faça commit (está no .gitignore).\n';
const out = banner +
    `window.SUPABASE_URL = ${JSON.stringify(SUPABASE_URL)};\n` +
    `window.SUPABASE_ANON_KEY = ${JSON.stringify(SUPABASE_ANON_KEY)};\n`;

fs.writeFileSync(path.join(publicDir, 'config.browser.js'), out);
console.log('✅ public/config.browser.js gerado (fonte: ' +
    (process.env.VERCEL ? 'variáveis da Vercel' : '.env local') + ').');
