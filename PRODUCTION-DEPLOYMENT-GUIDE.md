# 🚀 Panduan Deployment Production - CloudPanel VPS

## 📋 Daftar Isi
- [Status Saat Ini](#status-saat-ini)
- [Langkah 1: Install Dependencies](#langkah-1-cek--install-dependencies)
- [Langkah 2: Masuk ke Folder Project](#langkah-2-masuk-ke-folder-project)
- [Langkah 3: Install & Build](#langkah-3-install-dependencies--build)
- [Langkah 4: Setup Backend PM2](#langkah-4-setup-backend-dengan-pm2)
- [Langkah 5: Deploy WAHA Plus](#langkah-5-deploy-waha-plus-dengan-docker)
- [Langkah 6: Konfigurasi Nginx](#langkah-6-konfigurasi-nginx-cloudpanel)
- [Langkah 7: Test Production](#langkah-7-test-production)
- [Troubleshooting](#troubleshooting)

---

## 🔧 CloudPanel VPS Production Deployment

### **Status Saat Ini:**
- ✅ VPS sudah running dengan CloudPanel
- ✅ Domain `api.yudhavro.com` sudah pointing ke VPS (160.19.166.145)
- ✅ File project sudah di-upload ke `/home/cloudpanel/htdocs/api.yudhavro.com/`
- ✅ File `.env` sudah ada
- ✅ SSH access sudah OK
- ⚠️ Domain accessible tapi blank putih (frontend belum di-build)

### **Yang Perlu Dilakukan:**
1. Install dependencies (Node.js, PM2, Docker)
2. Build frontend production
3. Setup backend dengan PM2
4. Deploy WAHA Plus dengan Docker
5. Konfigurasi Nginx
6. Test production

---

## 📋 TODO: Deployment Step-by-Step

### **✅ Langkah 1: Cek & Install Dependencies**

Anda sudah login SSH, sekarang cek dan install yang diperlukan:

**1.1. Cek Node.js version**
```bash
node --version
npm --version
```

Jika belum ada atau versi < 18, install:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

**1.2. Install PM2 (Process Manager)**
```bash
npm install -g pm2
pm2 --version
```

**1.3. Cek Docker**
```bash
docker --version
```

Jika belum ada, install:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker
```

---

### **✅ Langkah 2: Masuk ke Folder Project**

**2.1. Navigate ke folder project**
```bash
cd /home/cloudpanel/htdocs/api.yudhavro.com
pwd
ls -la
```

**2.2. Cek file .env sudah ada**
```bash
cat .env | head -5
```

Pastikan semua env vars sudah benar, terutama:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_WAHA_URL` (set ke `https://api.yudhavro.com` nanti)

---

### **✅ Langkah 3: Install Dependencies & Build**

**3.1. Install npm packages**
```bash
npm install
```

Tunggu sampai selesai (bisa 2-5 menit).

**3.2. Build frontend production**
```bash
npm run build
```

Ini akan generate folder `dist/` dengan static files.

**3.3. Verify build**
```bash
ls -la dist/
# Harus ada: index.html, assets/, dll
```

**3.4. Build backend**
```bash
npm run build:server
```

Ini akan generate folder `dist/server/` dengan compiled TypeScript.

**3.5. Verify backend build**
```bash
ls -la dist/server/
# Harus ada: index.js, routes/, lib/, dll
```

---

### **✅ Langkah 4: Setup Backend dengan PM2**

**4.1. Buat PM2 ecosystem file**
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'apivro-backend',
      script: 'dist/server/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF
```

**4.2. Create logs folder**
```bash
mkdir -p logs
```

**4.3. Start backend dengan PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Copy command yang muncul dan jalankan (contoh):
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

**4.4. Verify backend running**
```bash
pm2 status
pm2 logs apivro-backend --lines 20
```

**4.5. Test backend API**
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-24T..."}
```

---

### **✅ Langkah 5: Deploy WAHA Plus dengan Docker**

**5.1. Login ke Docker Hub**

Jika Anda sudah donate ke WAHA dan dapat Personal Docker Hub Key:

```bash
docker login -u devlikeapro
```

Saat diminta password, **paste Personal Docker Hub Key** Anda (dari email donasi).

**5.2. Pull WAHA Plus dari Docker Hub**
```bash
docker pull devlikeapro/waha-plus
```

**5.3. Run WAHA Plus**
```bash
docker run -d \
  --name waha-plus \
  --restart unless-stopped \
  -p 3000:3000 \
  -e WAHA_API_KEY=mysecretkey123 \
  -e WHATSAPP_DEFAULT_ENGINE=WEBJS \
  -v /var/waha_sessions:/app/.sessions \
  devlikeapro/waha-plus
```

**5.4. Verify WAHA running**
```bash
# Check container status
docker ps | grep waha

# Wait for WAHA to fully start (10-30 seconds)
sleep 15

# Check logs
docker logs waha-plus --tail 30
```

**5.5. Test WAHA API**
```bash
curl -H "X-Api-Key: mysecretkey123" http://localhost:3000/api/sessions
```

Expected response:
```json
[]
```
(Empty array karena belum ada session)

**Note:** Jika Anda belum donate, gunakan WAHA free version:
```bash
docker pull devlikeapro/waha
docker run -d --name waha --restart unless-stopped -p 3000:3000 \
  -e WHATSAPP_HOOK_EVENTS=* \
  -v /var/waha_sessions:/app/.waha/sessions \
  devlikeapro/waha
```

---

### **✅ Langkah 6: Konfigurasi Nginx (CloudPanel)**

CloudPanel sudah punya Nginx, kita tinggal update konfigurasinya.

**6.1. Cari file Nginx config untuk domain Anda**
```bash
ls -la /etc/nginx/sites-enabled/ | grep api.yudhavro.com
```

**6.2. Backup config lama**
```bash
cp /etc/nginx/sites-enabled/api.yudhavro.com.conf /etc/nginx/sites-enabled/api.yudhavro.com.conf.backup
```

**6.3. Edit Nginx config**
```bash
nano /etc/nginx/sites-enabled/api.yudhavro.com.conf
```

**6.4. Ganti isi file dengan config ini (HTTP only dulu):**

**PENTING:** Ganti path sesuai dengan folder Anda. Jika folder Anda di `/home/yudhavro-api/htdocs/api.yudhavro.com`, gunakan path tersebut!

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.yudhavro.com;
    
    root /home/yudhavro-api/htdocs/api.yudhavro.com/dist;
    index index.html;

    # Frontend (React SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
```

**6.5. Test Nginx config**
```bash
nginx -t
```

Harus muncul: `syntax is ok` dan `test is successful`

**6.6. Reload Nginx**
```bash
systemctl reload nginx
```

---

### **✅ Langkah 7: Setup SSL dengan Certbot**

**7.1. Install Certbot**
```bash
apt update
apt install certbot python3-certbot-nginx -y
```

**7.2. Generate SSL Certificate**

Ganti `your-email@gmail.com` dengan email Anda:

```bash
certbot --nginx -d api.yudhavro.com --non-interactive --agree-tos --email your-email@gmail.com --redirect
```

Certbot akan:
- Generate SSL certificate dari Let's Encrypt
- Otomatis update Nginx config dengan SSL
- Setup redirect HTTP → HTTPS
- Setup auto-renewal

**7.3. Verify SSL**
```bash
certbot certificates
```

**7.4. Test Nginx ulang**
```bash
nginx -t
systemctl reload nginx
```

**7.5. Test HTTPS**

Buka browser: `https://api.yudhavro.com`

Seharusnya sekarang:
- ✅ SSL active (gembok hijau)
- ✅ Frontend muncul (tidak blank)
- ✅ Bisa login

---

### **✅ Langkah 8: Test Production**

**8.1. Test frontend**

Buka browser: `https://api.yudhavro.com`

Seharusnya muncul halaman login API VRO (tidak blank lagi).

**8.2. Test backend health**
```bash
curl https://api.yudhavro.com/health
```

Expected:
```json
{"status":"ok","timestamp":"..."}
```

**8.3. Test backend API**
```bash
curl https://api.yudhavro.com/api/v1/health
```

**8.4. Login dan test di browser**
- Buka `https://api.yudhavro.com`
- Login dengan Google/GitHub
- Cek dashboard
- Test add device (scan QR code WhatsApp)
- Test create API key
- Test send message

**8.5. Verify semua service running**
```bash
# Check PM2 backend
pm2 status

# Check Docker WAHA Plus
docker ps | grep waha

# Check Nginx
systemctl status nginx

# Check all ports
netstat -tulpn | grep -E ':(3000|3001|80|443)'
```

---

## 🎯 Selesai! Service Sudah Berjalan

Jika semua langkah di atas berhasil, maka:

- ✅ Frontend accessible di `https://api.yudhavro.com`
- ✅ Backend API running di port 3001
- ✅ WAHA Plus running di port 3000
- ✅ Nginx reverse proxy configured
- ✅ PM2 managing backend process
- ✅ Docker managing WAHA Plus

### **Next Steps (Optional):**
- Setup monitoring (UptimeRobot, Sentry)
- Configure backup strategy
- Setup n8n integration (lihat N8N-INTEGRATION-GUIDE.md)
- Update Tripay to production mode
- Add more devices

---

## ✅ Post-Deployment Checklist

### **Service Status**
- [ ] PM2 backend running
- [ ] Docker WAHA Plus running
- [ ] Nginx running
- [ ] Frontend accessible via browser
- [ ] Backend API responding
- [ ] Can login with Google/GitHub
- [ ] Can add WhatsApp device
- [ ] Can create API key

### **Testing**
- [ ] Test send message via API
- [ ] Test receive message
- [ ] Test dashboard statistics
- [ ] Test device connection status

---

---

## 🎯 Quick Commands Reference

### **Monitoring**
```bash
# Check all services
pm2 status
docker ps
systemctl status nginx

# View logs
pm2 logs apivro-backend --lines 50
docker logs waha-plus --tail 50
tail -f /var/log/nginx/error.log

# Check disk space
df -h

# Check memory
free -h
```

### **Restart Services**
```bash
# Restart backend
pm2 restart apivro-backend

# Restart WAHA
docker restart waha-plus

# Restart Nginx
systemctl restart nginx
```

### **Update Code**
```bash
cd /home/cloudpanel/htdocs/api.yudhavro.com

# Pull latest code (jika pakai git)
git pull

# Install dependencies
npm install

# Rebuild
npm run build
npm run build:server

# Restart backend
pm2 restart apivro-backend
```

---

## 🆘 Troubleshooting

### **Problem: Domain blank putih**

**Solusi:**
```bash
# Cek apakah dist/ folder ada
ls -la /home/cloudpanel/htdocs/api.yudhavro.com/dist/

# Jika tidak ada, build frontend
cd /home/cloudpanel/htdocs/api.yudhavro.com
npm run build

# Reload nginx
systemctl reload nginx
```

### **Problem: Backend tidak bisa akses**

**Solusi:**
```bash
# Check PM2 status
pm2 status
pm2 logs apivro-backend --lines 50

# Check port
netstat -tulpn | grep 3001

# Restart backend
pm2 restart apivro-backend

# Jika masih error, rebuild
cd /home/cloudpanel/htdocs/api.yudhavro.com
npm run build:server
pm2 restart apivro-backend
```

### **Problem: WAHA Plus error**

**Solusi:**
```bash
# Check Docker logs
docker logs waha-plus --tail 100

# Restart WAHA
docker restart waha-plus

# Jika masih error, stop dan remove
docker stop waha-plus
docker rm waha-plus

# Run ulang
docker run -d \
  --name waha-plus \
  --restart unless-stopped \
  -p 3000:3000 \
  -e WAHA_API_KEY=mysecretkey123 \
  -e WHATSAPP_DEFAULT_ENGINE=WEBJS \
  -v /var/waha_sessions:/app/.sessions \
  cr.waha.devlike.pro/waha-plus
```

### **Problem: SSL certificate error**

**Solusi:**
```bash
# Check certificate
certbot certificates

# Renew certificate
certbot renew

# Reload nginx
systemctl reload nginx
```

### **Problem: Nginx error**

**Solusi:**
```bash
# Test config
nginx -t

# Check error log
tail -f /var/log/nginx/error.log

# Restart nginx
systemctl restart nginx
```

### **Problem: Out of disk space**

**Solusi:**
```bash
# Check disk usage
df -h

# Clean npm cache
npm cache clean --force

# Clean Docker
docker system prune -a

# Clean PM2 logs
pm2 flush
```

---

## ✅ Post-Deployment Checklist

### **Security**
- [ ] SSL certificate installed dan active
- [ ] Firewall configured (UFW)
- [ ] SSH key-based authentication
- [ ] Disable root login (optional)
- [ ] Update .env dengan production values
- [ ] Rotate API keys
- [ ] Setup CORS properly

### **Monitoring**
- [ ] PM2 running dan auto-start enabled
- [ ] Docker containers running
- [ ] Nginx running
- [ ] Setup uptime monitoring (UptimeRobot)
- [ ] Setup error tracking (Sentry - optional)

### **Backup**
- [ ] Database backup (Supabase auto-backup)
- [ ] WAHA sessions backup strategy
- [ ] Environment variables documented
- [ ] Code in GitHub

### **Testing**
- [ ] Frontend accessible via HTTPS
- [ ] Backend API working
- [ ] WAHA Plus running
- [ ] WhatsApp device can connect
- [ ] Send message working
- [ ] Webhook delivery working
- [ ] n8n integration working
- [ ] Payment flow (if production Tripay)

### **Performance**
- [ ] Gzip compression enabled
- [ ] Static assets cached
- [ ] Database indexes optimized
- [ ] PM2 cluster mode (optional)

---

## 📊 Monitoring & Maintenance

### **Daily Tasks**
- Check PM2 status: `pm2 status`
- Check Docker status: `docker ps`
- Check disk space: `df -h`
- Review error logs

### **Weekly Tasks**
- Review PM2 logs for errors
- Check WAHA sessions backup
- Monitor API usage
- Review performance metrics

### **Monthly Tasks**
- Update dependencies: `npm update`
- Security audit
- Cost optimization review
- Backup verification
- SSL certificate check (auto-renews)

---

## 📚 Resources

- CloudPanel Docs: https://www.cloudpanel.io/docs/
- Railway Docs: https://docs.railway.app/
- Vercel Docs: https://vercel.com/docs
- PM2 Docs: https://pm2.keymetrics.io/docs/
- Nginx Docs: https://nginx.org/en/docs/

---

**Good luck with your deployment! 🚀**
