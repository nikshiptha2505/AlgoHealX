from algopy import ARC4Contract, Account, Txn, BoxMap, UInt64, String, subroutine
from algopy.arc4 import abimethod

MAX_BATCHES = 100
MAX_MANUFACTURERS = 50

class AlgoHealx(ARC4Contract):
    owner: Account
    government_address: Account
    batch_count: UInt64
    manufacturer_count: UInt64
    manufacturers: BoxMap[UInt64, Account]
    batches: BoxMap[UInt64, String]
    def _init_(self) -> None:
        self.manufacturers = BoxMap(UInt64, Account, key_prefix=b"manu_")
        self.batches = BoxMap(UInt64, String, key_prefix=b"batch_")
        self.batch_count = UInt64(0)
        self.manufacturer_count = UInt64(0)
    @abimethod(allow_actions=["NoOp"], create="require")
    def create_application(self, owner_addr: Account, government_addr: Account) -> None:
        self.owner = owner_addr
        self.government_address = government_addr
        self.batch_count = UInt64(0)
        self.manufacturer_count = UInt64(0)

    @abimethod()
    def add_manufacturer(self, manufacturer_addr: Account) -> None:
        assert self.manufacturer_count < UInt64(MAX_MANUFACTURERS), "Whitelist full"
        assert Txn.sender == self.owner, "Unauthorized"
        idx = self.manufacturer_count
        self.manufacturers[idx] = manufacturer_addr
        self.manufacturer_count = self.manufacturer_count + UInt64(1)



 




