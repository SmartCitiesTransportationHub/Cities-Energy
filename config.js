// Online publishing settings — public values only, safe to commit to GitHub.
// Supabase Dashboard → Project Settings → API Keys (publishable key)
// and the Connect dialog / Data API page (Project URL).
// NEVER paste a secret key, service_role key, database password or account password here.
window.TEAM_CLOUD_CONFIG = {
  url: 'https://bqxbdyoawooihljnwing.supabase.co',            // e.g. https://abcdefghijklmnop.supabase.co
  publishableKey: 'sb_publishable_LiGhtRJ1Sk_DRw86QQCPMg_ROlIbdVz'  // e.g. sb_publishable_xxxxxxxxxxxxxxxxxxxxxx
};

// While published content loads, hide placeholder text (see laboratories.css).
if (window.TEAM_CLOUD_CONFIG.url && window.TEAM_CLOUD_CONFIG.publishableKey) {
  document.documentElement.classList.add('content-pending');
}
