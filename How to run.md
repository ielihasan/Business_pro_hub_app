# How to Run the App

The terminal is telling you it's in **Expo Go mode** — you can see `Using Expo Go` and `Press s │ switch to development build`. Your app can't run in Expo Go because it uses `react-native-maps` and `expo-camera`.

**Two options:**

---

### Option 1 — Press `s` right now (quickest)

In that same terminal, just press **`s`**. It switches to dev client mode. You'll see:

```text
› Using development build
```

Then press **`a`** to open on Android. The already-installed APK on your Tecno will connect to Metro automatically.

---

### Option 2 — Always start in dev client mode (better habit)

Stop the current server (`Ctrl+C`) and run:

```powershell
npx expo start --dev-client
```

This skips Expo Go entirely and goes straight to dev client mode every time.

---

**Why this works:** `npx expo run:android` already built and installed the custom APK on your Tecno. You only need to run that again if you add new native modules. For daily development, `npx expo start --dev-client` (or `npx expo start` then press `s`) is all you need — Metro serves JS changes instantly.
