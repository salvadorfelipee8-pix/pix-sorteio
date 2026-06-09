// lib/classes/notificacao-service.ts
// SorteioMax — Serviço de notificações por email
// IMPACTO: Chamado por PagamentoService (webhook) e SorteioService (resultado)

import nodemailer from 'nodemailer'

export interface NotificacaoCotaConfirmada {
  email: string
  nome: string
  tituloSorteio: string
  numerosCotas: number[]
  valorTotal: number
  dataApuracao: Date
  slugSorteio: string
}

export interface NotificacaoResultado {
  email: string
  nome: string
  tituloSorteio: string
  cotaVencedora: number
  numerosCotas: number[]
  ganhou: boolean
  premioDescricao?: string
}

export class NotificacaoService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT ?? '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER ?? process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS
      }
    })
  }

  async enviarConfirmacaoCompra(data: NotificacaoCotaConfirmada): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pix-sorteio.vercel.app'
    const numerosFormatados = data.numerosCotas
      .map((n: number) => `<span style="display:inline-block;background:#FFD700;color:#000;font-weight:bold;padding:4px 10px;border-radius:6px;margin:3px;font-size:16px;">#${String(n).padStart(4, '0')}</span>`)
      .join(' ')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#0D0D0D;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:#111111;border:1px solid #FFD700;border-radius:12px;overflow:hidden;"><div style="background:#FFD700;padding:32px;text-align:center;"><h1 style="margin:0;color:#000;font-size:28px;font-weight:900;letter-spacing:2px;">SORTEIOMAX</h1><p style="margin:8px 0 0;color:#000;font-size:14px;">Plataforma de Sorteios PIX Premium</p></div><div style="padding:40px 32px;"><h2 style="color:#FFD700;margin:0 0 8px;">Pagamento Confirmado!</h2><p style="color:#ccc;font-size:16px;margin:0 0 24px;">Ola, <strong style="color:#fff">${data.nome}</strong>! Suas cotas foram confirmadas.</p><div style="background:#0D0D0D;border:1px solid #333;border-radius:8px;padding:24px;margin-bottom:24px;"><p style="color:#999;font-size:12px;margin:0 0 4px;text-transform:uppercase;">Sorteio</p><p style="color:#fff;font-size:20px;font-weight:bold;margin:0 0 16px;">${data.tituloSorteio}</p><p style="color:#999;font-size:12px;margin:0 0 8px;text-transform:uppercase;">Seus numeros da sorte</p><div style="margin-bottom:16px;">${numerosFormatados}</div><p style="color:#999;font-size:12px;margin:0 0 4px;text-transform:uppercase;">Valor Pago</p><p style="color:#00FFA3;font-size:18px;font-weight:bold;margin:0 0 12px;">R$ ${data.valorTotal.toFixed(2).replace('.', ',')}</p><p style="color:#999;font-size:12px;margin:0 0 4px;text-transform:uppercase;">Data do Sorteio</p><p style="color:#fff;font-size:18px;font-weight:bold;margin:0;">${data.dataApuracao.toLocaleDateString('pt-BR')}</p></div><div style="text-align:center;"><a href="${appUrl}/sorteios/${data.slugSorteio}" style="display:inline-block;background:#FFD700;color:#000;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;">Ver meu Sorteio</a></div></div><div style="padding:24px 32px;border-top:1px solid #222;text-align:center;"><p style="color:#555;font-size:12px;margin:0;">Sorteio baseado na Loteria Federal da Caixa Economica Federal.</p></div></div></body></html>`

    await this.enviar({
      to: data.email,
      subject: `${data.numerosCotas.length} cota(s) confirmada(s) — ${data.tituloSorteio}`,
      html
    })
  }

  async enviarResultado(data: NotificacaoResultado): Promise<void> {
    const corStatus = data.ganhou ? '#FFD700' : '#00FFA3'
    const titulo = data.ganhou ? 'PARABENS! Voce ganhou!' : 'Resultado do Sorteio'
    const mensagem = data.ganhou
      ? `Sua cota <strong style="color:#FFD700">#${String(data.cotaVencedora).padStart(4, '0')}</strong> foi a vencedora! Entraremos em contato em breve.`
      : `A cota vencedora foi <strong style="color:#FFD700">#${String(data.cotaVencedora).padStart(4, '0')}</strong>. Obrigado por participar!`

    const numerosFormatados = data.numerosCotas
      .map((n: number) => {
        const venceu = n === data.cotaVencedora
        const bg = venceu ? '#FFD700' : '#222'
        const cor = venceu ? '#000' : '#888'
        return `<span style="display:inline-block;background:${bg};color:${cor};font-weight:bold;padding:4px 10px;border-radius:6px;margin:3px;font-size:14px;">#${String(n).padStart(4, '0')}</span>`
      })
      .join(' ')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#0D0D0D;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background:#111111;border:1px solid ${corStatus};border-radius:12px;overflow:hidden;"><div style="background:${corStatus};padding:32px;text-align:center;"><h1 style="margin:0;color:#000;font-size:28px;font-weight:900;letter-spacing:2px;">SORTEIOMAX</h1></div><div style="padding:40px 32px;"><h2 style="color:${corStatus};margin:0 0 8px;">${titulo}</h2><p style="color:#ccc;font-size:16px;margin:0 0 24px;">Ola, <strong style="color:#fff">${data.nome}</strong>! ${mensagem}</p><div style="background:#0D0D0D;border:1px solid #333;border-radius:8px;padding:24px;"><p style="color:#999;font-size:12px;margin:0 0 4px;text-transform:uppercase;">Sorteio</p><p style="color:#fff;font-size:20px;font-weight:bold;margin:0 0 16px;">${data.tituloSorteio}</p>${data.ganhou && data.premioDescricao ? `<p style="color:#999;font-size:12px;margin:0 0 4px;text-transform:uppercase;">Premio</p><p style="color:#FFD700;font-size:18px;font-weight:bold;margin:0 0 16px;">${data.premioDescricao}</p>` : ''}<p style="color:#999;font-size:12px;margin:0 0 8px;text-transform:uppercase;">Seus numeros</p><div>${numerosFormatados}</div></div></div><div style="padding:24px 32px;border-top:1px solid #222;text-align:center;"><p style="color:#555;font-size:12px;margin:0;">Sorteio baseado na Loteria Federal da Caixa Economica Federal.</p></div></div></body></html>`

    await this.enviar({
      to: data.email,
      subject: data.ganhou
        ? `VOCE GANHOU — ${data.tituloSorteio}`
        : `Resultado do sorteio — ${data.tituloSorteio}`,
      html
    })
  }

  private async enviar(opts: { to: string; subject: string; html: string }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"SorteioMax" <${process.env.EMAIL_FROM ?? 'noreply@sorteiomax.com'}>`,
        to: opts.to,
        subject: opts.subject,
        html: opts.html
      })
    } catch (err: any) {
      console.error('[NotificacaoService] Erro ao enviar email:', err)
    }
  }
}
