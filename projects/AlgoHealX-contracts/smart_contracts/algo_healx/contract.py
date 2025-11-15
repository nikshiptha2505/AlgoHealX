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
