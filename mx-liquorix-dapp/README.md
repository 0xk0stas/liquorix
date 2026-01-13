# 🛡️ Liquorix: Leveraged Yield & Vault Management

![Liquorix Hero](./public/liquorix-hero.png)

## 🚀 Overview

**Liquorix** is a next-generation DeFi gateway built on the **MultiversX** blockchain, designed to simplify and supercharge leveraged yield strategies. It provides a high-fidelity, industrial-grade interface for managing positions in the **Liquorix** and **xLend** ecosystems.

Liquorix isn't just a dApp; it's a command center for your digital assets.

---

## ⚡ The Problem & Our Solution

### The Challenge
DeFi users often struggle with complex interfaces when trying to manage leveraged positions. Monitoring LTV (Loan-to-Value), handling swaps, and staking/unstaking across multiple protocols can be fragmented and error-prone.

### The Liquorix Solution
We’ve built a unified "Reactor" interface that combines:
- **One-Click Deposits/Withdrawals**: Seamlessly move between EGLD, XEGLD, and LQRX.
- **Precision Control**: Use our custom **Reactor Knob** for tactile amount selection.
- **Real-Time Position Tracking**: The **Examine** panel gives you a deep dive into your health factors and rewards.
- **Integrated Swaps**: Powered by XOXNO, perform essential trades without leaving the vault.

---

## 🛠️ Key Features

### 💎 Smart Staking & Vaults
Convert your EGLD into yield-bearing XEGLD or LQRX positions with automated management.

### 🔍 Examine Mode
Audit your portfolio with surgical precision. Track your LTV, collateral, and debt in real-time with a custom-built dashboard.

### ⚙️ Industrial UI
Experience DeFi like never before with our proprietary UI components:
- **ReactorKnob**: A high-precision tactile input for amount selection.
- **BluetoothKey**: A secure, animated transaction authorization component.
- **IndustrialSwitch**: Physical-style toggles for asset selection.

---

## 🏗️ Technology Stack

- **Blockchain**: [MultiversX](https://multiversx.com/) (Mainnet/Devnet)
- **Framework**: [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **SDKs**: [@multiversx/sdk-dapp](https://www.npmjs.com/package/@multiversx/sdk-dapp)
- **Integrations**: Liquorix, xLend, XOXNO API

---

## 🚦 Getting Started

### Prerequisites

- **Node.js**: 16.20.0+
- **pnpm**: 8.19.4+

### Setup

1. **Install Modules**
   ```bash
   pnpm install
   ```

2. **Configure Environment**
   Update `src/config/index.ts` or use the provided scripts to switch environments:
   ```bash
   pnpm copy-mainnet-config
   ```

3. **Launch the Dashboard**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the terminal.

---

## 🧪 Development & Passkeys

For developers working with Passkey authentication, ensure your local environment is configured for HTTPS:

```bash
# Generate locally-trusted SSL
mkcert localhost.multiversx.com localhost 127.0.0.1 ::1
```

---

## 🌟 Hackathon Judging Criteria

- **Innovation**: First-of-its-kind "Industrial DeFi" UI that prioritizes user engagement and precision.
- **Integration**: Deep integration with the MultiversX ecosystem (Liquorix, xLend).
- **Usability**: Simplified complex leveraged actions into a single intuitive flow.
- **Performance**: Optimized build using Vite and SWC for 100ms interaction latency.

---

## 🗺️ Roadmap

- [ ] **Automated De-leveraging**: Set custom health factor triggers.
- [ ] **Vault Strategies**: One-click "Yield Farming" templates.
- [ ] **Mobile App**: Native iOS/Android experience using MultiversX SDKs.

---

Built with ⚡ by the **Liquorix Team** for the MultiversX Ecosystem.
