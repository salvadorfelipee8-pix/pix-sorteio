import { prisma as _prismaType } from '@/lib/prisma'
type PrismaClient = typeof _prismaType
// lib/classes/auth-service.ts
// ⚠️ IMPACTO: Alterações aqui afetam CotaService e PagamentoService (usuário autenticado)

import bcrypt from 'bcryptjs'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { AuditoriaService } from './auditoria-service'

const SALT_ROUNDS    = 12
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? ''

export interface CadastrarDTO {
  nome: string
  email: string
  cpf: string
  telefone?: string
  dataNascimento: Date
  senha: string
  lgpdAceito: boolean
  ipAddress?: string
}

export class AuthService {
  private db: PrismaClient
  private auditoria: AuditoriaService

  constructor(db: PrismaClient, auditoria: AuditoriaService) {
    this.db = db
    this.auditoria = auditoria
  }

  async cadastrar(dto: CadastrarDTO) {
    // Validações
    if (!dto.lgpdAceito) {
      throw new Error('Aceite dos termos LGPD é obrigatório.')
    }

    if (!this.validarCPF(dto.cpf)) {
      throw new Error('CPF inválido.')
    }

    if (!this.validarIdade(dto.dataNascimento)) {
      throw new Error('É necessário ter 18 anos ou mais para participar.')
    }

    const cpfLimpo = dto.cpf.replace(/\D/g, '')

    // Verificar duplicidade
    const existente = await this.db.usuario.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          { cpf: this.criptografar(cpfLimpo) },
        ],
      },
    })

    if (existente) {
      throw new Error('Email ou CPF já cadastrado.')
    }

    const senhaHash = await bcrypt.hash(dto.senha, SALT_ROUNDS)

    const usuario = await this.db.usuario.create({
      data: {
        nome:          dto.nome.trim(),
        email:         dto.email.toLowerCase().trim(),
        cpf:           this.criptografar(cpfLimpo),
        telefone:      dto.telefone,
        dataNascimento: dto.dataNascimento,
        senhaHash,
        lgpdAceito:    true,
        lgpdAceitoEm:  new Date(),
        role:          "PARTICIPANTE" as any,
      },
    })

    await this.auditoria.registrar({
      usuarioId:  usuario.id,
      acao:       'USUARIO_CADASTRADO',
      entidade:   'Usuario',
      entidadeId: usuario.id,
      payload:    { email: usuario.email },
      ipAddress:  dto.ipAddress,
    })

    return { id: usuario.id, nome: usuario.nome, email: usuario.email }
  }

  async autenticar(email: string, senha: string, ipAddress?: string) {
    const usuario = await this.db.usuario.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!usuario || !usuario.senhaHash) {
      throw new Error('Email ou senha incorretos.')
    }

    if (!usuario.ativo) {
      throw new Error('Conta desativada. Entre em contato com o suporte.')
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash)
    if (!senhaCorreta) {
      throw new Error('Email ou senha incorretos.')
    }

    await this.auditoria.registrar({
      usuarioId:  usuario.id,
      acao:       'LOGIN',
      entidade:   'Usuario',
      entidadeId: usuario.id,
      ipAddress,
    })

    return {
      id:     usuario.id,
      nome:   usuario.nome,
      email:  usuario.email,
      role:   usuario.role,
    }
  }

  // Validação de CPF (algoritmo oficial)
  validarCPF(cpf: string): boolean {
    const limpo = cpf.replace(/\D/g, '')
    if (limpo.length !== 11) return false
    if (/^(\d)\1{10}$/.test(limpo)) return false

    let soma = 0
    for (let i = 0; i < 9; i++) soma += parseInt(limpo[i]) * (10 - i)
    let resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(limpo[9])) return false

    soma = 0
    for (let i = 0; i < 10; i++) soma += parseInt(limpo[i]) * (11 - i)
    resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    return resto === parseInt(limpo[10])
  }

  private validarIdade(dataNascimento: Date): boolean {
    const hoje = new Date()
    const idade = hoje.getFullYear() - dataNascimento.getFullYear()
    const m = hoje.getMonth() - dataNascimento.getMonth()
    return idade > 18 || (idade === 18 && m >= 0)
  }

  // AES-256 para CPF em repouso (LGPD)
  private criptografar(texto: string): string {
    const iv = randomBytes(16)
    const key = Buffer.from(ENCRYPTION_KEY, 'hex')
    const cipher = createCipheriv('aes-256-cbc', key, iv)
    const encrypted = Buffer.concat([cipher.update(texto), cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  descriptografar(texto: string): string {
    const [ivHex, encHex] = texto.split(':')
    const iv  = Buffer.from(ivHex, 'hex')
    const key = Buffer.from(ENCRYPTION_KEY, 'hex')
    const decipher = createDecipheriv('aes-256-cbc', key, iv)
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encHex, 'hex')),
      decipher.final(),
    ])
    return decrypted.toString()
  }
}
