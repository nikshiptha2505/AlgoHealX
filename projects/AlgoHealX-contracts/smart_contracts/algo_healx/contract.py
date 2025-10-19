from algopy import ARC4Contract, String, UInt64, Bytes, BoxRef, arc4
from algopy.arc4 import abimethod, Struct


class DrugBatch(Struct):
    batch_id: arc4.String
    drug_name: arc4.String
    producer: arc4.Address
    production_date: arc4.UInt64
    expiry_date: arc4.UInt64
    quantity: arc4.UInt64
    is_verified: arc4.Bool
    verifier: arc4.Address
    current_holder: arc4.Address
    qr_hash: arc4.String


class SupplyChainEvent(Struct):
    batch_id: arc4.String
    from_address: arc4.Address
    to_address: arc4.Address
    timestamp: arc4.UInt64
    event_type: arc4.String


class AlgoHealx(ARC4Contract):
    """
    AlgoHealX Smart Contract for Pharmaceutical Supply Chain Management

    Features:
    - Drug batch registration by producers
    - Government verification of drug batches
    - Supply chain tracking (producer → distributor → pharmacy)
    - Consumer authentication via QR codes
    """

    @abimethod()
    def register_drug_batch(
        self,
        batch_id: String,
        drug_name: String,
        production_date: UInt64,
        expiry_date: UInt64,
        quantity: UInt64,
        qr_hash: String,
    ) -> String:
        """
        Register a new drug batch on the blockchain.
        Called by pharmaceutical producers.

        Args:
            batch_id: Unique identifier for the batch
            drug_name: Name of the drug
            production_date: Unix timestamp of production
            expiry_date: Unix timestamp of expiry
            quantity: Number of units in the batch
            qr_hash: Hash embedded in the QR code

        Returns:
            Confirmation message with batch ID
        """
        # Create drug batch record
        drug_batch = DrugBatch(
            batch_id=arc4.String(batch_id),
            drug_name=arc4.String(drug_name),
            producer=arc4.Address(self.txn.sender),
            production_date=arc4.UInt64(production_date),
            expiry_date=arc4.UInt64(expiry_date),
            quantity=arc4.UInt64(quantity),
            is_verified=arc4.Bool(False),
            verifier=arc4.Address.from_bytes(Bytes.from_hex("00" * 32)),
            current_holder=arc4.Address(self.txn.sender),
            qr_hash=arc4.String(qr_hash),
        )

        # Store in box storage
        box_key = Bytes(b"batch_") + batch_id.bytes
        box = BoxRef(key=box_key)
        box.value = drug_batch.bytes

        return String("Batch registered: ") + batch_id

    @abimethod()
    def verify_batch(
        self,
        batch_id: String,
    ) -> String:
        """
        Verify a drug batch by government regulatory authority.

        Args:
            batch_id: ID of the batch to verify

        Returns:
            Confirmation message
        """
        box_key = Bytes(b"batch_") + batch_id.bytes
        box = BoxRef(key=box_key)

        # Load existing batch
        drug_batch = DrugBatch.from_bytes(box.value)

        # Update verification status
        drug_batch.is_verified = arc4.Bool(True)
        drug_batch.verifier = arc4.Address(self.txn.sender)

        # Save updated batch
        box.value = drug_batch.bytes

        return String("Batch verified: ") + batch_id

    @abimethod()
    def transfer_batch(
        self,
        batch_id: String,
        new_holder: arc4.Address,
        event_type: String,
    ) -> String:
        """
        Transfer batch ownership in supply chain.
        Records movement from producer → distributor → pharmacy.

        Args:
            batch_id: ID of the batch to transfer
            new_holder: Address of the new holder
            event_type: Type of transfer (e.g., "to_distributor", "to_pharmacy")

        Returns:
            Confirmation message
        """
        box_key = Bytes(b"batch_") + batch_id.bytes
        box = BoxRef(key=box_key)

        # Load existing batch
        drug_batch = DrugBatch.from_bytes(box.value)

        # Update holder
        old_holder = drug_batch.current_holder
        drug_batch.current_holder = new_holder

        # Save updated batch
        box.value = drug_batch.bytes

        # Log supply chain event
        event_key = Bytes(b"event_") + batch_id.bytes + Bytes.from_hex(
            self.txn.group_index.bytes.hex()
        )
        event_box = BoxRef(key=event_key)

        supply_event = SupplyChainEvent(
            batch_id=arc4.String(batch_id),
            from_address=old_holder,
            to_address=new_holder,
            timestamp=arc4.UInt64(self.latest_timestamp),
            event_type=arc4.String(event_type),
        )

        event_box.value = supply_event.bytes

        return String("Batch transferred: ") + batch_id

    @abimethod()
    def get_batch_info(
        self,
        batch_id: String,
    ) -> DrugBatch:
        """
        Retrieve complete information about a drug batch.
        Used by consumers scanning QR codes.

        Args:
            batch_id: ID of the batch to query

        Returns:
            Complete drug batch information
        """
        box_key = Bytes(b"batch_") + batch_id.bytes
        box = BoxRef(key=box_key)

        return DrugBatch.from_bytes(box.value)

    @abimethod()
    def verify_qr_code(
        self,
        batch_id: String,
        qr_hash: String,
    ) -> arc4.Bool:
        """
        Verify authenticity of a drug by matching QR code hash.

        Args:
            batch_id: ID of the batch
            qr_hash: Hash from the scanned QR code

        Returns:
            True if QR code matches, False otherwise
        """
        box_key = Bytes(b"batch_") + batch_id.bytes
        box = BoxRef(key=box_key)

        drug_batch = DrugBatch.from_bytes(box.value)

        return arc4.Bool(drug_batch.qr_hash == arc4.String(qr_hash))
