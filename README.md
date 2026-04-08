# WatchAlert

Home Front Command emergency alerts optimized for Samsung Smartwatch displays.

## Android Installation (Automatic Build)

This project is configured with **GitHub Actions** to automatically build the Android APK for you. You don't need a computer to install it!

### How to get the APK:
1.  **Export this project to your GitHub** using the "Export to GitHub" tool in the AI Studio settings.
2.  Go to your repository on GitHub.
3.  Click on the **"Actions"** tab at the top.
4.  You will see a workflow named **"Android CI"** running. Wait for it to finish (it takes about 2-3 minutes).
5.  Once it's done (green checkmark), click on the workflow run.
6.  Scroll down to the **"Artifacts"** section.
7.  Download the **`watch-alert-debug-apk`** ZIP file.
8.  Extract the ZIP on your phone and install the `.apk` file!

### Developer Mode Installation (Watch)
1.  Enable **Developer Options** on your watch.
2.  Enable **ADB Debugging** and **Debug over Wi-Fi**.
3.  Use an app like **"Bugjaeger"** (available on the Play Store) on your phone to connect to your watch's IP address.
4.  Select the downloaded `.apk` file in Bugjaeger and install it to your watch!

## Background Monitoring
This app now includes a **Native Android Foreground Service**. 
- It continues to monitor for alerts even when the app is closed or the screen is off.
- It shows a persistent notification ("Monitoring Active") to ensure the system doesn't kill the process.
- When an alert is detected, it will trigger a high-priority notification with vibration, even on your watch's lock screen.
