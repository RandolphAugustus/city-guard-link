# 🛡️ City Guard Link

**Privacy-Preserving Report System with Fully Homomorphic Encryption (FHE)**

City Guard Link is a decentralized application that enables citizens to submit encrypted reports securely using Fully Homomorphic Encryption (FHE). The system ensures complete privacy while maintaining transparency and accountability through blockchain technology.

## 🎥 Demo

### Live Demo
🌐 **[Try City Guard Link](https://city-guard-link-atbst.vercel.app/)**

### Video Demonstration
📹 **[Watch Demo Video](./city-guard-link-demo.mp4)**

## ✨ Features

- 🔐 **End-to-End Encryption**: Reports are encrypted using ChaCha20 with FHE-protected keys
- 🔒 **Privacy-First**: Only the reporter can decrypt their own submissions
- ⛓️ **Blockchain Security**: Immutable storage on Ethereum with FHEVM
- 🎯 **User-Friendly**: Modern React interface with MetaMask integration
- 🛡️ **Access Control**: Granular permissions using FHE allow/deny mechanisms
- 📱 **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🏗️ Architecture

### Smart Contracts
- **CityGuard.sol**: Main contract for encrypted report storage with comprehensive input validation
- **FHECounter.sol**: Example FHE counter with overflow/underflow protection

### Frontend
- **Next.js 15**: Modern React framework with App Router
- **TypeScript**: Type-safe development with strict validation
- **TailwindCSS**: Responsive and accessible UI components
- **Wagmi + RainbowKit**: Ethereum wallet integration
- **FHEVM SDK**: Client-side encryption and decryption

### Encryption Stack
- **ChaCha20**: Symmetric encryption for report content
- **FHEVM**: Fully homomorphic encryption for key protection
- **Zama Protocol**: FHE operations on encrypted data

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm/yarn/pnpm**: Package manager
- **MetaMask**: Browser wallet extension

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RandolphAugustus/city-guard-link.git
   cd city-guard-link
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Root directory
   cp .env.example .env
   
   # Configure your private keys and RPC URLs
   echo "SEPOLIA_PRIVATE_KEY=your_private_key" >> .env
   echo "SEPOLIA_RPC_URL=your_rpc_url" >> .env
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

6. **Start local development**
   ```bash
   # Terminal 1: Start Hardhat node
   npm run node
   
   # Terminal 2: Deploy contracts
   npx hardhat deploy --network localhost
   
   # Terminal 3: Start frontend
   cd frontend && npm run dev
   ```

## 📁 Project Structure

```
city-guard-link/
├── contracts/                 # Smart contracts
│   ├── CityGuard.sol         # Main report storage contract
│   └── FHECounter.sol        # Example FHE counter
├── frontend/                 # Next.js application
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   │   ├── CityGuardApp.tsx  # Main application
│   │   ├── ReportSubmit.tsx  # Report submission form
│   │   ├── ReportList.tsx    # Report display and decryption
│   │   └── ErrorBoundary.tsx # Error handling
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   │   ├── chacha20.ts       # ChaCha20 encryption
│   │   └── bytes.ts          # Byte manipulation
│   └── fhevm/                # FHEVM integration
├── deploy/                   # Deployment scripts
├── test/                     # Contract tests
├── tasks/                    # Hardhat tasks
└── city-guard-link-demo.mp4  # Demo video
```

## 🔧 Available Scripts

### Root Directory
| Script | Description |
|--------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm run test` | Run contract tests |
| `npm run coverage` | Generate test coverage |
| `npm run lint` | Run linting checks |
| `npm run node` | Start local Hardhat node |

### Frontend Directory
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run Next.js linting |
| `npm run test` | Run frontend tests |

## 🔐 Security Features

### Smart Contract Security
- ✅ **Input Validation**: Comprehensive parameter checking
- ✅ **Access Control**: Reporter-only permissions for updates
- ✅ **Bounds Checking**: Array access protection
- ✅ **Overflow Protection**: Safe arithmetic operations
- ✅ **Reentrancy Protection**: State-changing function guards

### Frontend Security
- ✅ **Type Safety**: Strict TypeScript configuration
- ✅ **Input Sanitization**: Client-side validation
- ✅ **Error Boundaries**: Graceful error handling
- ✅ **Memory Management**: Optimized React hooks
- ✅ **Secure Random**: Cryptographically secure randomness

### Encryption Security
- ✅ **ChaCha20**: Industry-standard symmetric encryption
- ✅ **Key Derivation**: Secure password-based key generation
- ✅ **FHE Protection**: Homomorphic encryption for keys
- ✅ **Nonce Management**: Unique nonces for each encryption

## 🌐 Deployment

### Sepolia Testnet
```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify contracts
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Frontend Deployment
The frontend is deployed on Vercel and automatically updates with each commit to the main branch.

## 🧪 Testing

### Contract Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run coverage

# Test on Sepolia
npm run test:sepolia
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Protocol](https://docs.zama.ai)
- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/RandolphAugustus/city-guard-link/issues)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

## 🏆 Acknowledgments

- **Zama**: For the FHEVM protocol and encryption libraries
- **Ethereum Foundation**: For the blockchain infrastructure
- **Next.js Team**: For the excellent React framework
- **MetaMask**: For wallet integration capabilities

---

**Built with 🔐 privacy and ❤️ by the City Guard team**
