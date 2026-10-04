// Public pages: load the content published from admin.html before rendering.
// If Supabase is not configured, unreachable, paused or slow, the page keeps the
// saved snapshot in content-data.js, so visitors always see a complete website.
(() => {
  'use strict';
  const api = window.TeamCloud;
  if (!api || !api.configured()) return; // static snapshot mode
  const snapshot = window.LAB_CONTENT;
  const domReady = new Promise(resolve => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resolve, { once: true });
    else resolve();
  });
  window.TEAM_CONTENT_READY = (async () => {
    try {
      const remote = await api.fetchPublished({ timeout: 6000 });
      await domReady; // content.js (the validator) has run by now
      const { bundle, problems } = api.mergePublished(remote, snapshot);
      window.LabContent.validateBundle(bundle); // throws → keep the snapshot
      window.LAB_CONTENT = bundle;
      window.TEAM_CONTENT_SOURCE = problems.length ? 'online-partial' : 'online';
      if (problems.length) console.warn('Showing the saved snapshot for:', problems);
    } catch (error) {
      window.TEAM_CONTENT_SOURCE = 'snapshot';
      console.warn('Published content unavailable; showing the saved snapshot.', error && error.message);
    }
  })();
})();
