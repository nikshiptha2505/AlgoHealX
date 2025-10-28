"""
AlgoHealX Supply Chain Tracker Smart Contract
Tracks medicine movement through the supply chain
"""

from pyteal import *


def approval_program():
    """Main approval program for supply chain tracking"""
    
    # Global state keys
    batch_id_key = Bytes("batch_id")
    current_location_key = Bytes("current_location")
    sender_address_key = Bytes("sender_address")
    receiver_address_key = Bytes("receiver_address")
    transfer_count_key = Bytes("transfer_count")
    last_transfer_timestamp_key = Bytes("last_transfer_timestamp")
    status_key = Bytes("status")
    
    # Initialize contract
    on_creation = Seq([
        App.globalPut(batch_id_key, Txn.application_args[0]),
        App.globalPut(current_location_key, Bytes("origin")),
        App.globalPut(sender_address_key, Txn.sender()),
        App.globalPut(receiver_address_key, Bytes("")),
        App.globalPut(transfer_count_key, Int(0)),
        App.globalPut(last_transfer_timestamp_key, Global.latest_timestamp()),
        App.globalPut(status_key, Bytes("in_transit")),
        Approve()
    ])
    
    # Record transfer
    record_transfer = Seq([
        App.globalPut(sender_address_key, App.globalGet(receiver_address_key)),
        App.globalPut(receiver_address_key, Txn.application_args[1]),
        App.globalPut(current_location_key, Txn.application_args[2]),
        App.globalPut(transfer_count_key, App.globalGet(transfer_count_key) + Int(1)),
        App.globalPut(last_transfer_timestamp_key, Global.latest_timestamp()),
        Approve()
    ])
    
    # Update status
    update_status = Seq([
        App.globalPut(status_key, Txn.application_args[1]),
        App.globalPut(last_transfer_timestamp_key, Global.latest_timestamp()),
        Approve()
    ])
    
    # Get transfer history
    get_transfer_history = Seq([
        Approve()
    ])
    
    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == Global.creator_address())],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Txn.sender() == Global.creator_address())],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.application_args[0] == Bytes("transfer"), record_transfer],
        [Txn.application_args[0] == Bytes("update_status"), update_status],
        [Txn.application_args[0] == Bytes("get_history"), get_transfer_history],
    )
    
    return program


def clear_state_program():
    """Clear state program"""
    return Approve()


if __name__ == "__main__":
    with open("supply_chain_tracker_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=6)
        f.write(compiled)
    
    with open("supply_chain_tracker_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=6)
        f.write(compiled)
