const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'fcldc-login-logs';
const BLOB_KEY = 'records.json';
const MAX_RECORDS = 1000;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

function sanitizeRecord(input) {
  const username = String(input.username || input.user || '').trim().slice(0, 80);
  const action = String(input.action || '').trim().toUpperCase();
  const timestamp = input.timestamp || input.time || new Date().toISOString();

  if (!username) {
    throw new Error('Username is required.');
  }

  if (!['LOGIN', 'LOGOUT'].includes(action)) {
    throw new Error('Action must be LOGIN or LOGOUT.');
  }

  const date = new Date(timestamp);
  return {
    username,
    user: username,
    action,
    timestamp: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
    time: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
  };
}

async function getRecords(store) {
  const records = await store.get(BLOB_KEY, { type: 'json' });
  return Array.isArray(records) ? records : [];
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const store = getStore(STORE_NAME);

    if (event.httpMethod === 'GET') {
      const records = await getRecords(store);
      return json(200, { ok: true, records });
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const record = sanitizeRecord(payload);
      const records = await getRecords(store);
      records.unshift(record);
      const trimmed = records.slice(0, MAX_RECORDS);
      await store.setJSON(BLOB_KEY, trimmed);
      return json(200, { ok: true, saved: record, records: trimmed });
    }

    if (event.httpMethod === 'DELETE') {
      await store.setJSON(BLOB_KEY, []);
      return json(200, { ok: true, records: [] });
    }

    return json(405, { ok: false, error: 'Method not allowed.' });
  } catch (error) {
    return json(500, { ok: false, error: error.message || 'Server error.' });
  }
};
