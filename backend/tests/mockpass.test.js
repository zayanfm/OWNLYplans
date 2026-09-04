process.env.NODE_ENV = 'test';

const assert = require('assert');
const apiApp = require('../server');

async function runMockPassTest() {
  console.log('--- RUNNING CUSTOM MOCKPASS REDIRECT TEST ---');
  const apiServer = apiApp.listen(5100, '127.0.0.1');
  const baseUrl = 'http://127.0.0.1:5100';

  try {
    const start = await fetch(
      `${baseUrl}/api/auth/mockpass/start?returnUrl=${encodeURIComponent('frontend://mockpass')}`
    ).then(response => response.json());
    assert.strictEqual(start.provider, 'OWNLYplans MockPass Sandbox');
    assert.strictEqual(start.protocol, 'OAUTH2_AUTHORIZATION_CODE');

    let response = await fetch(start.authorizationUrl);
    assert.strictEqual(response.status, 200, 'Development consent page should load');
    const html = await response.text();
    assert(html.includes('Alex Lim'), 'Consent page should display the selected persona');
    assert(html.includes('Lila Tan') && html.includes('Percy Lim'), 'Consent page should preview the household');
    assert(html.includes('DEVELOPMENT ONLY'), 'Consent page must clearly identify the sandbox');

    response = await fetch(`${baseUrl}/api/auth/mockpass/authorize`, {
      method: 'POST', redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ state: start.state, decision: 'allow' }),
    });
    assert.strictEqual(response.status, 303, 'Consent should issue a one-time authorization code');

    response = await fetch(new URL(response.headers.get('location'), baseUrl), { redirect: 'manual' });
    assert.strictEqual(response.status, 302, 'API callback should return to the app');
    const appCallback = new URL(response.headers.get('location'));
    const sessionId = appCallback.searchParams.get('session');
    assert(sessionId, 'App callback should contain a one-time session');

    const polledResult = await fetch(
      `${baseUrl}/api/auth/mockpass/result?state=${encodeURIComponent(start.state)}`
    ).then(result => result.json());
    assert.strictEqual(polledResult.status, 'COMPLETED', 'App should be able to observe callback completion');
    assert.strictEqual(polledResult.sessionId, sessionId, 'Redirect and polling must resolve the same session');

    const profile = await fetch(`${baseUrl}/api/auth/mockpass/session/${sessionId}`).then(result => result.json());
    assert.strictEqual(profile.authProvider, 'OWNLYplans MockPass Sandbox');
    assert.strictEqual(profile.authMethod, 'OWNLY_MOCKPASS_OAUTH2');
    assert.strictEqual(profile.user.name, 'Alex Lim');
    assert.strictEqual(profile.partner.name, 'Lila Tan');
    assert.strictEqual(profile.household.dependentsCount, 1);
    assert.strictEqual(profile.household.dependents[0].name, 'Percy Lim');

    const replay = await fetch(`${baseUrl}/api/auth/mockpass/session/${sessionId}`);
    assert.strictEqual(replay.status, 400, 'Profile session must be single-use');
    console.log('✓ Alex, Lila and Percy retrieved through one-time redirect flow');
  } finally {
    await new Promise(resolve => apiServer.close(resolve));
  }
}

runMockPassTest().catch(error => {
  console.error('MockPass Integration Test Failed:', error);
  process.exit(1);
});
