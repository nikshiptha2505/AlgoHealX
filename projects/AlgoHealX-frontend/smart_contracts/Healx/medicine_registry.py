"""
AlgoHealX Medicine Registry Smart Contract
Handles registration of new medicine batches on Algorand blockchain
"""

from pyteal import *


def approval_program():
    """Main approval program for medicine registry"""
    
    # Global state keys
    batch_id_key = Bytes("batch_id")
    drug_name_key = Bytes("drug_name")
    manufacturer_key = Bytes("manufacturer")
    manufacture_date_key = Bytes("manufacture_date")
    expiry_date_key = Bytes("expiry_date")
    quantity_key = Bytes("quantity")
    producer_address_key = Bytes("producer_address")
    status_key = Bytes("status")
    timestamp_key = Bytes("timestamp")
    
    # Initialize contract
    on_creation = Seq([
        App.globalPut(batch_id_key, Bytes("")),
        App.globalPut(drug_name_key, Bytes("")),
        App.globalPut(manufacturer_key, Bytes("")),
        App.globalPut(manufacture_date_key, Bytes("")),
        App.globalPut(expiry_date_key, Bytes("")),
        App.globalPut(quantity_key, Int(0)),
        App.globalPut(producer_address_key, Txn.sender()),
        App.globalPut(status_key, Bytes("pending")),
        App.globalPut(timestamp_key, Global.latest_timestamp()),
        Approve()
    ])
    
    # Register medicine batch
    register_batch = Seq([
        Assert(Txn.sender() == App.globalGet(producer_address_key)),
        App.globalPut(batch_id_key, Txn.application_args[1]),
        App.globalPut(drug_name_key, Txn.application_args[2]),
        App.globalPut(manufacturer_key, Txn.application_args[3]),
        App.globalPut(manufacture_date_key, Txn.application_args[4]),
        App.globalPut(expiry_date_key, Txn.application_args[5]),
        App.globalPut(quantity_key, Btoi(Txn.application_args[6])),
        App.globalPut(status_key, Bytes("pending")),
        App.globalPut(timestamp_key, Global.latest_timestamp()),
        Approve()
    ])
    
    # Update status (for regulator approval)
    update_status = Seq([
        App.globalPut(status_key, Txn.application_args[1]),
        App.globalPut(timestamp_key, Global.latest_timestamp()),
        Approve()
    ])
    
    # Get batch info
    get_batch_info = Seq([
        Approve()
    ])
    
    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == Global.creator_address())],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Txn.sender() == Global.creator_address())],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.application_args[0] == Bytes("register"), register_batch],
        [Txn.application_args[0] == Bytes("update_status"), update_status],
        [Txn.application_args[0] == Bytes("get_info"), get_batch_info],
    )
    
    return program


def clear_state_program():
    """Clear state program"""
    return Approve()


if __name__ == "__main__":
    with open("medicine_registry_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=6)
        f.write(compiled)
    
    with open("medicine_registry_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=6)
        f.write(compiled)
