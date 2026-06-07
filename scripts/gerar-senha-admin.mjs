// scripts/gerar-senha-admin.mjs
// Rode: node scripts/gerar-senha-admin.mjs SuaSenhaAqui

import bcrypt from 'bcryptjs'

const senha = process.argv[2]

if (!senha) {
  console.error('Uso: node scripts/gerar-senha-admin.mjs <SuaSenha>')
  process.exit(1)
}

const hash = await bcrypt.hash(senha, 12)

console.log('\n✅ Hash gerado com sucesso!\n')
console.log('Adicione estas variáveis no Vercel (Settings > Environment Variables):\n')
console.log(`ADMIN_EMAIL=admin@sorteiomax.com`)
console.log(`ADMIN_PASSWORD_HASH=${hash}`)
console.log(`ADMIN_JWT_SECRET=${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}\n`)
console.log('⚠️  Guarde a senha original em local seguro. O hash não pode ser revertido.')
