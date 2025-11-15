from algopy import ARC4Contract, arc4, Global, UInt64, Bytes, String, Account, Txn

class DrugBatchContract(ARC4Contract):
    def __init__(self) -> None:
        self.admin = Global.creator_address
        self.producer = Account()
        self.regulator = Account()
        self.batch_id = String()
        self.drug_name = String()
        self.manufacturer = String()
        self.manufacture_date = String()
        self.expiry_date = String()
        self.quantity = UInt64()
        self.status = String("unregistered")
        self.timestamp = UInt64()
        self.reg_status = String("pending")
        self.rej_reason = String()
        self.compliance_score = UInt64()
        self.approval_ts = UInt64()
        self.sender = Account()
        self.receiver = Account()
        self.current_location = String()
        self.transfer_count = UInt64()
        self.last_transfer_ts = UInt64()
        self.verif_count = UInt64()
        self.is_authentic = UInt64(1)
        self.last_verif_ts = UInt64()
        self.qr_hash = Bytes()

    @arc4.abimethod
    def set_regulator(self, regulator_addr: Account) -> None:
        assert Txn.sender == self.admin
        self.regulator = regulator_addr
        self.reg_status = String("pending")
        self.approval_ts = Global.latest_timestamp
    @arc4.abimethod
    def register(
        self,
        batch_id: String,
        drug_name: String,
        manufacturer: String,
        manufacture_date: String,
        expiry_date: String,
        quantity: UInt64,
    ) -> None:
        if self.producer == Account():
            self.producer = Txn.sender
        else:
            assert Txn.sender == self.producer
        self.batch_id = batch_id
        self.drug_name = drug_name
        self.manufacturer = manufacturer
        self.manufacture_date = manufacture_date
        self.expiry_date = expiry_date
        self.quantity = quantity
        self.status = String("pending")
        self.timestamp = Global.latest_timestamp
    @arc4.abimethod
    def update_status(self, status_text: String) -> None:
        assert Txn.sender == self.admin or Txn.sender == self.producer or Txn.sender == self.regulator
        self.status = status_text
        self.timestamp = Global.latest_timestamp
    @arc4.abimethod
    def approve(self, compliance_score: UInt64) -> None:
        assert Txn.sender == self.regulator
        self.reg_status = String("approved")
        self.compliance_score = compliance_score
        self.approval_ts = Global.latest_timestamp
        self.status = String("approved")

    @arc4.abimethod
    def reject(self, reason_text: String) -> None:
        assert Txn.sender == self.regulator
        self.reg_status = String("rejected")
        self.rej_reason = reason_text
        self.approval_ts = Global.latest_timestamp
        self.status = String("rejected")

    @arc4.abimethod
    def transfer(self, new_receiver: Account, location: String) -> None:
        if self.transfer_count == UInt64(0):
            assert Txn.sender == self.producer or Txn.sender == self.admin
            self.sender = self.producer
        else:
            assert Txn.sender == self.sender or Txn.sender == self.admin
            self.sender = self.receiver
        self.receiver = new_receiver
        self.current_location = location
        self.transfer_count += UInt64(1)
        self.last_transfer_ts = Global.latest_timestamp
        self.status = String("in_transit")

    @arc4.abimethod
    def mark_delivered(self) -> None:
        assert Txn.sender == self.receiver or Txn.sender == self.admin
        self.status = String("delivered")
        self.last_transfer_ts = Global.latest_timestamp
    @arc4.abimethod
    def set_qr(self, qr_hash: Bytes) -> None:
        assert Txn.sender == self.producer or Txn.sender == self.admin
        self.qr_hash = qr_hash
        self.last_verif_ts = Global.latest_timestamp
    @arc4.abimethod
    def verify(self, qr_hash: Bytes) -> None:
        assert qr_hash == self.qr_hash
        self.verif_count += UInt64(1)
        self.last_verif_ts = Global.latest_timestamp
