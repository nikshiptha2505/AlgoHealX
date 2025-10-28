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
