# Welcome to HabiBeats! 🎵🚀

This is a [React Native](https://reactnative.dev/) project using [Expo](https://expo.dev), designed to bring music enthusiasts together with exciting features and seamless development capabilities. The project was initialized with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app), ensuring simplicity and scalability for both developers and users.

## Getting Started

### 1. **Clone the Repository**

Begin by cloning the project repository from GitHub:

```bash
git clone <repository-url>
```

Replace `<repository-url>` with the actual URL of the repository. After cloning, open the project folder in your development IDE (e.g., Visual Studio Code).

---

### 2. **Install Dependencies**

Once inside the project directory, use the terminal to install all required dependencies. Run:

```bash
npm install
```

This command reads the `package.json` file and installs all necessary packages for the project.

---

### 3. **Start the Development Server**

To begin working on the application, start the Expo development server:

```bash
npx expo start
```

This command opens the Expo Developer Tools in your default browser, allowing you to manage and debug the app.

---

### 4. **Run the Application**

You have several options to preview the app during development:

- **Expo Go (Real Device)**:  
  Download the [Expo Go app](https://expo.dev/client) from the App Store (iOS) or Google Play Store (Android). Scan the QR code displayed in the Expo Developer Tools or terminal to launch the app on your device.

- **Android Emulator**:  
  Ensure Android Studio is installed, and an emulator is configured. From the Expo Developer Tools, select the "Run on Android device/emulator" option.

- **iOS Simulator**:  
  If you’re on macOS and have Xcode installed, select the "Run on iOS simulator" option in the Expo Developer Tools.

---

### 5. **Make Changes and See Updates**

- Save any edits to the project files, and Expo will hot-reload the app to reflect your changes immediately.  
- Test your app across multiple devices or platforms to ensure cross-platform compatibility.

---

### 6. **Helpful Commands**

- **Clear Cache**:  
  If you encounter issues during development, clear the cache with:  
  ```bash
  npx expo start -c
  ```

- **Install New Packages**:  
  Add additional npm packages as needed with:  
  ```bash
  npm install <package-name>
  ```

- **Run Eject (Optional)**:  
  If you need native customizations, eject the project:  
  ```bash
  npx expo eject
  ```

  > **Note**: Ejecting creates native Android and iOS directories for advanced customization but makes the app incompatible with Expo Go.

---

### Troubleshooting Tips

1. **Device Connection Issues**:  
   Ensure your development machine and the device running Expo Go are on the same Wi-Fi network.

2. **Emulator Not Found**:  
   For Android, verify the emulator is running. For iOS, ensure Xcode is installed and the simulator is launched.

3. **Permission Errors**:  
   Some commands may require administrative privileges. Use `sudo` (macOS/Linux) or run your terminal as an administrator (Windows).

---

Enjoy building the HabiBeats experience! 🎧 If you have any questions or issues, refer to the [Expo Documentation](https://docs.expo.dev/) or reach out to the team.
