import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';

const prisma = new PrismaClient();

async function run() {
  try {
    const account = await prisma.account.findFirst({
      where: { provider: 'google' },
      select: { access_token: true, refresh_token: true, userId: true },
    });

    if (!account) {
      console.log('No Google account found in database.');
      return;
    }

    console.log('Found account for user:', account.userId);
    console.log('Access token length:', account.access_token?.length);
    console.log('Refresh token length:', account.refresh_token?.length);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.AUTH_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    console.log('Attempting to fetch Gmail messages...');
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1,
    });

    console.log('Success! Messages:', listRes.data.messages);
  } catch (error: any) {
    console.error('\n=== GMAIL API ERROR ===');
    console.error(error.message);
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

run();
