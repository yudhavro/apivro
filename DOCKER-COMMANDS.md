# 🐳 Docker Commands - WAHA Plus

## 📊 Status & Monitoring

### **Cek Status Container**
```bash
# Lihat semua container yang running
docker ps

# Lihat container WAHA Plus
docker ps | grep waha

# Lihat semua container (termasuk yang stopped)
docker ps -a
```

### **Cek Logs**
```bash
# Lihat logs real-time (follow)
docker logs -f waha-plus

# Lihat 100 baris terakhir
docker logs --tail 100 waha-plus

# Lihat logs dengan timestamp
docker logs -t waha-plus

# Lihat logs dalam range waktu
docker logs --since 10m waha-plus  # 10 menit terakhir
docker logs --since 1h waha-plus   # 1 jam terakhir
```

### **Cek Resource Usage**
```bash
# Lihat CPU, Memory, Network usage
docker stats waha-plus

# Lihat sekali (tidak real-time)
docker stats --no-stream waha-plus
```

### **Cek Health**
```bash
# Inspect container details
docker inspect waha-plus

# Cek health status
docker inspect --format='{{.State.Health.Status}}' waha-plus

# Test API endpoint
curl -H "X-Api-Key: mysecretkey123" http://localhost:3000/api/sessions
```

---

## 🔧 Management Commands

### **Start/Stop/Restart**
```bash
# Start container
docker start waha-plus

# Stop container
docker stop waha-plus

# Restart container
docker restart waha-plus

# Stop dengan timeout
docker stop -t 30 waha-plus  # Wait 30 seconds before force kill
```

### **Remove Container**
```bash
# Stop dan remove
docker stop waha-plus && docker rm waha-plus

# Force remove (jika stuck)
docker rm -f waha-plus
```

### **Update Image**
```bash
# Pull latest image
docker pull devlikeapro/waha-plus:latest

# Stop old container
docker stop waha-plus && docker rm waha-plus

# Run new container
docker run -d \
  --name waha-plus \
  -p 3000:3000 \
  -e WAHA_API_KEY=mysecretkey123 \
  -e WHATSAPP_DEFAULT_ENGINE=WEBJS \
  -v waha_sessions:/app/.sessions \
  --restart unless-stopped \
  devlikeapro/waha-plus:latest
```

---

## 🔍 Debugging

### **Enter Container Shell**
```bash
# Bash shell
docker exec -it waha-plus bash

# Or sh (if bash not available)
docker exec -it waha-plus sh
```

### **Check Files Inside Container**
```bash
# List sessions
docker exec waha-plus ls -la /app/.sessions

# Check disk usage
docker exec waha-plus du -sh /app/.sessions

# View environment variables
docker exec waha-plus env
```

### **Network Debugging**
```bash
# Check if port is listening
netstat -tulpn | grep 3000

# Or with ss
ss -tulpn | grep 3000

# Test from inside container
docker exec waha-plus curl -s http://localhost:3000/api/sessions
```

---

## 💾 Backup & Restore

### **Backup Sessions**
```bash
# Backup volume
docker run --rm \
  -v waha_sessions:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/waha-sessions-$(date +%Y%m%d).tar.gz -C /data .

# Or copy directly
docker cp waha-plus:/app/.sessions ./backup-sessions-$(date +%Y%m%d)
```

### **Restore Sessions**
```bash
# Stop container first
docker stop waha-plus

# Restore from tar
docker run --rm \
  -v waha_sessions:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/waha-sessions-20250121.tar.gz -C /data

# Or copy directly
docker cp ./backup-sessions-20250121 waha-plus:/app/.sessions

# Start container
docker start waha-plus
```

---

## 🧹 Cleanup

### **Remove Unused Resources**
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a
```

### **Clean WAHA Sessions**
```bash
# Remove all sessions (CAREFUL!)
docker exec waha-plus rm -rf /app/.sessions/*

# Or remove specific session
docker exec waha-plus rm -rf /app/.sessions/session_name
```

---

## 📈 Monitoring Scripts

### **Auto-restart if Down**
```bash
#!/bin/bash
# save as: monitor-waha.sh

while true; do
  if ! docker ps | grep -q waha-plus; then
    echo "WAHA Plus is down! Restarting..."
    docker start waha-plus
  fi
  sleep 60
done
```

### **Log Rotation**
```bash
# Configure in /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker daemon
sudo systemctl restart docker
```

---

## 🚨 Troubleshooting

### **Container Won't Start**
```bash
# Check logs for errors
docker logs waha-plus

# Check if port is already in use
sudo lsof -i :3000

# Try running without restart policy
docker run -it --rm \
  --name waha-plus-test \
  -p 3000:3000 \
  -e WAHA_API_KEY=mysecretkey123 \
  devlikeapro/waha-plus:latest
```

### **High Memory Usage**
```bash
# Check memory usage
docker stats waha-plus --no-stream

# Check active sessions
curl -H "X-Api-Key: mysecretkey123" \
  http://localhost:3000/api/sessions | jq length

# Restart container to free memory
docker restart waha-plus
```

### **Sessions Not Persisting**
```bash
# Check volume
docker volume inspect waha_sessions

# Check mount point
docker inspect waha-plus | grep -A 10 Mounts

# Verify files in volume
docker run --rm -v waha_sessions:/data alpine ls -la /data
```

---

## 📝 Quick Reference

### **Most Used Commands**
```bash
# Status
docker ps | grep waha

# Logs (real-time)
docker logs -f waha-plus

# Logs (last 50 lines)
docker logs --tail 50 waha-plus

# Restart
docker restart waha-plus

# Stats
docker stats waha-plus --no-stream

# Test API
curl -H "X-Api-Key: mysecretkey123" http://localhost:3000/api/sessions
```

### **Emergency Commands**
```bash
# Force stop
docker kill waha-plus

# Remove and recreate
docker stop waha-plus && docker rm waha-plus
docker run -d --name waha-plus -p 3000:3000 \
  -e WAHA_API_KEY=mysecretkey123 \
  -v waha_sessions:/app/.sessions \
  devlikeapro/waha-plus:latest

# Clean everything and start fresh
docker stop waha-plus && docker rm waha-plus
docker volume rm waha_sessions
# Then run container again
```

---

## 🔗 Useful Links

- **WAHA Docs:** https://waha.devlike.pro/docs
- **Docker Docs:** https://docs.docker.com/
- **API Reference:** http://localhost:3000/ (Swagger UI)
