# Raspberry Pi Setup Guide

This guide will help you set up the TracBoard dashboard to run in kiosk mode on a Raspberry Pi.

## Prerequisites

- Raspberry Pi with Raspberry Pi OS installed
- Internet connection
- The dashboard should be deployed and accessible via URL

## Option 1: Display Local Instance

If running the dashboard on the Raspberry Pi itself:

1. Install Node.js 18+:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. Clone and set up the project:
```bash
cd ~
git clone <your-repo-url> tracboard
cd tracboard
npm install
npm run build
npm start
```

3. Install Chromium:
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

4. Set up kiosk mode:
```bash
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
```

Add these lines:
```
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --kiosk --incognito http://localhost:3000
```

5. Reboot:
```bash
sudo reboot
```

## Option 2: Display Remote Instance

If the dashboard is hosted elsewhere:

1. Install Chromium:
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

2. Set up kiosk mode:
```bash
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
```

Add these lines (replace with your dashboard URL):
```
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --kiosk --incognito https://your-dashboard-url.com
```

3. Reboot:
```bash
sudo reboot
```

## Auto-Refresh

The dashboard includes built-in auto-refresh functionality. You can toggle it in the dashboard UI, or it will refresh every 30 seconds by default.

## Troubleshooting

- If the browser doesn't start, check the autostart file syntax
- To exit kiosk mode, press Alt+F4 or Ctrl+Alt+T to open terminal
- To disable kiosk mode, remove the autostart entries and reboot
