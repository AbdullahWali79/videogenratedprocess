# Video Workflow Organizer 🎬

A complete, private web application designed to organize and streamline the manual video production pipeline. Track scripts, character continuity, scene breakdowns, prompt libraries (Midjourney, Runway, Kling, Suno, ElevenLabs), audio recordings, video clips, and final render deliverables—all in one place.

---

## 📋 Table of Contents
1. [Overview & Features](#-overview--features)
2. [Quick Start (Download & Run Locally)](#-quick-start-download--run-locally)
   - [Urdu / Roman Urdu Guide (لوکل رن کرنے کا طریقہ)](#-urdu--roman-urdu-guide-لوکل-رن-کرنے-کا-طریقہ)
3. [Firebase Backend Configuration](#-firebase-backend-configuration)
   - [1. Authentication Setup](#1-authentication-setup)
   - [2. Cloud Firestore Database Setup](#2-cloud-firestore-database-setup)
   - [3. Firebase Storage Setup](#3-firebase-storage-setup)
4. [Deployment Guides](#-deployment-guides)
   - [Deploy to Firebase Hosting](#option-1-deploy-to-firebase-hosting-recommended)
   - [Deploy to Vercel](#option-2-deploy-to-vercel)
   - [Deploy to Netlify](#option-3-deploy-to-netlify)
5. [Security Rules Deployment](#-security-rules-deployment)
6. [Project Structure](#-project-structure)
7. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🌟 Overview & Features

- **6-Stage Production Pipeline**:
  $$\text{Story} \rightarrow \text{Scenes \& Characters} \rightarrow \text{Image Prompts \& Images} \rightarrow \text{Voice \& Music} \rightarrow \text{Scene Videos} \rightarrow \text{Final Video}$$
- **Zero-AI Content Generation Overhead**: Manual workflow organizer with prompt repositories and file vaults—no paid AI API keys required.
- **Urdu, Roman Urdu & Multilingual Script Editor**: Full Unicode and RTL (Right-to-Left) support with line-break preservation.
- **Multiple Prompt Vault**: Store, categorize (`story`, `character`, `image`, `voice`, `music`, `video`, `editing`), tag by tool, and copy prompts with 1 click.
- **Scene Duplication**: Clones scene actions and prompts with clean new IDs without duplicating media files.
- **Media Previews & Master Selections**: Built-in image lightboxes, HTML5 audio preview players, and video clip players.
- **Dynamic Task Recommendations**: Recommends the earliest unfinished task with a 1-click jump button.
- **Pre-Publish Checklist**: Pre-flight checks before final delivery with explicit override options.
- **Data Export & Privacy**: Full JSON metadata export, readable Markdown script export, and strict user-scoped Firebase security rules.

---

## 🚀 Quick Start (Download & Run Locally)

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js**: Version 18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm** (comes with Node.js) or **bun** / **pnpm** / **yarn**
- **Git**

### Step 1: Download or Clone the Repository
```bash
# Clone the repository
git clone <YOUR_REPOSITORY_URL>

# Enter the project directory
cd video-workflow-organizer
```
*(If you downloaded a ZIP file, extract it to a folder and open your terminal in that folder).*

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Firebase
Check that `firebase-applet-config.json` exists in the project root with your Firebase project credentials:
```json
{
  "projectId": "YOUR_FIREBASE_PROJECT_ID",
  "appId": "YOUR_FIREBASE_APP_ID",
  "apiKey": "YOUR_FIREBASE_API_KEY",
  "authDomain": "YOUR_FIREBASE_PROJECT_ID.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "YOUR_FIREBASE_PROJECT_ID.firebasestorage.app",
  "messagingSenderId": "YOUR_MESSAGING_SENDER_ID"
}
```

### Step 4: Start the Local Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🇵🇰 Urdu / Roman Urdu Guide (لوکل رن کرنے کا طریقہ)

اگر آپ اس ویب سائٹ کو ڈاؤنلوڈ کر کے اپنے کمپیوٹر پر چلانا چاہتے ہیں، تو درج ذیل آسان اقدامات پر عمل کریں:

### 1. ضروری سافٹ ویئر (Prerequisites)
- اپنے کمپیوٹر پر **Node.js** (ورژن 18 یا اس سے نیا) انسٹال کریں: [https://nodejs.org](https://nodejs.org)

### 2. کوڈ ڈاؤنلوڈ اور اوپن کریں
- پروجیکٹ کی زپ فائل ڈاؤنلوڈ کر کے ان زپ (Extract) کریں یا `git clone` کریں۔
- فولڈر میں ٹرمینل یا Command Prompt کھولیں۔

### 3. لائبریریز انسٹال کریں (Install Dependencies)
ٹرمینل میں یہ کمانڈ چلائیں:
```bash
npm install
```

### 4. فائر بیس کنفیگریشن چیک کریں
پروجیکٹ کی مین ڈائریکٹری میں `firebase-applet-config.json` فائل موجود ہوگی۔ اس میں آپ کے فائر بیس کے کریڈنشلز شامل ہیں۔ اگر آپ نیا فائر بیس پروجیکٹ استعمال کر رہے ہیں تو نیچے دیئے گئے "Firebase Backend Configuration" سیکشن کے مطابق اپنی کیز درج کریں۔

### 5. ویب سائٹ رن کریں (Run Local Server)
```bash
npm run dev
```
ٹرمینل میں لنک آئے گا، اپنے براؤزر میں کھولیں:
👉 **`http://localhost:3000`**

---

## 🔐 Firebase Backend Configuration

This application uses **Firebase Authentication**, **Cloud Firestore**, and **Firebase Storage**.

### 1. Authentication Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project and navigate to **Build > Authentication**.
3. Under **Sign-in method**, enable:
   - **Email/Password**
   - **Google** (Set project public-facing name and support email).
4. Under **Settings > Authorized domains**, make sure `localhost` and your production deployment domain (e.g. `your-app.web.app` or `your-app.vercel.app`) are listed.

### 2. Cloud Firestore Database Setup
1. In Firebase Console, go to **Build > Firestore Database**.
2. Click **Create database** (choose your nearest region).
3. Set Security Rules:
   - Copy the rules from the included `firestore.rules` file in the project.
   - Go to **Firestore > Rules** tab, paste the rules, and click **Publish**.

### 3. Firebase Storage Setup
1. In Firebase Console, go to **Build > Storage**.
2. Click **Get Started** to create your storage bucket.
3. Set Storage Rules:
   - Copy the rules from the included `storage.rules` file in the project.
   - Go to **Storage > Rules** tab, paste the rules, and click **Publish**.

---

## 🌐 Deployment Guides

### Option 1: Deploy to Firebase Hosting (Recommended)

Firebase Hosting provides fast SSL-enabled hosting and works directly with your Firebase backend:

1. Install the Firebase CLI globally (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in the project directory:
   ```bash
   firebase init
   ```
   - Select **Hosting: Configure files for Firebase Hosting**.
   - Select **Use an existing project** and pick your project.
   - What do you want to use as your public directory? Type: `dist`
   - Configure as a single-page app (rewrite all urls to /index.html)? Type: `Yes`
   - Set up automatic builds and deploys with GitHub? Type: `No` (or `Yes` if desired).

4. Build the production bundle:
   ```bash
   npm run build
   ```

5. Deploy rules and hosting to Firebase:
   ```bash
   firebase deploy
   ```
   Your site will be live at: `https://<YOUR_PROJECT_ID>.web.app`

---

### Option 2: Deploy to Vercel

1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Import your repository.
4. Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **Deploy**.
6. **Important**: Add your custom Vercel domain (e.g. `your-project.vercel.app`) to **Firebase Console > Authentication > Settings > Authorized Domains**.

---

### Option 3: Deploy to Netlify

1. Push your code to GitHub.
2. Sign in to [Netlify](https://www.netlify.com/) and click **Add new site > Import an existing project**.
3. Choose your repository.
4. Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add a `_redirects` file in `public/_redirects` (or `netlify.toml`) containing:
   ```
   /*    /index.html   200
   ```
6. Click **Deploy Site**.
7. Add the Netlify URL to your Firebase Authorized Domains.

---

## 🛡️ Security Rules Deployment

The project includes pre-hardened, zero-trust rules for both Firestore and Storage that enforce strict user isolation:

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules
```bash
firebase deploy --only storage
```

### Deploy Both Together
```bash
firebase deploy --only firestore:rules,storage
```

---

## 📁 Project Structure

```
video-workflow-organizer/
├── .env.example                  # Environment configuration documentation
├── firebase-applet-config.json   # Live Firebase client connection keys
├── firebase-blueprint.json       # Structural schema representation
├── firestore.rules               # Firestore ABAC security rules
├── storage.rules                 # Firebase Storage user-scoped security rules
├── index.html                    # Entry HTML document with synced metadata
├── package.json                  # Dependencies and build scripts
├── vite.config.ts                # Vite build and port configuration (port 3000)
└── src/
    ├── main.tsx                  # React DOM root entry point
    ├── App.tsx                   # Master router, auth guard & stage switcher
    ├── index.css                 # Tailwind CSS styling
    ├── types/                    # TypeScript interfaces & types
    │   └── index.ts              # Project, Scene, Prompt, Character, Asset models
    ├── context/
    │   └── AuthContext.tsx       # Firebase Authentication state & handlers
    ├── services/
    │   ├── firebase.ts           # Firebase SDK initialization & connection test
    │   ├── firestoreErrors.ts    # JSON error interceptor
    │   ├── db.ts                 # Realtime Firestore CRUD & Storage upload service
    │   ├── guidance.ts           # Next-task recommendation engine
    │   └── exportService.ts      # JSON and Markdown exporter
    └── components/
        ├── Navbar.tsx            # Header with user menu & Firebase rules modal
        ├── WorkflowGuide.tsx     # 6-step manual video creation pipeline banner
        ├── Dashboard.tsx         # Projects overview, search, filters & cards
        ├── CreateProjectModal.tsx# "+ Add Video Process" modal dialog
        ├── ProjectWorkspace.tsx  # Workspace coordinator & stage navigator
        ├── MediaUploader.tsx     # Resumable file uploader with progress bar
        ├── PromptCard.tsx        # Prompt card with 1-click clipboard copy
        ├── PromptModal.tsx       # Prompt creator & editor modal
        ├── ConfirmModal.tsx      # Danger deletion confirmation modal
        ├── Toast.tsx             # Toast notification provider
        ├── FirebaseSetupGuideModal.tsx # In-app Firebase instructions modal
        └── stages/
            ├── StoryStage.tsx        # Stage 1: Story script & Urdu/RTL editor
            ├── ScenesStage.tsx       # Stage 2: Scene builder & characters
            ├── ImagesStage.tsx       # Stage 3: Image prompts & primary frames
            ├── VoiceMusicStage.tsx   # Stage 4: Voiceover audio & score
            ├── SceneVideosStage.tsx  # Stage 5: Video prompts & scene clips
            ├── FinalVideoStage.tsx   # Stage 6: Full assembly & checklist
            └── AllPromptsStage.tsx   # Stage 7: Centralized prompt repository
```

---

## ❓ Troubleshooting & FAQs

### Q: "Firebase: Error (auth/popup-blocked)" when signing in with Google?
**Fix**: Ensure your browser allows popups for `localhost:3000` or your deployed URL.

### Q: "Missing or insufficient permissions" when reading or saving data?
**Fix**:
1. Verify that you are signed in.
2. Deploy the provided `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Q: Storage upload errors ("Firebase Storage: User does not have permission")?
**Fix**:
1. Check that Firebase Storage is enabled in your Firebase console.
2. Deploy `storage.rules`:
   ```bash
   firebase deploy --only storage
   ```

### Q: How do I export or backup my project?
**Fix**:
- In the Project Workspace, click **Export JSON** to download a structured backup of all metadata, scenes, prompts, and notes.
- Click **Markdown** to download a formatted script document containing the story, character bios, and scene prompts.

---

## 📄 License
Apache-2.0 License. Free for personal and commercial manual video creation workflows.
