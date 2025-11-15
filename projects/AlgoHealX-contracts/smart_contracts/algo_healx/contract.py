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
