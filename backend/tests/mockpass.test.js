process.env.NODE_ENV = 'test';
process.env.MOCKPASS_PORT = '5157';
process.env.MOCKPASS_INTERNAL_URL = 'http://127.0.0.1:5157';
process.env.MOCKPASS_PUBLIC_URL = 'http://127.0.0.1:5157';
process.env.MOCKPASS_NRIC = 'S9812382B';
process.env.SHOW_LOGIN_PAGE = 'false';

const assert = require('assert');
const apiApp = require('../server');
const { app: mockpassApp } = require('@opengovsg/mockpass');

const decodeHtml = (value) => value
  .replace(/&amp;/g, '&')
  .replace(/&#x2F;/g, '/')
  .replace(/&#x3D;/g, '=')
  .replace(/&#x3A;/g, ':')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"');

async function runMockPassTest() {
  console.log('--- RUNNING LIVE MOCKPASS INTEGRATION TEST ---');
  const apiServer = apiApp.listen(5100, '127.0.0.1');
  const mockpassServer = mockpassApp.listen(5157, '127.0.0.1');
  let cookie = '';

  const request = async (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (cookie) headers.Cookie = cookie;
    const response = await fetch(url, { ...options, headers, redirect: 'manual' });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return response;
  };

  try {
    const start = await fetch(
      `http://127.0.0.1:5100/api/auth/mockpass/start?returnUrl=${encodeURIComponent('frontend://mockpass')}`
    ).then((response) => response.json());
    assert.strictEqual(start.provider, '@opengovsg/mockpass');

    let currentUrl = start.authorizationUrl;
    let response;
    for (let hop = 0; hop < 6; hop += 1) {
      response = await request(currentUrl);
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      currentUrl = new URL(response.headers.get('location'), currentUrl).toString();
    }
    assert.strictEqual(response.status, 200, 'MockPass consent page should load');

    const html = await response.text();
    const consentBody = new URLSearchParams();
    const inputPattern = /<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"/g;
    for (const match of html.matchAll(inputPattern)) {
      consentBody.set(match[1], decodeHtml(match[2]));
    }
    consentBody.set('decision', 'allow');

    response = await request('http://127.0.0.1:5157/consent/oauth2/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: consentBody,
    });
    assert.strictEqual(response.status, 302, 'Consent should return an authorization code');

    const apiCallback = new URL(response.headers.get('location'), 'http://127.0.0.1:5157').toString();
    response = await request(apiCallback);
    assert.strictEqual(response.status, 302, 'API callback should return to the app');

    const appCallback = new URL(response.headers.get('location'));
    const sessionId = appCallback.searchParams.get('session');
    assert(sessionId, 'App callback should contain a one-time session');

    const profile = await fetch(`http://127.0.0.1:5100/api/auth/mockpass/session/${sessionId}`)
      .then((result) => result.json());
    assert.strictEqual(profile.authProvider, '@opengovsg/mockpass');
    assert.strictEqual(profile.authMethod, 'MOCKPASS_MYINFO_V3');
    assert.strictEqual(profile.user.verified, true);
    assert.strictEqual(profile.user.name, 'FREYA LIM GUO EN', 'Freya should be the configured MockPass identity');
    assert.strictEqual(profile.household.dependentsCount, 2, 'Freya should return two living children');
    assert(profile.user.cpf.oa > 0, 'CPF data should come from the MyInfo person endpoint');
    console.log(`✓ Real MockPass profile retrieved: ${profile.user.name} (${profile.user.nric})`);
  } finally {
    await Promise.all([
      new Promise((resolve) => apiServer.close(resolve)),
      new Promise((resolve) => mockpassServer.close(resolve)),
    ]);
  }
}

runMockPassTest().catch((error) => {
  console.error('MockPass Integration Test Failed:', error);
  process.exit(1);
});
