# PokemonDex Pokedex App Pokeball

[![Expo Go](https://img.shields.io/badge/Expo%20Go-4630EB?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/go)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A Pokedex application built using Expo (React Native) that allows users to browse, search, filter, and view details about various Pokémon. It also includes features like theme switching and marking favorites.

[**Access the deployed web version here!**](https://kieenn.github.io/PokemonDex/)

## ✨ Features

- **Browse Pokémon:** View a comprehensive list of Pokémon with a responsive grid layout.
- **Detailed View:** Tap on a Pokémon to see its details, including stats, abilities, Pokédex entry, evolution chain, etc.
- **Search:** Quickly find Pokémon by name using the search bar.
- **Advanced Filtering:** Filter the main list by Pokémon Type and Region using dropdown selectors.
- **Favorites:** Mark Pokémon as favorites using a heart icon. Loved Pokémon are saved locally using AsyncStorage.
- **Favorites List:** View all your favorited Pokémon on a dedicated tab.
- **Theme Switching:** Toggle between Light and Dark themes.
- **Web Deployment:** Accessible as a web application via GitHub Pages.
- **Responsive Design:** The grid layout adapts to different screen sizes.

## Tech Stack

- **Framework:** Expo SDK (React Native)
- **Language:** TypeScript
- **Navigation:** Expo Router (File-based routing)
- **State Management:** React Context API (for Theme and Favorites)
- **Local Storage:** `@react-native-async-storage/async-storage`
- **HTTP Client:** Axios (for fetching from PokeAPI)
- **UI Components:** React Native core components, `@react-native-picker/picker`

## Getting Started

### Prerequisites

- Node.js (LTS version recommended, e.g., v18 or later)
- npm or yarn
- Git
- **(Optional for Mobile Testing)**
  - Expo Go App on your iOS or Android device.
  - Android Studio (for Android emulator)
  - Xcode (for iOS simulator - macOS only)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kieenn/PokemonDex.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd PokemonDex
    # Or 'cd pokedex' if your local folder name is different
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    # OR
    # yarn install
    ```

## Running the App

You can run the application on different platforms:

### 1. Web Browser (Recommended for quick testing)

```bash
npx expo start --web
# OR using package.json script:
npm run web
# OR
yarn web
```
