const crypto = require('crypto');
const { URL } = require('url');
const env = require('../config/env');
const householdStore = require('../models/householdStore');

const AUTH_TTL_MS = 10 * 60 * 1000;
const SCOPES = [
  'Identity and citizenship',
  'Marital status and household members',
  'Employment and household income',
  'CPF balances',
  'Housing ownership and milestones',
];

const isPrivateIpv4 = (host) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
const validateReturnUrl = (returnUrl) => {
  const parsed = new URL(returnUrl);
  const isAppScheme = ['frontend:', 'exp:', 'exps:'].includes(parsed.protocol);
  const isLocalWeb = ['http:', 'https:'].includes(parsed.protocol)
    && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || isPrivateIpv4(parsed.hostname));
  if (!isAppScheme && !isLocalWeb) throw new Error('Unsupported app return URL');
  return parsed.toString();
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

class MockPassService {
  constructor() {
    this.authorizationCodes = new Map();
    this.completedSessions = new Map();
    this.authorizationResults = new Map();
  }

  cleanExpired() {
    const cutoff = Date.now() - AUTH_TTL_MS;
    for (const collection of [this.authorizationCodes, this.completedSessions, this.authorizationResults]) {
      for (const [key, value] of collection) {
        if (value.createdAt < cutoff) collection.delete(key);
      }
    }
  }

  createState(payload) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', env.MOCKPASS_STATE_SECRET)
      .update(encoded)
      .digest('base64url');
    return `${encoded}.${signature}`;
  }

  parseState(state) {
    if (typeof state !== 'string') throw new Error('Login request is invalid or expired');
    const [encoded, suppliedSignature, extra] = state.split('.');
    if (!encoded || !suppliedSignature || extra) throw new Error('Login request is invalid or expired');
    const expectedSignature = crypto.createHmac('sha256', env.MOCKPASS_STATE_SECRET)
      .update(encoded)
      .digest('base64url');
    const supplied = Buffer.from(suppliedSignature);
    const expected = Buffer.from(expectedSignature);
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      throw new Error('Login request is invalid or expired');
    }
    let payload;
    try {
      payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    } catch {
      throw new Error('Login request is invalid or expired');
    }
    if (!payload.createdAt || payload.createdAt < Date.now() - AUTH_TTL_MS || payload.createdAt > Date.now() + 60_000) {
      throw new Error('Login request is invalid or expired');
    }
    return payload;
  }

  beginAuthorization({ returnUrl, requestOrigin }) {
    this.cleanExpired();
    const callbackUrl = `${requestOrigin}/api/auth/mockpass/callback`;
    const state = this.createState({
      returnUrl: validateReturnUrl(returnUrl), callbackUrl, createdAt: Date.now(),
    });
    const authorizationUrl = new URL(`${requestOrigin}/api/auth/mockpass/authorize`);
    authorizationUrl.searchParams.set('client_id', env.MOCKPASS_CLIENT_ID);
    authorizationUrl.searchParams.set('state', state);
    return {
      authorizationUrl: authorizationUrl.toString(), state,
      provider: 'OWNLYplans MockPass Sandbox', protocol: 'OAUTH2_AUTHORIZATION_CODE',
    };
  }

  getReturnUrl(state) {
    try {
      return this.parseState(state).returnUrl;
    } catch {
      return null;
    }
  }

  getAuthorizationPage(state) {
    this.cleanExpired();
    this.parseState(state);
    const household = householdStore.getHousehold(env.DEFAULT_PERSONA);
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MockPass Sandbox</title><style>
*{box-sizing:border-box}body{margin:0;background:#f3f1ed;color:#1f1f1f;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.top{height:8px;background:#d81e05}.shell{max-width:440px;margin:0 auto;padding:26px 18px 40px}.brand{display:flex;align-items:center;gap:10px;margin-bottom:22px}.mark{width:38px;height:38px;border-radius:10px;background:#d81e05;color:#fff;display:grid;place-items:center;font-weight:900}.word{font-size:20px;font-weight:850;color:#d81e05}.sandbox{margin-left:auto;background:#fff0ed;color:#b42318;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:800}.card{background:#fff;border:1px solid #e5e1da;border-radius:22px;padding:22px;box-shadow:0 12px 35px rgba(30,25,20,.07)}h1{font-size:25px;line-height:1.18;margin:0 0 7px}.lead{font-size:13px;line-height:1.55;color:#69645e;margin:0 0 18px}.profile{display:flex;align-items:center;gap:12px;background:#f8f7f4;border:1px solid #ebe7e0;border-radius:16px;padding:14px}.avatar{width:44px;height:44px;border-radius:22px;background:#222;color:#fff;display:grid;place-items:center;font-weight:850}.name{font-weight:850}.meta{font-size:11px;color:#79736c;margin-top:3px}.selected{margin-left:auto;color:#16803a;font-size:11px;font-weight:800}.household{font-size:11px;line-height:1.55;color:#625d57;padding:10px 3px 0}.section{font-size:11px;letter-spacing:.08em;color:#8a837b;font-weight:800;margin:20px 0 8px}.scope{display:flex;gap:9px;padding:9px 0;border-bottom:1px solid #f0ede8;font-size:12px}.tick{color:#16803a;font-weight:900}.notice{font-size:11px;line-height:1.5;color:#746f68;background:#fff8e8;border-radius:12px;padding:11px;margin-top:16px}.actions{display:grid;grid-template-columns:1fr 2fr;gap:9px;margin-top:18px}button{min-height:48px;border-radius:13px;font-size:14px;font-weight:800;cursor:pointer}.deny{background:#fff;border:1px solid #d9d4cc;color:#555}.allow{background:#d81e05;border:1px solid #d81e05;color:#fff}.foot{text-align:center;color:#98918a;font-size:10px;line-height:1.5;margin-top:16px}
</style></head><body><div class="top"></div><main class="shell"><div class="brand"><div class="mark">mp</div><div class="word">MockPass</div><div class="sandbox">DEVELOPMENT ONLY</div></div><section class="card"><h1>Share your profile with OWNLYplan?</h1><p class="lead">Review the test identity and information that will be returned to the OCBC prototype.</p><div class="profile"><div class="avatar">AL</div><div><div class="name">${escapeHtml(household.primaryUser.name)}</div><div class="meta">${escapeHtml(household.primaryUser.nric)} · ${escapeHtml(household.segment)}</div></div><div class="selected">SELECTED</div></div><div class="household"><strong>Household:</strong> ${escapeHtml(household.partner.name)} (spouse) · ${escapeHtml(household.dependents[0].name)} (child)</div><div class="section">INFORMATION REQUESTED</div>${SCOPES.map(scope => `<div class="scope"><span class="tick">✓</span><span>${escapeHtml(scope)}</span></div>`).join('')}<div class="notice">This is a local sandbox identity. It does not connect to real Singpass or retrieve information about a real person.</div><form method="post" action="/api/auth/mockpass/authorize"><input type="hidden" name="state" value="${escapeHtml(state)}"><div class="actions"><button class="deny" name="decision" value="deny">Cancel</button><button class="allow" name="decision" value="allow">Agree and continue</button></div></form></section><div class="foot">One-time authorization code · state validation · 10-minute expiry<br>OWNLYplans MockPass Sandbox</div></main></body></html>`;
  }

  decideAuthorization({ state, decision }) {
    this.cleanExpired();
    const pending = this.parseState(state);
    const redirect = new URL(pending.callbackUrl);
    redirect.searchParams.set('state', state);
    if (decision !== 'allow') {
      redirect.searchParams.set('error', 'access_denied');
      redirect.searchParams.set('error-description', 'You cancelled the development login.');
      return redirect.toString();
    }
    const code = crypto.randomBytes(32).toString('base64url');
    this.authorizationCodes.set(code, { state, createdAt: Date.now() });
    redirect.searchParams.set('code', code);
    return redirect.toString();
  }

  async completeAuthorization({ code, state }) {
    this.cleanExpired();
    const pending = this.parseState(state);
    const authorization = this.authorizationCodes.get(code);
    if (!authorization || authorization.state !== state) {
      throw new Error('Authorization code is invalid, expired or already used');
    }
    this.authorizationCodes.delete(code);
    const profile = this.toOwnlyProfile(householdStore.getHousehold(env.DEFAULT_PERSONA));
    const sessionId = crypto.randomBytes(24).toString('hex');
    this.completedSessions.set(sessionId, { profile, createdAt: Date.now() });
    this.authorizationResults.set(state, { sessionId, createdAt: Date.now() });
    return { sessionId, returnUrl: pending.returnUrl };
  }

  getAuthorizationResult(state) {
    this.cleanExpired();
    this.parseState(state);
    const result = this.authorizationResults.get(state);
    return result
      ? { success: true, status: 'COMPLETED', sessionId: result.sessionId }
      : { success: true, status: 'PENDING' };
  }

  consumeSession(sessionId) {
    this.cleanExpired();
    const completed = this.completedSessions.get(sessionId);
    if (!completed) throw new Error('MockPass result is invalid, expired or already used');
    this.completedSessions.delete(sessionId);
    return completed.profile;
  }

  toOwnlyProfile(household) {
    return {
      success: true, authenticatedAt: new Date().toISOString(),
      authMethod: 'OWNLY_MOCKPASS_OAUTH2', authProvider: 'OWNLYplans MockPass Sandbox',
      personaId: household.id, personaName: household.name, segment: household.segment,
      user: { ...household.primaryUser, verified: true },
      partner: household.partner ? { ...household.partner, linked: true } : null,
      household: {
        segment: household.segment, dependentsCount: household.dependents.length,
        dependents: household.dependents.map(dependent => ({ ...dependent })),
        housing: { ...household.housing },
      },
    };
  }

  inviteFamily(members = []) {
    const invited = householdStore.inviteFamilyMembers(undefined, members);
    return { success: true, invitedAt: invited.invitedAt, members: invited.members };
  }

  getFamilyStatus() {
    return { success: true, ...householdStore.getFamilyInviteStatus() };
  }

  linkPartner(partnerDetails) {
    const updated = householdStore.linkPartner(undefined, partnerDetails);
    return { success: true, message: `Partner ${partnerDetails.name || ''} linked successfully`, household: updated };
  }
}

module.exports = new MockPassService();
