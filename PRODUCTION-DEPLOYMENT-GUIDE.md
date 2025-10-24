# 🚀 Panduan Deployment Production - API VRO

## 📋 Daftar Isi
- [Overview](#overview)
- [Opsi Deployment](#opsi-deployment)
- [Opsi 1: CloudPanel VPS (Your Setup)](#opsi-1-cloudpanel-vps-your-setup)
- [Opsi 2: Railway + Vercel (Recommended)](#opsi-2-railway--vercel-recommended)
- [Opsi 3: Docker VPS Manual](#opsi-3-docker-vps-manual)
- [Perbandingan Biaya](#perbandingan-biaya)
- [Post-Deployment Checklist](#post-deployment-checklist)

---

## 🎯 Overview

Anda sudah punya:
- ✅ VPS Enterprise dengan CloudPanel
- ✅ Domain: `api.yudhavro.com` (sudah pointing ke VPS)
- ✅ File project sudah di-upload ke CloudPanel

**Komponen yang perlu di-deploy:**
1. **Frontend** (React + Vite) → Port 5173
2. **Backend API** (Express + TypeScript) → Port 3001
3. **WAHA Plus** (Docker) → Port 3000
4. **Database** (Supabase) → Sudah cloud ✅
5. **n8n** (flow.yudhavro.com) → Sudah online ✅

---

## 💰 Opsi Deployment

### **Perbandingan Cepat:**

| Opsi | Biaya/Bulan | Setup | Scalability | Recommended |
|------|-------------|-------|-------------|-------------|
| **CloudPanel VPS** | Rp 100-500k | Medium | High | ⭐⭐⭐⭐ |
| **Railway + Vercel** | $5-20 | Easy | Very High | ⭐⭐⭐⭐⭐ |
| **Docker VPS Manual** | Rp 50-300k | Hard | Medium | ⭐⭐⭐ |
| **Render.com** | $7-25 | Easy | High | ⭐⭐⭐⭐ |

---

## 🔧 Opsi 1: CloudPanel VPS (Your Setup)

### **Keuntungan:**
- ✅ Full control atas server
- ✅ Satu VPS untuk semua service
- ✅ Hemat biaya jangka panjang
- ✅ Sudah ada CloudPanel (easy management)

### **Kekurangan:**
- ❌ Perlu maintenance sendiri
- ❌ Setup lebih kompleks
- ❌ Scaling manual

---

### **📋 Setup Step-by-Step**

#### **Langkah 1: Persiapan VPS**

**1.1. Login ke VPS via SSH**
```bash
ssh root@YOUR_VPS_IP
```

**1.2. Update sistem**
```bash
apt update && apt upgrade -y
```

**1.3. Install dependencies**
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# PM2 untuk process manager
npm install -g pm2

# Docker (untuk WAHA Plus)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

---

#### **Langkah 2: Setup Domain & SSL**

**2.1. Di CloudPanel:**
- Login ke CloudPanel: `https://YOUR_VPS_IP:8443`
- Pergi ke **Sites**
- Klik **Add Site**
- Domain: `api.yudhavro.com`
- Type: **Node.js**
- Node.js Version: **18**

**2.2. Setup SSL (Let's Encrypt):**
- Di site settings, klik **SSL/TLS**
- Pilih **Let's Encrypt**
- Klik **Issue Certificate**
- Tunggu proses selesai

---

#### **Langkah 3: Upload & Setup Project**

**3.1. Upload file project**

Jika belum upload, gunakan rsync:
```bash
# Dari komputer lokal
rsync -avz --exclude 'node_modules' \
  /home/yudhavro/Yudhavro/waapivro/ \
  root@YOUR_VPS_IP:/home/cloudpanel/htdocs/api.yudhavro.com/
```

Atau via CloudPanel File Manager.

**3.2. SSH ke VPS dan masuk ke folder project**
```bash
cd /home/cloudpanel/htdocs/api.yudhavro.com
```

**3.3. Install dependencies**
```bash
npm install
```

**3.4. Setup environment variables**
```bash
# Copy .env
cp .env.example .env

# Edit .env
nano .env
```

Update values:
```env
# Supabase (sama seperti local)
VITE_SUPABASE_URL=https://qcakpmnmnytrrlhkkski.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WAHA (akan running di VPS juga)
VITE_WAHA_URL=http://localhost:3000
VITE_WAHA_API_KEY=mysecretkey123

# Tripay (ganti ke production)
TRIPAY_API_KEY=YOUR_PRODUCTION_API_KEY
TRIPAY_PRIVATE_KEY=YOUR_PRODUCTION_PRIVATE_KEY
TRIPAY_MERCHANT_CODE=YOUR_MERCHANT_CODE
TRIPAY_MODE=production

# S3, SMTP (sama seperti local)
```

---

#### **Langkah 4: Build Frontend**

```bash
# Build production
npm run build

# Folder dist/ akan berisi static files
ls -la dist/
```

---

#### **Langkah 5: Setup Backend dengan PM2**

**5.1. Build backend**
```bash
npm run build:server
```

**5.2. Buat PM2 ecosystem file**
```bash
nano ecosystem.config.js
```

Isi:
```javascript
module.exports = {
  apps: [
    {
      name: 'apivro-backend',
      script: 'dist/server/index.js',
      instances: 2,
      exec_mode: 'cluster',
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
```

**5.3. Start backend dengan PM2**
```bash
# Create logs folder
mkdir -p logs

# Start PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup PM2 startup
pm2 startup
# Copy & run command yang muncul
```

**5.4. Verify backend running**
```bash
pm2 status
pm2 logs apivro-backend
curl http://localhost:3001/health
```

---

#### **Langkah 6: Setup WAHA Plus**

**6.1. Login ke Docker registry**
```bash
docker login -u devlikeapro -p YOUR_WAHA_KEY cr.waha.devlike.pro
```

**6.2. Run WAHA Plus**
```bash
docker run -d \
  --name waha-plus \
  --restart unless-stopped \
  -p 3000:3000 \
  -e WAHA_API_KEY=mysecretkey123 \
  -e WHATSAPP_DEFAULT_ENGINE=WEBJS \
  -v /var/waha_sessions:/app/.sessions \
  cr.waha.devlike.pro/waha-plus
```

**6.3. Verify WAHA running**
```bash
docker ps | grep waha
curl -H "X-Api-Key: mysecretkey123" http://localhost:3000/api/sessions
```

---

#### **Langkah 7: Setup Nginx Reverse Proxy**

**7.1. Buat Nginx config**
```bash
nano /etc/nginx/sites-available/api.yudhavro.com
```

Isi:
```nginx
# Frontend (Static Files)
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.yudhavro.com;

    ssl_certificate /etc/letsencrypt/live/api.yudhavro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yudhavro.com/privkey.pem;

    root /home/cloudpanel/htdocs/api.yudhavro.com/dist;
    index index.html;

    # Frontend routes
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
    }

    # WAHA API (optional, jika ingin expose)
    location /waha/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yudhavro.com;
    return 301 https://$server_name$request_uri;
}
```

**7.2. Enable site**
```bash
ln -s /etc/nginx/sites-available/api.yudhavro.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

#### **Langkah 8: Update n8n Webhook**

**8.1. Update webhook URL di n8n**

Ganti dari ngrok ke domain production:
```
https://api.yudhavro.com/api/v1/webhooks/incoming
```

**8.2. Update API endpoint di n8n**

Untuk send message:
```
https://api.yudhavro.com/api/v1/messages/send
```

---

#### **Langkah 9: Test Production**

**9.1. Test frontend**
```bash
curl https://api.yudhavro.com
```

**9.2. Test backend API**
```bash
curl https://api.yudhavro.com/api/v1/health
```

**9.3. Test send message**
```bash
curl -X POST https://api.yudhavro.com/api/v1/messages/send \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "628123456789",
    "message": "Test from production!"
  }'
```

---

## 🚀 Opsi 2: Railway + Vercel (Recommended)

### **Keuntungan:**
- ✅ Setup super mudah (5-10 menit)
- ✅ Auto-scaling
- ✅ Free tier tersedia
- ✅ CI/CD otomatis
- ✅ Monitoring built-in
- ✅ Zero downtime deployment

### **Biaya:**
- **Railway**: $5/bulan (500 hours) atau $20/bulan (unlimited)
- **Vercel**: Free untuk hobby, $20/bulan untuk pro
- **Total**: ~$5-25/bulan

---

### **📋 Setup Step-by-Step**

#### **Langkah 1: Deploy Backend ke Railway**

**1.1. Push code ke GitHub**
```bash
cd /home/yudhavro/Yudhavro/waapivro
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/waapivro.git
git push -u origin main
```

**1.2. Deploy ke Railway**
- Pergi ke: https://railway.app
- Login dengan GitHub
- Klik **New Project**
- Pilih **Deploy from GitHub repo**
- Pilih repository `waapivro`
- Railway akan auto-detect dan deploy

**1.3. Setup environment variables**

Di Railway dashboard:
- Klik project → **Variables**
- Add semua env vars dari `.env`:
  ```
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  WAHA_URL=... (akan setup nanti)
  PORT=3001
  ```

**1.4. Setup custom domain**
- Di Railway, klik **Settings** → **Domains**
- Add domain: `api.yudhavro.com`
- Update DNS:
  ```
  Type: CNAME
  Name: api
  Value: [railway-provided-domain]
  ```

---

#### **Langkah 2: Deploy WAHA Plus ke Railway**

**2.1. Buat service baru**
- Di Railway project, klik **New**
- Pilih **Docker Image**
- Image: `cr.waha.devlike.pro/waha-plus`
- Port: `3000`

**2.2. Add environment variables**
```
WAHA_API_KEY=mysecretkey123
WHATSAPP_DEFAULT_ENGINE=WEBJS
```

**2.3. Add volume untuk sessions**
- Di service settings → **Volumes**
- Mount path: `/app/.sessions`

**2.4. Get WAHA URL**
- Railway akan generate URL: `waha-plus.railway.app`
- Update backend env var:
  ```
  WAHA_URL=https://waha-plus.railway.app
  ```

---

#### **Langkah 3: Deploy Frontend ke Vercel**

**3.1. Install Vercel CLI**
```bash
npm install -g vercel
```

**3.2. Deploy**
```bash
cd /home/yudhavro/Yudhavro/waapivro
vercel
```

Follow prompts:
- Setup and deploy: **Yes**
- Scope: Your account
- Link to existing project: **No**
- Project name: `apivro`
- Directory: `./`
- Override settings: **No**

**3.3. Setup environment variables**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_WAHA_URL
```

**3.4. Setup custom domain**
```bash
vercel domains add api.yudhavro.com
```

Update DNS:
```
Type: CNAME
Name: api
Value: cname.vercel-dns.com
```

---

#### **Langkah 4: Update n8n**

Update URLs di n8n workflows:
- Backend API: `https://api.yudhavro.com/api/v1/messages/send`
- Webhook: `https://api.yudhavro.com/api/v1/webhooks/incoming`

---

## 🐳 Opsi 3: Docker VPS Manual

### **Setup dengan Docker Compose**

**3.1. Buat docker-compose.yml**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    env_file:
      - .env
    restart: unless-stopped

  waha-plus:
    image: cr.waha.devlike.pro/waha-plus
    ports:
      - "3000:3000"
    environment:
      - WAHA_API_KEY=mysecretkey123
      - WHATSAPP_DEFAULT_ENGINE=WEBJS
    volumes:
      - waha_sessions:/app/.sessions
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/usr/share/nginx/html
      - ./certbot/conf:/etc/letsencrypt
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  waha_sessions:
```

**3.2. Deploy**
```bash
docker-compose up -d
```

---

## 💰 Perbandingan Biaya Detail

### **CloudPanel VPS**
| Item | Biaya |
|------|-------|
| VPS 2GB RAM | Rp 100k/bulan |
| VPS 4GB RAM | Rp 200k/bulan |
| VPS 8GB RAM | Rp 500k/bulan |
| Domain | Rp 150k/tahun |
| **Total** | **Rp 100-500k/bulan** |

**Pros:**
- Full control
- Bisa host banyak project
- Hemat jangka panjang

**Cons:**
- Perlu maintenance
- Setup kompleks

---

### **Railway + Vercel**
| Item | Biaya |
|------|-------|
| Railway Hobby | $5/bulan |
| Railway Pro | $20/bulan |
| Vercel Hobby | $0 |
| Vercel Pro | $20/bulan |
| **Total** | **$5-40/bulan** |

**Pros:**
- Zero maintenance
- Auto-scaling
- CI/CD otomatis
- Monitoring built-in

**Cons:**
- Biaya naik seiring traffic
- Less control

---

### **Render.com (Alternative)**
| Item | Biaya |
|------|-------|
| Web Service | $7/bulan |
| Database (optional) | $7/bulan |
| **Total** | **$7-14/bulan** |

---

## 🎯 Rekomendasi

### **Untuk Startup/MVP:**
**Railway + Vercel** ⭐⭐⭐⭐⭐
- Setup cepat
- Fokus ke product, bukan infrastructure
- Scale otomatis

### **Untuk Long-term/Scale:**
**CloudPanel VPS** ⭐⭐⭐⭐
- Hemat biaya jangka panjang
- Full control
- Bisa host multiple projects

### **Untuk Simplicity:**
**Render.com** ⭐⭐⭐⭐
- Balance antara ease & cost
- Good for small-medium scale

---

## ✅ Post-Deployment Checklist

### **Security**
- [ ] Enable HTTPS/SSL
- [ ] Setup firewall (UFW)
- [ ] Change default SSH port
- [ ] Disable root login
- [ ] Setup fail2ban
- [ ] Enable Supabase RLS policies
- [ ] Rotate API keys
- [ ] Setup CORS properly

### **Monitoring**
- [ ] Setup uptime monitoring (UptimeRobot)
- [ ] Setup error tracking (Sentry)
- [ ] Setup log aggregation
- [ ] Monitor disk usage
- [ ] Monitor memory usage
- [ ] Setup alerts

### **Backup**
- [ ] Database backup (Supabase auto-backup)
- [ ] WAHA sessions backup
- [ ] Environment variables backup
- [ ] Code backup (GitHub)

### **Performance**
- [ ] Enable Gzip compression
- [ ] Setup CDN (Cloudflare)
- [ ] Optimize images
- [ ] Enable caching
- [ ] Database indexing

### **Testing**
- [ ] Test all API endpoints
- [ ] Test WhatsApp send/receive
- [ ] Test payment flow
- [ ] Test webhook delivery
- [ ] Load testing

---

## 🔧 Maintenance Tasks

### **Daily**
- Check PM2/Docker logs
- Monitor error rates
- Check disk space

### **Weekly**
- Review performance metrics
- Check security alerts
- Update dependencies

### **Monthly**
- Backup verification
- Security audit
- Cost optimization review

---

## 🆘 Troubleshooting

### **Backend tidak bisa akses**
```bash
# Check PM2 status
pm2 status
pm2 logs apivro-backend

# Check port
netstat -tulpn | grep 3001

# Restart
pm2 restart apivro-backend
```

### **WAHA Plus error**
```bash
# Check Docker logs
docker logs waha-plus

# Restart
docker restart waha-plus

# Check sessions
ls -la /var/waha_sessions/
```

### **SSL certificate error**
```bash
# Renew certificate
certbot renew

# Reload nginx
systemctl reload nginx
```

---

## 📚 Resources

- CloudPanel Docs: https://www.cloudpanel.io/docs/
- Railway Docs: https://docs.railway.app/
- Vercel Docs: https://vercel.com/docs
- PM2 Docs: https://pm2.keymetrics.io/docs/
- Nginx Docs: https://nginx.org/en/docs/

---

**Good luck with your deployment! 🚀**
