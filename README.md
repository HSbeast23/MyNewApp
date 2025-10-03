
# 🩸 BloodLink

Connecting donors and receivers in real time to make every unit of blood count.

[![Made with Expo](https://img.shields.io/badge/Made%20with-Expo-1B1F23.svg)](https://expo.dev/) 
[![Powered by Firebase](https://img.shields.io/badge/Powered%20by-Firebase-FFCA28.svg)](https://firebase.google.com/) 
[![React Native](https://img.shields.io/badge/React%20Native-0.81.x-61dafb.svg)](https://reactnative.dev/) 
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> BloodLink is a production-ready React Native application that streamlines blood donation requests, donor engagement, and hospital coordination through a unified, secure platform.

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Core Features](#-core-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Product Screenshot](#-product-screenshot)
- [Admin Dashboard Highlights](#-admin-dashboard-highlights)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Build & Deployment](#-build--deployment)
- [Firebase Configuration Checklist](#-firebase-configuration-checklist)
- [Admin & Security Notes](#-admin--security-notes)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🩺 Overview

BloodLink empowers hospitals, administrators, and volunteers to collaborate around urgent blood requirements. The application provides streamlined donor onboarding, intelligent matching, and real-time notifications so that the right donor can be connected to the right receiver within minutes. A dedicated admin suite ensures that blood banks maintain visibility over donation activity, matched pairs, and operational KPIs.

---

## ✨ Core Features

- **Smart blood requests** with priority, hospital/location metadata, and real-time status tracking
- **Context-aware donor matching** based on blood group, proximity, and historical responsiveness
- **In-app notifications** for donors and receivers, including seen/unseen indicators and action prompts
- **Role-based experiences** for donors, receivers, and administrators with secure access control
- **Comprehensive admin console** covering dashboards, matched pairs management, user administration, and analytics
- **Multi-language readiness** via a centralized translation layer for inclusive access
- **Firebase-first architecture** for authentication, Firestore persistence, and Cloud Messaging delivery

---

## 🏗️ Architecture & Tech Stack

| Layer | Tooling |
| --- | --- |
| Mobile runtime | React Native (Expo), React Navigation, React Native Paper |
| State & Context | React Context API, custom hooks, persistent storage helpers |
| Backend services | Firebase Authentication, Cloud Firestore, Cloud Functions, FCM |
| CI/CD & Build | EAS Build, Expo Application Services, npm scripts |
| Quality & UX | Lottie animations, reusable UI components, adaptive splash and icon assets |

---

## 🖼️ Product Screenshot

![BloodLink main screen](./assets/Readme-img/WhatsApp%20Image%202025-10-04%20at%2000.13.52_00fa3f59.jpg)

*Preview of the BloodLink home experience showcasing curated donor cards and critical actions.*

---

## 📲 User Journey Gallery

<div align="center">
   <img src="./assets/Readme-img/WhatsApp%20Image%202025-10-04%20at%2000.13.53_181995f2.jpg" alt="Secure email login screen" width="30%" />
   <img src="./assets/Readme-img/WhatsApp%20Image%202025-10-04%20at%2000.13.53_b58770ac.jpg" alt="Personalized donor discovery cards" width="30%" />
   <img src="./assets/Readme-img/WhatsApp%20Image%202025-10-04%20at%2000.13.53_ee86ca83.jpg" alt="Urgent request creation form" width="30%" />
</div>

- **Simple onboarding:** Email-first authentication keeps sign-in frictionless for donors and receivers.
- **Guided discovery:** Curated donor cards surface compatibility details and quick actions.
- **Streamlined requests:** Rich forms capture urgency, hospital, and blood group metadata in seconds.

---

## 🧭 Admin Dashboard Highlights

<div align="center">
   <img src="./assets/Readme-img/WhatsApp%20Image%202025-10-04%20at%2000.28.07_7e00ee81.jpg" alt="Admin dashboard overview" width="45%" />
   <img src="./assets/Readme-img/WhatsApp%20Image%202025-10-04%20at%2000.28.08_7ae9264f.jpg" alt="Admin analytics insights" width="45%" />
</div>

<div align="center">
   <img src="./assets/Readme-img/WhatsApp%20Image%202025-10-04%20at%2000.28.07_9e4aa1ca.jpg" alt="Admin donor management table" width="45%" />
   <img src="./assets/Readme-img/WhatsApp%20Image%202025-10-04%20at%2000.28.08_83d538c5.jpg" alt="Moderation actions for pending requests" width="45%" />
</div>

- **Unified control center:** Quickly approve blood requests, monitor donor availability, and track matched cases in a consolidated view.
- **Actionable analytics:** Real-time charts surface donation trends, high-demand blood groups, and pending verifications to guide operational decisions.
- **Secure user management:** Admins can elevate roles, lock accounts, or reset access in seconds with full audit visibility.
- **Environment-driven onboarding:** Bootstrap credentials come from `EXPO_PUBLIC_ADMIN_EMAIL` and `EXPO_PUBLIC_ADMIN_PASSWORD`, keeping secrets out of the repository.

> 📌 *Replace or extend these visuals with your own admin screenshots by updating the files inside `assets/Readme-img/`.*

---

## 🚀 Getting Started

### Prerequisites

- Node.js **18.x LTS** (or newer)
- npm **9+** or Yarn **1.22+**
- Expo CLI (`npm install -g expo-cli`)
- Firebase project with Authentication, Firestore, and Cloud Messaging enabled

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/HSBEAST23/MyNewApp.git
   cd MyNewApp
   ```
2. **Install project dependencies**
   ```bash
   npm install
   ```
3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Populate the .env file with Firebase keys, EXPO_PUBLIC_ADMIN_EMAIL, and EXPO_PUBLIC_ADMIN_PASSWORD
   ```
4. **Add Firebase configuration files**
   - Place `google-services.json` in the project root (Android)
   - Download a Firebase service account if Cloud Functions are required and store it at `functions/serviceAccountKey.json`
5. **Start the Expo development server**
   ```bash
   npm run start
   ```
6. **Run the app**
   - Scan the QR code with Expo Go (Android) or the Camera app (iOS)
   - Use `a`/`i` within the terminal to launch Android/iOS simulators respectively

### Helpful npm Scripts

| Command | Description |
| --- | --- |
| `npm run start` | Launch the Expo Metro bundler |
| `npm run android` | Run the app on a connected Android device/emulator |
| `npm run ios` | Run the app on an iOS simulator (macOS only) |
| `npm run lint` | Execute lint checks and formatting validations |

---

## 📂 Project Structure

```text
MyNewApp/
├── App.js
├── assets/
│   ├── Readme-img/        # Marketing screenshots used in this README
│   ├── animations/        # Lottie files for onboarding & micro-interactions
│   └── images/            # Brand logos, splash assets, illustrations
├── src/
│   ├── components/        # Reusable UI primitives (ImageCarousel, etc.)
│   ├── contexts/          # React Context providers (LanguageContext)
│   ├── hooks/             # Custom hooks (useTranslation, data fetchers)
│   ├── navigation/        # Navigators for donor, receiver, and admin flows
│   ├── screens/           # Feature screens including admin dashboard suite
│   ├── services/          # Firebase auth and API wrappers
│   ├── translations/      # Centralized translation registry
│   └── utils/             # Asset loaders, formatters, helper utilities
├── functions/             # (Optional) Firebase Cloud Functions source
├── app.json               # Expo configuration
└── eas.json               # EAS build profiles
```

---

## 🧱 Build & Deployment

### Expo Application Services (EAS)

```bash
# Android
eas build -p android --profile development

eas build -p android --profile preview

eas build -p android --profile production

# iOS
eas build -p ios --profile development

eas build -p ios --profile production
```

> ℹ️ Sign-in credentials, keystore files, and provisioning profiles should be managed through EAS secrets or your preferred secrets vault.

---

## 🔐 Firebase Configuration Checklist

- Enable **Email/Password** and (optional) Social providers in Firebase Authentication
- Create Firestore collections: `users`, `BloodDonors`, `Bloodreceiver`, and supporting analytics collections
- Configure Firestore security rules to enforce role-based access (`isAdmin`, `isDonor`, etc.)
- Set up Cloud Messaging for donor/receiver notification delivery
- (Optional) Deploy Cloud Functions for scheduled tasks and notification fan-out

---

## 🛡️ Admin & Security Notes

- Default admin credentials should be rotated before production launches
- Bootstrap values are injected via `EXPO_PUBLIC_ADMIN_EMAIL` / `EXPO_PUBLIC_ADMIN_PASSWORD`; remove or rotate them after provisioning the first admin
- Sensitive artifacts (`.env`, `google-services.json`, `serviceAccountKey.json`, keystore files) **must not** be committed
- Refer to `SECURITY.md` for guidance on hardening Firebase rules and rotating keys
- Matched pairs management and user suspension flows are surfaced under the Admin navigation stack

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-update`
3. Commit with conventional messages: `git commit -m "feat: add donation reminders"`
4. Push to your fork and open a Pull Request describing the change and test coverage

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 📬 Contact

- **Project Maintainer:** HAARHISH  
- **Repository:** [https://github.com/HSBEAST23/MyNewApp](https://github.com/HSBEAST23/MyNewApp)

<div align="center">
   <sub>Built with ❤️ to support lifesaving causes.</sub>
</div>
