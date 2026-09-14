import { buildScoreboardPayload } from '../server/core.mjs';

function send(res, statusCode, payload) {
  res.status(statusCode).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.send(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    send(res, 405, { message: 'Method not allowed' });
    return;
  }

  const { statusCode, payload } = await buildScoreboardPayload(process.env.BALLDONTLIE_API_KEY);
  send(res, statusCode, payload);
}
