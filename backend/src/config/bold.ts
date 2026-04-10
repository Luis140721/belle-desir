import { env } from './env';

export const BOLD_API_URL = 'https://integrations.api.bold.co';

export const getBoldHeaders = () => ({
  Authorization: `x-api-key ${env.BOLD_API_KEY}`,
  'Content-Type': 'application/json',
});
