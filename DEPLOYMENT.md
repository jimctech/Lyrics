# How to Host "Kalam-e-Reza" on your VPS

This guide will walk you through deploying your Application to its own Virtual Private Server (VPS).

## Prerequisites
- A VPS (Ubuntu/Debian recommended)
- A domain name (e.g., `app.yourdomain.com`)
- Node.js and NPM installed on your local machine

---

## 1. Prepare the Build locally

First, you need to generate the production-ready static files.

1. Open your terminal in the project root.
2. Run the build command:
   ```bash
   npm run build
   ```
3. This will create a `dist/` folder containing all the HTML, CSS, and JS files.

---

## 2. Prepare the VPS

### Install Nginx
Connect to your VPS via SSH and run:
```bash
sudo apt update
sudo apt install nginx -y
```

### Create the directory
```bash
sudo mkdir -p /var/www/kaalam-e-reja
sudo chown -R $USER:$USER /var/www/kaalam-e-reja
```

---

## 3. Upload files to VPS

You can use `scp` or an FTP client (like FileZilla) to upload the contents of your LOCAL `dist/` folder to the VPS folder `/var/www/kaalam-e-reja`.

Example command from your local machine:
```bash
scp -r dist/* user@your_vps_ip:/var/www/kaalam-e-reja/
```

---

## 4. Configure Nginx

You need to tell Nginx how to serve the files and handle the React routing (Single Page Application).

1. Create a new config file:
   ```bash
   sudo nano /etc/nginx/sites-available/kalam-e-reza
   ```
2. Paste the following configuration:
   ```nginx
   server {
       listen 80;
       server_name app.yourdomain.com; # Change to your domain

       root /var/www/kaalam-e-reja;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 30d;
           add_header Cache-Control "public, no-transform";
       }
   }
   ```
3. Enable the config:
   ```bash
   sudo ln -s /etc/nginx/sites-available/kalam-e-reza /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 5. Setup SSL (Recommended)

To protect your users' data (needed for Firebase Auth), you should use HTTPS.

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d app.yourdomain.com
```

---

## 6. Update Firebase Console (Critical)

Since you are hosting on a new domain, you must tell Firebase to trust it.

1. Go to **Firebase Console** > **Authentication** > **Settings**.
2. Click **Authorized Domains**.
3. Add your domain (e.g., `app.yourdomain.com`).

---

## Alternative: Simple Hosting (Firebase Hosting)

If you find the VPS setup too complex, you can use **Firebase Hosting** for free (Spark Plan):
1. Install tools: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init` (Select Hosting)
4. Deploy: `firebase deploy`
