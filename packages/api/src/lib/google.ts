import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';

const client = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  `${config.API_URL}/auth/google/callback`
);

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export const googleAuthService = {
  getAuthUrl() {
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
    });
  },

  async getProfile(code: string): Promise<GoogleProfile> {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new Error('Google account must have an email');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || 'Google User',
      picture: payload.picture,
    };
  },
};
