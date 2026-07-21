import type { Application, Request, Response } from 'express';
import appModule from '../server/src/app.js';
import { seed } from '../server/src/scripts/seedData.js';

const app = (
  (appModule as unknown as { default?: Application }).default ||
  (appModule as unknown as Application)
);

let preparation: Promise<void> | undefined;

const prepareDemo = () => {
  preparation ||= seed().catch((error) => {
    preparation = undefined;
    throw error;
  });
  return preparation;
};

export default async function handler(request: Request, response: Response) {
  try {
    await prepareDemo();
    return app(request, response);
  } catch (error) {
    console.error('Failed to prepare the Moodie demo:', error);
    response.statusCode = 503;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ error: 'Moodie is still preparing the demo. Please try again.' }));
    return response;
  }
}
