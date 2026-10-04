// Minimal Supabase client for this website (no external libraries).
// Public pages use it to read published content; admin.html uses it to sign in,
// publish and upload images. Permissions are enforced by the database (RLS),
// never by this file.
(() => {
  'use strict';
  const config = window.TEAM_CLOUD_CONFIG || {};
  const baseUrl = (typeof config.url === 'string' ? config.url.trim() : '').replace(/\/+$/, '');
  const key = typeof config.publishableKey === 'string' ? config.publishableKey.trim() : '';
  const BUCKET = 'team-media';
  const sessionKey = 'nexus-editor-session:' + baseUrl;
  let session = null;
  let refreshing = null;

  const definitions = () => window.LAB_DEFINITIONS || [];
  const teamIds = () => definitions().map(def => def.id);
  const scopes = () => ['network', ...teamIds()];

  class CloudError extends Error {
    constructor(message, code = 'REQUEST', status = 0) { super(message); this.name = 'CloudError'; this.code = code; this.status = status; }
  }

  function decodeJwt(token) {
    try {
      const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(part + '==='.slice((part.length + 3) % 4)))));
    } catch { return null; }
  }

  function configurationError() {
    if (!baseUrl && !key) return 'Online publishing is not connected yet. The administrator must add the Supabase Project URL and publishable key to config.js.';
    if (!baseUrl || !key) return 'config.js is incomplete: both the Project URL and the publishable key are required.';
    let parsed;
    try { parsed = new URL(baseUrl); } catch { return 'config.js: the Project URL is not a valid web address.'; }
    const local = ['localhost', '127.0.0.1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !local) return 'config.js: the Project URL must start with https://';
    if (parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password) return 'config.js: use the bare Project URL, for example https://abcdefghijklmnop.supabase.co';
    if (/^sb_secret_/i.test(key)) return 'config.js contains a SECRET key. Remove it now, rotate it in Supabase, and use the publishable key instead.';
    if (key.startsWith('sb_publishable_')) return '';
    const claims = decodeJwt(key);
    if (claims && claims.role === 'anon') return '';
    if (claims && claims.role === 'service_role') return 'config.js contains the service_role key. Remove it now, rotate it in Supabase, and use the publishable key instead.';
    return 'config.js: use the publishable key (sb_publishable_…) from Project Settings → API Keys.';
  }
  const configured = () => !configurationError();

  function friendlyMessage(data, status) {
    const raw = String((data && (data.msg || data.message || data.error_description || (typeof data.error === 'string' ? data.error : ''))) || '');
    if (/invalid login credentials|invalid_grant/i.test(raw)) return 'The email or password is incorrect.';
    if (/email not confirmed/i.test(raw)) return 'This login has not been confirmed. Ask the website administrator to create it again with “Auto Confirm User” ticked.';
    if (/row-level security|permission denied|unauthorized/i.test(raw)) return 'This account is not allowed to make that change.';
    if (/mime type|invalid_mime/i.test(raw)) return 'Only JPG, PNG and WebP images are accepted.';
    if (/maximum allowed size|payload too large|too large/i.test(raw) || status === 413) return 'The image is too large (maximum 3 MB).';
    if (status === 429) return 'Too many attempts. Wait a minute, then try again.';
    if (status >= 500 || status === 0) return 'The online service is temporarily unavailable. If this continues, check whether the Supabase project is paused.';
    return raw || 'The online service could not complete the request (HTTP ' + status + ').';
  }

  function persist(value) {
    session = value;
    try { if (value) sessionStorage.setItem(sessionKey, JSON.stringify(value)); else sessionStorage.removeItem(sessionKey); } catch { /* private mode: keep in memory only */ }
  }

  async function request(path, { method = 'GET', body, auth = false, headers = {}, retry = true, timeout = 20000 } = {}) {
    const problem = configurationError();
    if (problem) throw new CloudError(problem, 'CONFIG');
    if (auth) await ensureSession();
    const sent = { apikey: key, ...headers };
    if (auth) sent.Authorization = 'Bearer ' + session.access_token;
    else if (!key.startsWith('sb_publishable_')) sent.Authorization = 'Bearer ' + key; // legacy anon key
    let payload = body;
    if (body !== undefined && !(body instanceof Blob)) { payload = JSON.stringify(body); sent['Content-Type'] = 'application/json'; }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    let response;
    try {
      response = await fetch(baseUrl + path, { method, headers: sent, body: payload, cache: 'no-store', credentials: 'omit', signal: controller.signal });
    } catch {
      throw new CloudError(controller.signal.aborted ? 'The online service did not respond in time.' : 'Could not reach the online service. Check the connection, or whether the Supabase project is paused.', 'NETWORK');
    } finally { clearTimeout(timer); }
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (response.ok) return data;
    if (auth && response.status === 401 && retry) { await refreshSession(); return request(path, { method, body, auth, headers, retry: false, timeout }); }
    if (auth && response.status === 401) { persist(null); throw new CloudError('Your session has expired. Please sign in again.', 'AUTH', 401); }
    const storageStatus = Number(data && data.statusCode);
    const code = response.status === 403 || storageStatus === 403 ? 'FORBIDDEN' : response.status === 400 && /invalid login|invalid_grant/i.test(text) ? 'CREDENTIALS' : 'HTTP_' + response.status;
    throw new CloudError(friendlyMessage(data, response.status), code, response.status);
  }

  function accept(result) {
    if (!result || !result.access_token || !result.refresh_token || !result.user || !result.user.id) throw new CloudError('The sign-in response was incomplete. Please try again.', 'AUTH');
    const expiresAt = result.expires_at || Math.floor(Date.now() / 1000) + Number(result.expires_in || 3600);
    persist({ access_token: result.access_token, refresh_token: result.refresh_token, expires_at: expiresAt, user: { id: result.user.id, email: result.user.email } });
  }

  async function refreshSession() {
    if (refreshing) return refreshing;
    if (!session || !session.refresh_token) throw new CloudError('Please sign in to continue.', 'AUTH');
    refreshing = (async () => {
      try {
        accept(await request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } }));
      } catch (error) {
        if (error.code === 'NETWORK') throw error;
        persist(null);
        throw new CloudError('Your session has expired. Please sign in again.', 'AUTH');
      } finally { refreshing = null; }
    })();
    return refreshing;
  }

  async function ensureSession() {
    if (!session) throw new CloudError('Please sign in to continue.', 'AUTH');
    if (!session.expires_at || session.expires_at <= Date.now() / 1000 + 60) await refreshSession();
  }

  async function identity() {
    const user = await request('/auth/v1/user', { auth: true });
    const rows = await request('/rest/v1/editor_accounts?select=role,team_id&user_id=eq.' + encodeURIComponent(user.id), { auth: true });
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || !['admin', 'team'].includes(row.role) || (row.role === 'team' && !teamIds().includes(row.team_id))) {
      await logout();
      throw new CloudError('This login has no editing permission yet. Ask the website administrator to add it in Supabase (step 3: accounts).', 'NO_ROLE');
    }
    const editable = row.role === 'admin' ? scopes() : [row.team_id];
    return { userId: user.id, email: user.email || (session && session.user.email) || '', role: row.role, teamId: row.role === 'team' ? row.team_id : null, editableScopes: editable, canEditPublications: row.role === 'admin' };
  }

  async function login(email, password) {
    persist(null);
    try {
      accept(await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: String(email).trim(), password } }));
    } catch (error) {
      if (error.code === 'CREDENTIALS') throw new CloudError('The email or password is incorrect.', 'CREDENTIALS', error.status);
      throw error;
    }
    try { return await identity(); } catch (error) { persist(null); throw error; }
  }

  async function restore() {
    if (!configured()) return null;
    try { session = JSON.parse(sessionStorage.getItem(sessionKey) || 'null'); } catch { session = null; }
    if (!session) return null;
    try { return await identity(); }
    catch (error) { if (error.code === 'NETWORK') throw error; persist(null); return null; }
  }

  async function logout() {
    try { if (session) await request('/auth/v1/logout?scope=local', { method: 'POST', auth: true, retry: false }); }
    catch { /* sign out locally regardless */ }
    finally { persist(null); }
  }

  async function fetchPublished({ timeout = 15000 } = {}) {
    const [pages, library] = await Promise.all([
      request('/rest/v1/team_pages?select=scope,content,revision,updated_at', { timeout }),
      request('/rest/v1/publication_library?id=eq.shared&select=id,content,revision,updated_at', { timeout })
    ]);
    if (!Array.isArray(pages) || !Array.isArray(library) || !library[0]) throw new CloudError('Website content has not been added to Supabase yet. Run 02_seed.sql in the SQL Editor.', 'SETUP');
    return { pages, library: library[0] };
  }

  // ---- content helpers (use the website's own validator in content.js) ----
  function cleanPage(content) {
    const validated = window.LabContent.validate({ ...(content || {}), version: 1, members: (content && content.members) || [], publications: [] });
    delete validated.publications;
    return validated;
  }
  function seedPage(def) {
    return cleanPage({
      site: { name: def.name, subtitle: 'Future Urban Energy / ' + def.code, description: def.introduction, headline: def.headline, introduction: def.introduction, aboutTitle: 'About ' + def.name, about: def.about },
      appearance: { heroImage: '', heroAlt: 'A conceptual waterfront city at night.', heroCaption: 'AI-generated city concept' },
      members: [], contributors: [], research: def.research, observatory: def.observatory
    });
  }
  function cleanPublications(list) {
    return window.LabContent.validate({ version: 1, members: [], publications: list }).publications;
  }

  // Build the {version:3, network, labs} bundle the public pages render.
  // Any page that fails validation falls back to the saved snapshot for that page only.
  function mergePublished(remote, fallback) {
    let base = null;
    try { base = fallback ? window.LabContent.validateBundle(fallback) : null; } catch { base = null; }
    const online = new Map((remote.pages || []).map(page => [page.scope, page.content]));
    const problems = [];
    const choose = (scope, backup, seed) => {
      if (online.has(scope)) { try { return cleanPage(online.get(scope)); } catch (error) { problems.push(scope + ': ' + error.message); } }
      else problems.push(scope + ': not published');
      if (backup) { try { return cleanPage(backup); } catch { /* use seed */ } }
      return seed();
    };
    let papers;
    try { papers = cleanPublications(remote.library.content); }
    catch (error) { problems.push('publications: ' + error.message); papers = base ? base.network.publications : []; }
    const network = { ...choose('network', base && base.network, () => cleanPage({ members: [] })), publications: papers };
    const labs = definitions().map(def => ({ id: def.id, ...choose(def.id, base && base.labs.find(lab => lab.id === def.id), () => seedPage(def)) }));
    return { bundle: { version: 3, network, labs }, problems };
  }

  async function savePage(scope, content, revision) {
    if (!scopes().includes(scope)) throw new CloudError('Unknown page.', 'INPUT');
    if (!Number.isSafeInteger(revision) || revision < 1) throw new CloudError('Reload the page before publishing.', 'CONFLICT');
    const page = cleanPage(content);
    if (new Blob([JSON.stringify(page)]).size > 256 * 1024) throw new CloudError('This page is larger than 256 KB. Upload pictures with “Upload image…” instead of pasting embedded image data, and shorten very long texts.', 'INPUT');
    const rows = await request('/rest/v1/team_pages?scope=eq.' + encodeURIComponent(scope) + '&revision=eq.' + revision + '&select=scope,content,revision,updated_at',
      { method: 'PATCH', auth: true, body: { content: page }, headers: { Prefer: 'return=representation' } });
    if (!Array.isArray(rows) || rows.length !== 1) throw new CloudError('Not published: someone else published this page after you opened it, or this account may no longer edit it. Reload the latest version and apply your changes again.', 'CONFLICT');
    return rows[0];
  }

  async function savePublications(list, revision) {
    if (!Number.isSafeInteger(revision) || revision < 1) throw new CloudError('Reload the page before publishing.', 'CONFLICT');
    const papers = cleanPublications(list);
    if (new Blob([JSON.stringify(papers)]).size > 4 * 1024 * 1024) throw new CloudError('The publication library is larger than 4 MB. Upload figures with “Upload figures…” instead of pasting embedded image data.', 'INPUT');
    const rows = await request('/rest/v1/publication_library?id=eq.shared&revision=eq.' + revision + '&select=id,content,revision,updated_at',
      { method: 'PATCH', auth: true, body: { content: papers }, headers: { Prefer: 'return=representation' } });
    if (!Array.isArray(rows) || rows.length !== 1) throw new CloudError('Not published: the library changed after you opened it, or this account may not edit publications. Reload the latest version and apply your changes again.', 'CONFLICT');
    return rows[0];
  }

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  const publicUrl = objectPath => baseUrl + '/storage/v1/object/public/' + BUCKET + '/' + objectPath.split('/').map(encodeURIComponent).join('/');

  async function upload(blob, folder) {
    const types = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
    if (!(blob instanceof Blob) || !types[blob.type]) throw new CloudError('Only JPG, PNG and WebP images are accepted.', 'INPUT');
    if (!blob.size || blob.size > 3 * 1024 * 1024) throw new CloudError('The image is too large (maximum 3 MB).', 'INPUT');
    if (folder !== 'publications' && !scopes().includes(folder)) throw new CloudError('Unknown upload folder.', 'INPUT');
    const objectPath = folder + '/' + newId() + '.' + types[blob.type];
    await request('/storage/v1/object/' + BUCKET + '/' + objectPath, { method: 'POST', auth: true, body: blob, timeout: 60000, headers: { 'Content-Type': blob.type, 'x-upsert': 'false', 'cache-control': 'max-age=31536000' } });
    return publicUrl(objectPath);
  }

  async function changePassword(current, next) {
    if (!session || !session.user || !session.user.email) throw new CloudError('Please sign in again before changing the password.', 'AUTH');
    if (typeof next !== 'string' || next.length < 12) throw new CloudError('Use a new password with at least 12 characters.', 'INPUT');
    let verified;
    try { verified = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: session.user.email, password: current } }); }
    catch (error) { if (error.code === 'CREDENTIALS') throw new CloudError('The current password is incorrect.', 'CREDENTIALS'); throw error; }
    accept(verified);
    await request('/auth/v1/user', { method: 'PUT', auth: true, body: { password: next } });
  }

  window.TeamCloud = {
    CloudError, configured, configurationError, scopes, teamIds,
    login, restore, logout, identity, fetchPublished, mergePublished,
    cleanPage, cleanPublications, savePage, savePublications, upload, publicUrl, changePassword
  };
})();
