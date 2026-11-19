'use strict';
const { createClient } = supabase; // dari skrip supabase-js (UMD) di index.html

// KONFIGURASI APLIKASI
const IS_PREVIEW = false; // Set false JIKA SUDAH TERHUBUNG KE SUPABASE
// PASTE SUPABASE URL & ANON KEY ANDA DI SINI
const SUPABASE_URL = "https://lndnsxaijbwhoqmuqvys.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-MWcrJ6FxrFCQj4Q396rqQ_I-ePo_t6";
