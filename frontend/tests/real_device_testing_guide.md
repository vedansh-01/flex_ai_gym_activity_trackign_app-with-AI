# Real-Device Cloud Testing Guide – FlexAI Gym App

This guide explains how to run automated E2E tests on **real physical devices** using cloud device farms, specifically **Firebase Test Lab** (free tier) and **BrowserStack App Automate**.

---

## Option 1: Firebase Test Lab (Recommended – Free Tier)

Firebase Test Lab offers **15 test executions per day** on physical devices for free (Spark plan).

### Prerequisites
1. **Google Cloud Account** with a Firebase project.
2. **gcloud CLI** installed: https://cloud.google.com/sdk/docs/install
3. An **APK** or **AAB** file built via `eas build -p android`.

### Steps

#### 1. Build the APK
```bash
cd frontend
npx eas build -p android --profile preview
```
Download the resulting `.apk` file from the EAS dashboard.

#### 2. Authenticate with Google Cloud
```bash
gcloud auth login
gcloud config set project YOUR_FIREBASE_PROJECT_ID
```

#### 3. Run a Robo Test (Automated Exploration)
Firebase's Robo test automatically crawls through your app, clicking buttons and filling in forms:
```bash
gcloud firebase test android run \
  --type robo \
  --app ./path/to/flexai.apk \
  --device model=Pixel6,version=33,locale=en,orientation=portrait \
  --timeout 300s
```

#### 4. Run Maestro Tests on Firebase Test Lab
You can use Maestro Cloud to dispatch your YAML flows to Firebase Test Lab devices:
```bash
maestro cloud --app-file ./path/to/flexai.apk \
  frontend/maestro/login_flow.yaml \
  frontend/maestro/workout_flow.yaml \
  frontend/maestro/food_flow.yaml
```

#### 5. View Results
Results (video recordings, screenshots, logs) are available in the Firebase Console:
https://console.firebase.google.com → Test Lab → Test History

---

## Option 2: BrowserStack App Automate

BrowserStack provides a free trial with access to 2000+ real devices.

### Prerequisites
1. **BrowserStack Account**: https://www.browserstack.com/
2. Upload the APK via their REST API or dashboard.

### Steps

#### 1. Upload APK
```bash
curl -u "YOUR_USERNAME:YOUR_ACCESS_KEY" \
  -X POST "https://api-cloud.browserstack.com/app-automate/upload" \
  -F "file=@./path/to/flexai.apk"
```
This returns an `app_url` (e.g., `bs://abc123...`).

#### 2. Run Tests
Use the BrowserStack dashboard to configure automated test runs, or integrate with your Maestro flows using the BrowserStack CLI.

#### 3. View Results
Navigate to the BrowserStack App Automate dashboard to view:
- Device logs
- Video recordings
- Network logs
- Screenshots

---

## Device Coverage Recommendations

For the FlexAI Gym app targeting Indian gym users, prioritize testing on:

| Device            | Android Version | Reason                          |
|-------------------|----------------|---------------------------------|
| Samsung Galaxy A14| Android 13     | Most popular budget phone       |
| Xiaomi Redmi Note 12| Android 13  | Widely used in India            |
| Google Pixel 6    | Android 14     | Stock Android reference device  |
| Samsung Galaxy S23| Android 14     | Premium flagship validation     |
| OnePlus Nord CE 3 | Android 13     | Popular mid-range in gyms       |

---

## Notes
- Firebase Test Lab's free tier resets daily (15 tests/day on physical devices, 10/day on virtual).
- BrowserStack free trial typically offers 100 minutes of testing.
- Always test with **both portrait and landscape** orientations.
- Test with **low network conditions** (3G simulation) to verify loading states and skeleton loaders work correctly.
