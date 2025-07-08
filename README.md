# TPolls Mini-App

A decentralized polling application built on the TON blockchain, designed as a Telegram Mini App. Create and participate in polls with transparency and security powered by blockchain technology.

## Features

- 🗳️ **Create Polls**: Launch polls with custom options and settings
- ⚡ **Fast & Secure**: Built on TON blockchain for transparency and immutability
- 🎯 **Easy Voting**: Simple interface for quick participation
- 💳 **TON Connect**: Seamless wallet integration
- 📱 **Telegram Integration**: Native Telegram Mini App experience
- 🎨 **Theme Support**: Adapts to Telegram's theme variables

## Tech Stack

- **Frontend**: React 18 + Vite
- **Blockchain**: TON (The Open Network)
- **Wallet**: TON Connect SDK
- **Platform**: Telegram Mini App
- **Styling**: CSS with Telegram theme variables

## Project Structure

```
src/
├── components/
│   ├── Welcome.jsx          # Welcome/Login page component
│   ├── Welcome.css          # Welcome page styles
│   ├── MainApp.jsx          # Main application component
│   └── MainApp.css          # Main app styles
├── App.jsx                  # Root component with navigation
├── main.jsx                 # App entry point
└── index.css               # Global styles
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- TON wallet (for testing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tpolls-miniapp-claude
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Welcome Page
- Users land on a welcome screen with app branding
- Feature highlights showcase the app's capabilities
- TON Connect button for wallet connection
- Responsive design optimized for mobile

### Main Application
- Dashboard appears after successful wallet connection
- Action buttons for core functionality:
  - Create New Poll
  - Browse Polls
  - My Polls
- Header with wallet info and disconnect option

## Telegram Mini App Integration

This app is designed to work within Telegram as a Mini App. Key integrations include:

- **WebApp API**: Uses `window.Telegram.WebApp` for native features
- **Haptic Feedback**: Provides tactile feedback on interactions
- **Theme Variables**: Adapts to user's Telegram theme
- **Auto-expand**: Automatically expands to full screen

## TON Connect Integration

The app uses TON Connect for secure wallet integration:

- **UI Components**: Pre-built TON Connect UI components
- **State Management**: Real-time wallet connection status
- **Event Handling**: Listens for wallet connection/disconnection
- **Manifest**: Uses TON Connect manifest for wallet compatibility

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Style

- Follow React best practices
- Use functional components with hooks
- Maintain consistent file naming
- Keep components modular and reusable

### Adding New Features

1. Create component files in `src/components/`
2. Add corresponding CSS files for styling
3. Update navigation in `App.jsx` if needed
4. Use Telegram theme variables for consistent styling

## Environment Variables

Create a `.env` file in the root directory for environment-specific configurations:

```env
# TON Smart Contract Address (required)
REACT_APP_TPOLLS_CONTRACT_ADDRESS=EQDzYUsVz1PZ4mCOFHYdchV0J0Xs0Qz9DEx7nEMqGJ_OsZ30

# Gasless Voting Relayer Endpoint (optional)
REACT_APP_RELAYER_ENDPOINT=http://localhost:3001/api/relay
```

### Environment Variables Description

- **`REACT_APP_TPOLLS_CONTRACT_ADDRESS`**: The address of the deployed TPollsDapp smart contract on TON blockchain. If not set, uses the default contract address.
- **`REACT_APP_RELAYER_ENDPOINT`**: URL of the relayer service for gasless transactions. If not set, defaults to `http://localhost:3001/api/relay` for development.

Copy `.env.example` to `.env` and update the values as needed for your deployment.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Open an issue on GitHub
- Contact the development team
- Check the [TON Connect documentation](https://docs.ton.org/develop/dapps/ton-connect)

## Roadmap

- [ ] Poll creation functionality
- [ ] Poll browsing and filtering
- [ ] Voting mechanism
- [ ] Poll results visualization
- [ ] User profile management
- [ ] Advanced poll options
- [ ] Social sharing features

---

Built with ❤️ for the TON ecosystem