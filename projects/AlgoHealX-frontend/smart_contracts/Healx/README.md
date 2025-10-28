# AlgoHealX Smart Contracts

This directory contains the PyTeal smart contracts for the AlgoHealX medicine tracking and verification system on Algorand blockchain.

## Contracts

### 1. Medicine Registry Contract (`medicine_registry.py`)
Handles the registration of new medicine batches on the blockchain.

**Features:**
- Register new medicine batches with complete metadata
- Track batch ID, drug name, manufacturer, dates, quantity
- Producer address verification
- Status management (pending, approved, rejected)

**Global State:**
- batch_id: Unique identifier for the batch
- drug_name: Name of the medicine
- manufacturer: Manufacturing company
- manufacture_date: Production date
- expiry_date: Expiration date
- quantity: Number of units
- producer_address: Wallet address of producer
- status: Current approval status
- timestamp: Last update time

### 2. Supply Chain Tracker Contract (`supply_chain_tracker.py`)
Tracks the movement of medicine through the supply chain.

**Features:**
- Record transfers between parties
- Track current location and custody
- Maintain transfer history count
- Status updates for logistics

**Global State:**
- batch_id: Medicine batch being tracked
- current_location: Current physical location
- sender_address: Previous custodian
- receiver_address: Current custodian
- transfer_count: Number of transfers
- last_transfer_timestamp: Time of last transfer
- status: Current logistics status

### 3. Verification Contract (`verification_contract.py`)
Provides medicine authenticity verification for consumers.

**Features:**
- Verify medicine using QR code hash
- Track verification attempts
- Maintain authenticity status
- Counterfeit detection

**Global State:**
- batch_id: Batch being verified
- verification_count: Number of verifications
- is_authentic: Authenticity flag (1=authentic, 0=counterfeit)
- last_verification_timestamp: Last verification time
- qr_code_hash: Hash of QR code for verification

### 4. Regulator Approval Contract (`regulator_approval.py`)
Manages regulatory approval/rejection process.

**Features:**
- Approve medicine batches
- Reject batches with reasons
- Compliance scoring
- Regulator authentication

**Global State:**
- batch_id: Batch under review
- regulator_address: Authorized regulator wallet
- approval_status: Current status (pending/approved/rejected)
- approval_timestamp: Time of decision
- rejection_reason: Reason if rejected
- compliance_score: Regulatory compliance score (0-100)

## Compilation

Each contract can be compiled to TEAL using:

```python
python medicine_registry.py
python supply_chain_tracker.py
python verification_contract.py
python regulator_approval.py
```

This will generate corresponding `.teal` files for deployment.

## Deployment

1. Install dependencies:
```bash
pip install pyteal py-algorand-sdk
```

2. Compile contracts to TEAL
3. Deploy using Algorand SDK or AlgoKit
4. Store application IDs for frontend integration

## Integration

The frontend integrates with these contracts through:
- Algorand SDK (algosdk)
- Pera Wallet for transaction signing
- Backend APIs for transaction construction

## Security

- All state-changing operations verify sender addresses
- Only authorized parties can update contract state
- Immutable audit trail on blockchain
- QR code hash verification prevents tampering
