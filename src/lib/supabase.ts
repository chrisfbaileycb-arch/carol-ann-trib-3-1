import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://sflulbskzaspqgzzwaxs.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImI2YTQzMzU5LWMwOTctNGNjZi04MzQ1LTAxMzc5ZjZiYjM1MyJ9.eyJwcm9qZWN0SWQiOiJzZmx1bGJza3phc3BxZ3p6d2F4cyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg3NDc5NjQ4LCJleHAiOjIxMDI4Mzk2NDgsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.PPlvFgsK8CWO72N6530733GthWzXnQyOSAgjysb8TxI';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };