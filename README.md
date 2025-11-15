# 🎯 AlgoHealX – Blockchain Medicine Tracking System

[![Algorand](https://img.shields.io/badge/Blockchain-Algorand-000000?style=for-the-badge&logo=algorand&logoColor=white)](https://algorand.com)
[![PyTeal](https://img.shields.io/badge/Smart_Contracts-PyTeal-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://pyteal.readthedocs.io)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Healthcare](https://img.shields.io/badge/Industry-Healthcare-FF6B6B?style=for-the-badge&logo=heart&logoColor=white)]()
[![Supply Chain](https://img.shields.io/badge/Use_Case-Supply_Chain-4ECDC4?style=for-the-badge&logo=truck&logoColor=white)]()


## 🔭 Overview

AlgoHealX is a next-generation blockchain-based medicine tracking system designed to eliminate counterfeit drugs and bring complete transparency to the pharmaceutical supply chain.

Using **Algorand smart contracts**, AlgoHealX ensures that every stage of a medicine batch's journey is recorded immutably — from manufacturing ➝ regulatory approval ➝ distribution ➝ pharmacy delivery ➝ consumer verification.

Every transaction is **tamper-proof**, **auditable**, and **verifiable**, making AlgoHealX a trusted solution for:

- 🏭 **Manufacturers**
- 🛂 **Regulators**
- 🚚 **Distributors**
- 👤 **Consumers**

With blockchain security and complete traceability, AlgoHealX aims to eliminate counterfeit medicines and bring **trust**, **safety**, and **transparency** to healthcare supply chains.


### 🚀 Features

- **Immutable Records**: Every medicine batch is tracked on the Algorand blockchain
- **Supply Chain Transparency**: Full visibility from manufacturing to consumer
- **Counterfeit Prevention**: Verification system to detect fake medicines
- **Multi-Stakeholder Access**: Role-based access for all supply chain participants
- **Consumer Verification**: End users can verify medicine authenticity

#### 🔐 Security

AlgoHealX leverages Algorand's Pure Proof-of-Stake consensus mechanism to ensure:

- **High Security**: Cryptographic verification of all transactions
- **Immutability**: Records cannot be altered or deleted
- **Decentralization**: No single point of failure
- **Fast Finality**: Transactions confirmed in seconds


### 🛠️ Technology Stack

- **Blockchain**: Algorand
- **Smart Contracts**: PyTeal
- **Frontend**: React, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui
- **State Management**: TanStack Query

---
## 🛠️ Setup & Installation

### **Prerequisites**
Ensure these tools are installed:

- AlgoKit CLI  
- Docker (required for LocalNet)  
- Node.js & npm  
- Python 3.10+  

### ⚙️ Initial Setup

#### **1. Clone the Repository**
```sh
git clone https://github.com/nikshiptha2505/AlgoHealX.git
```

#### **2. Open Command Prompt in the Project Folder**

#### **3. Start AlgoKit LocalNet**

```sh
algokit localnet start
```

#### **4. Install All Dependencies**

```sh
algokit project bootstrap all
```

#### **5. Build the Entire Project (Contracts + Frontend)**

```sh
algokit project build
```

### 🌐 Run the Frontend

#### **6. Navigate to the Frontend Folder**

```sh
cd projects
cd AlgoHealX-frontend
```

#### **7. Start the Development Server**

```sh
npm run dev
```

The website will be available at:

👉 **[http://localhost:8080](http://localhost:8080)**

---

## 📱 Live Deployment

Our smart contract is deployed and running on the **Algorand TestNet**:

🔗 **Contract Address**: [View on Lora Explorer](https://lora.algokit.io/testnet/application/749652245)

![AlgoHealX Smart Contract on Lora](./public/loraapp.jpg)

---
## 🏗️ Architecture & Components

AlgoHealX is built on the **AlgoKit Fullstack Template**, providing a complete blockchain solution with the following architecture:

### **Smart Contract Layer**
- **Drug Batch Lifecycle Management**: Handles full lifecycle operations—registration, approval, transfer, delivery, and verification of a medicine batch on Algorand.
- **Role-Based Access Control**: Enforces secure permissions for admin, producer, and regulator using on-chain sender checks.
- **Batch Metadata Storage**: Stores immutable and updatable batch details such as batch ID, drug name, manufacturer, dates, quantity, compliance score, and verification history.
- **Regulatory Authorization Workflow**: Enables regulators to approve, reject, or mark counterfeit, with proper audit timestamps and reasons.
- **Transfer & Supply Chain Tracking**: Tracks every movement of the drug batch, including sender, receiver, location, transfer count, and delivery confirmation.
- **QR & Authenticity Validation**: Stores a hash for QR verification, counts verification attempts, and enables authenticity checks across the supply chain.

### **Frontend Application (React + TypeScript)**
Located in `projects/AlgoHealX-frontend/`:
- **User Interfaces**: Role-specific dashboards for manufacturers, regulators, distributors, pharmacies, and consumers
- **Wallet Integration**: Connects to Algorand wallets for transaction signing
- **Database Integration**: Supabase backend for user management and data persistence
- **QR Code System**: Generates and verifies medicine batch QR codes
- **Real-time Tracking**: Displays medicine journey across the supply chain

### **Project Structure**
```
AlgoHealX/
├── projects/
│   ├── AlgoHealX-contracts/     # Python smart contracts
│   └── AlgoHealX-frontend/      # React frontend application
├── .algokit/                     # AlgoKit configuration
└── .vscode/                      # Development environment settings
```

### **Key Technologies**
- **Blockchain Platform**: Algorand (TestNet deployment)
- **Smart Contract Language**: PyTeal
- **Frontend Framework**: React 18.3.1 with TypeScript
- **Backend & Database**: Supabase (PostgreSQL, Authentication, Storage)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Build Tool**: Vite
- **State Management**: TanStack Query


### 🌐 Links

Our Project deployed frontend link:

- **Project URL**: [https://algohealx.netlify.app/](https://algohealx.netlify.app/)

---
### 📄 License

This project is licensed under the MIT License.

---
