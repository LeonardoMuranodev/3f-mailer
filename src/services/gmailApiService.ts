import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { config } from '../config/env.js';

/**
 * Cliente OAuth2 reutilizable para Gmail API.
 */
function getOAuth2Client() {
  const { clientId, clientSecret, refreshToken } = config.oauth.dpim3f3;
  if (!clientId || !refreshToken) {
    throw new Error('Credenciales OAuth2 de Gmail API no configuradas para dpim3f3');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

/**
 * Verifica si una cuenta de correo está configurada para despachar
 * a través de la API oficial de Gmail con OAuth 2.0.
 */
export function esCuentaOAuth(email: string): boolean {
  if (!email) return false;
  const targetUser = config.oauth.dpim3f3.user.toLowerCase();
  const currentEmail = email.toLowerCase().trim();
  const tieneCredenciales = Boolean(config.oauth.dpim3f3.clientId && config.oauth.dpim3f3.refreshToken);

  return currentEmail === targetUser && tieneCredenciales;
}

/**
 * Compila un mensaje con Nodemailer (respetando HTML, adjuntos, tracking pixel y Reply-To)
 * y lo transmite de forma nativa a través de la API REST de Gmail (users.messages.send).
 */
export async function enviarConGmailApi(
  mailOptions: nodemailer.SendMailOptions
): Promise<{ response: string; messageId: string }> {
  const oauth2Client = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // 1. Compilar el mensaje MIME completo en memoria usando Nodemailer
  const memoryTransporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
  });

  const compiled = await memoryTransporter.sendMail(mailOptions);
  const rawMimeBuffer = compiled.message as Buffer;

  // 2. Codificar en Base64URL según los requisitos de Google API
  const base64Url = rawMimeBuffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 3. Enviar vía Gmail REST API
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: base64Url,
    },
  });

  const messageId = res.data.id || '';
  const response = `Gmail API 200 OK (id: ${messageId}, threadId: ${res.data.threadId})`;

  return {
    response,
    messageId,
  };
}
