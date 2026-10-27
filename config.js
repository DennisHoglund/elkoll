// Delar Supabase-projekt med Jaktvind och Svampkartan. Elkolls tabeller har prefixet
// elkoll_ och tolkningsfunktionen heter elkoll-tolka, så inget krockar.
// Nyckeln är publik och får ligga i koden – skyddet sköts av RLS i databasen.
window.ELKOLL_CONFIG = {
  supabaseUrl: 'https://sjdznlmnvubqscftdkoj.supabase.co',
  supabaseAnonKey: 'sb_publishable_bKrpOKc38I20NvhC2vjmhw_YyZbm94Q',
  tolkaFunktion: 'elkoll-tolka',
  tolkaTimeoutMs: 40000,
  version: '18'              // visas i Teamet – höj samtidigt som CACHE i sw.js
};
