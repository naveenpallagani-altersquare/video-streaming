# Video Streaming Platform

A secure video streaming application with AWS CloudFront CDN, Node.js backend, and Vue.js frontend.

## 📐 Architecture Overview

```
Browser (HTTPS)
    ↓
CloudFront CDN
    ├── /api/*       → EC2 (Node.js API)
    ├── /bucket/*    → S3 (Videos with Signed Cookies 🔒)
    └── /*           → EC2 (Vue.js Frontend)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- AWS Account (EC2, S3, CloudFront)
- Nginx
- PM2

### Backend Setup

```bash
# 1. Clone and install
git clone <your-repo>
cd video-streaming
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env with your AWS credentials

# 3. Run
npm run dev          # Development
npm start            # Production

# 4. Deploy with PM2
pm2 start app.js --name video-streaming
pm2 save
```

### Frontend Setup

```bash
# 1. Install and build
cd video-streaming-frontend
npm install
npm run build

# 2. Deploy to Nginx
sudo cp -r dist/* /var/www/frontend/
sudo chown -R www-data:www-data /var/www/frontend
sudo systemctl reload nginx
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
PORT=3000

# Cloud CDN
CDN_KEY_PAIR_ID=
CDN_PRIVATE_KEY=""
CDN_BASE_URL=
CDN_COOKIE_EXPIRATION_SECONDS=30
```


## ☁️ AWS Setup

### 1. S3 Bucket

**Structure:**
```
s3://naveen-video-streaming-bucket/
  └── bucket/
      ├── video_101/
      │   ├── playlist.m3u8
      │   └── segment*.ts
      └── video_102/
          └── ...
```

### 2. CloudFront Distribution

**Behaviors (in order):**

| Path | Origin | Caching | Security |
|------|--------|---------|----------|
| `/api/*` | EC2 Nginx | ❌ Disabled | None |
| `/bucket/*` | S3 Bucket | ✅ Enabled | 🔒 Signed Cookies |
| `/*` (Default) | EC2 Nginx | ✅ Enabled | None |

**Key Settings for `/bucket/*`:**
- ✅ Restrict viewer access: Yes
- ✅ Trusted key groups: video-cdn-key-group
- ✅ Origin Access Control (OAC): Enabled

## 🔐 Secure Video Access

### How It Works

1. **Frontend requests signed cookies:**
   ```javascript
   await axios.get('/api/Video/v1.0/refresh-cookies', {
       params: { filePath: '/bucket/video_101/playlist.m3u8' },
       withCredentials: true
   });
   ```

2. **Backend signs and returns cookies:**
   - CloudFront-Policy (valid for 30 sec)
   - CloudFront-Signature
   - CloudFront-Key-Pair-Id

3. **Browser plays video with cookies:**
   ```javascript
   videoPlayer.src = 'https://d1p4dwrl3opcrn.cloudfront.net/bucket/video_101/playlist.m3u8';
   ```

4. **CloudFront validates cookies and serves video**


## 📊 Common Commands

### Backend

```bash
pm2 logs video-streaming      # View logs
pm2 restart video-streaming    # Restart
pm2 status                     # Check status
```

### Frontend

```bash
npm run build                  # Build
sudo systemctl reload nginx    # Reload Nginx
```

## 🌍 URLs

- **Production:** https://d1p4dwrl3opcrn.cloudfront.net/
- **API:** https://d1p4dwrl3opcrn.cloudfront.net/api/
- **Videos:** https://d1p4dwrl3opcrn.cloudfront.net/bucket/video_*/playlist.m3u8

## 📋 Deployment Checklist

- [ ] `.env` file configured
- [ ] S3 bucket created with `/bucket/video_*/` structure
- [ ] S3 public access blocked
- [ ] CloudFront behaviors configured (3 behaviors)
- [ ] CloudFront key group created and linked
- [ ] Origin Access Control enabled for S3
- [ ] EC2 security group allows ports 80/443
- [ ] Nginx installed and configured
- [ ] PM2 running backend
- [ ] Frontend built and deployed
- [ ] Test video playback with signed cookies

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- AWS SDK

**Frontend:**
- Vue.js 3
- Video.js (HLS Player)
- Axios
- Vite

**Infrastructure:**
- AWS CloudFront (CDN)
- AWS S3 (Video Storage)
- AWS EC2 (Ubuntu)
- Nginx (Reverse Proxy)
