Saya mau buat Saas bernama "API VRO" yang menggunkan repo publik https://github.com/devlikeapro/waha, atau https://github.com/WhiskeySockets/Baileys 
Saas ini hanya menyediakan api dan maunya juga bisa integrasi dengan n8n atau make (JIKA BISA), tujuaannya bisa itegrasi dengan n8n atau make agar user bisa buat chatbot wa. (untuk fitur ini saya belum tahu flow atau praktik terbaiknya bagaimana).

Sedangkan untuk fitur utamanya, yaitu penyedia api, api yang kita hasilkan harus sangat fleksibel, bisa integrasi ke banyak aplikasi, seperti bisa di pakai untuk kirim notif di wa ketika ada yang isi formulir di google form melalui fitur extention > app script punya google, bisa juga di integrasikan ke woocommerce dengan mereka buat plugin sendiri misalnya, dll.

Jadi fiturnya benar-benar hanya sebagai penyedia api, tidak ada fitur broadcast, tidak ada fitur simpan nomor dll.

Karena saas komersi, maka kita menyediakan pilihan plan, (Free selamanya, Basic dan Enterprise).

Limitnya hanya pesan keluar:
Free Selamanya: 50 pesan setiap bulan (Auto reset tiap awal bulan) (Rp0/bulan, Rp0/tahun)
Basic: 1500 pesan setiap bulan (Auto reset tiap awal bulan) (Rp10.000/bulan, Rp100.000/tahun)
Enterprise: 15000 pesan setiap bulan (Auto reset tiap awal bulan) (Rp25.000/bulan, Rp250.000/tahun)

Limitasi ini jadi yang crusial, pastikan setiap pesan keluar baik dari api atau webhook (jika nanti kita pakai webhooks untuk bisa integrasi ke n8n dan make) maka harus di hitung dalam limit. Dan wajib auto tidak bisa kirim jika sudah mencapai limit dan ketika user belum perpanjang plan.

Asset yang sudah saya miliki:
1. Subdomain
2. Supabase dengan nama proyek "apivro"
- # Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qcakpmnmnytrrlhkkski.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYWtwbW5tbnl0cnJsaGtrc2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MzU1MzEsImV4cCI6MjA3NjUxMTUzMX0.hHXOlTlyye59Du646zJUEh2udvKusdoORl9Az7gfcYA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYWtwbW5tbnl0cnJsaGtrc2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkzNTUzMSwiZXhwIjoyMDc2NTExNTMxfQ.p5RHcCxFp1-o4HTSIMSqclPg44wc-XGjZqL4TlO8k1A
3. Vps spek enterprise dari nevacloud.com
4. Akun payment gateway dengan status terverifikasi, dokumentasi implementasi ada di https://tripay.co.id/developer
- Detail Merchant Sanbox untuk testing development:
-- Kode Merchant: T17192
-- Nama Merchant: Merchant Sandbox
-- URL Callback: http://localhost:3000/api/payments/tripay/callback
-- API Key: DEV-teYeK3JqORIJfGA5Lm5Dga5nu8szjlh2mAsh3N93
-- Private Key: LSUYl-OQie2-iVO1I-34a7R-xUUZY
- Daftar Channel Yang Aktif dan Urutannya:
  1. **QRIS**: Biaya dibebankan ke pelanggan (Rp 750 + 0.70%)
  2. **Mandiri Virtual Account**: Biaya dibebankan ke pelanggan (Rp 4.250)
  3. **BRI Virtual Account**: Biaya dibebankan ke pelanggan (Rp 4.250)
  4. **BNI Virtual Account**: Biaya dibebankan ke pelanggan (Rp 4.250)
  5. **BSI Virtual Account**: Biaya dibebankan ke pelanggan (Rp 4.250)
- Fitur Redirect: Menggunakan halaman checkout Tripay.co.id untuk proses pembayaran
5. S3 dari is3.cloudhost.id dengan detail: (Wajib bisa menambahkan sub-folder dengan nama "apivro")
-- bucket name: ngirimwa
-- region: jakarta
-- access key: YVJ0DH7JOABV38WPY07J
-- secret key: pH2kA2bdLSlmGCZHfIyejyTLR0AnaUwbbyyjBwXx
6. Akun SMTP:
-- Mail Host: smtp-relay.brevo.com
-- Mail Port: 587
-- Mail Username: support@yudhavro.com
-- Mail Password: 5P96jsFOp7byZTdR
-- Mail Encryption: TLS
-- Mail From Address: support@yudhavro.com
-- Mail From Name: Yudha dari APIVRO