from algopy import ARC4Contract, arc4, Global, UInt64, Bytes, String, Account, Txn
class DrugBatchContract(ARC4Contract):
    def __init__(self):
        super().__init__()
        self.drug_batches = Global.Dict("drug_batches")

    @arc4.method
    def register_drug_batch(self, batch_id: String, manufacturer: String, manufacture_date: String, expiry_date: String, quantity: UInt64):
        """
        Registers a new drug batch with the given details.
        """
        if self.drug_batches.contains(batch_id):
            raise Exception("Batch ID already exists.")
        
        batch_info = {
            "manufacturer": manufacturer,
            "manufacture_date": manufacture_date,
            "expiry_date": expiry_date,
            "quantity": quantity
        }
        
        self.drug_batches[batch_id] = batch_info

    @arc4.method
    def get_drug_batch(self, batch_id: String) -> Bytes:
        """
        Retrieves the details of a drug batch by its ID.
        """
        if not self.drug_batches.contains(batch_id):
            raise Exception("Batch ID does not exist.")
        
        return self.drug_batches[batch_id]
