"""
AlgoHealX Regulator Approval Contract
Handles regulatory approval/rejection of medicine batches
"""

from pyteal import *


def approval_program():
    """Main approval program for regulator approval"""
    
    # Global state keys
    batch_id_key = Bytes("batch_id")
    regulator_address_key = Bytes("regulator_address")
    approval_status_key = Bytes("approval_status")
    approval_timestamp_key = Bytes("approval_timestamp")
    rejection_reason_key = Bytes("rejection_reason")
    compliance_score_key = Bytes("compliance_score")
    
    # Initialize contract
    on_creation = Seq([
        App.globalPut(batch_id_key, Txn.application_args[0]),
        App.globalPut(regulator_address_key, Txn.sender()),
        App.globalPut(approval_status_key, Bytes("pending")),
        App.globalPut(approval_timestamp_key, Global.latest_timestamp()),
        App.globalPut(rejection_reason_key, Bytes("")),
        App.globalPut(compliance_score_key, Int(0)),
        Approve()
    ])
    
    # Approve batch
    approve_batch = Seq([
        Assert(Txn.sender() == App.globalGet(regulator_address_key)),
        App.globalPut(approval_status_key, Bytes("approved")),
        App.globalPut(compliance_score_key, Btoi(Txn.application_args[1])),
        App.globalPut(approval_timestamp_key, Global.latest_timestamp()),
        Approve()
    ])
    
    # Reject batch
    reject_batch = Seq([
        Assert(Txn.sender() == App.globalGet(regulator_address_key)),
        App.globalPut(approval_status_key, Bytes("rejected")),
        App.globalPut(rejection_reason_key, Txn.application_args[1]),
        App.globalPut(approval_timestamp_key, Global.latest_timestamp()),
        Approve()
    ])
    
    # Get approval status
    get_approval_status = Seq([
        Approve()
    ])
    
    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == Global.creator_address())],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Txn.sender() == Global.creator_address())],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.application_args[0] == Bytes("approve"), approve_batch],
        [Txn.application_args[0] == Bytes("reject"), reject_batch],
        [Txn.application_args[0] == Bytes("get_status"), get_approval_status],
    )
    
    return program


def clear_state_program():
    """Clear state program"""
    return Approve()


if __name__ == "__main__":
    with open("regulator_approval_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=6)
        f.write(compiled)
    
    with open("regulator_approval_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=6)
        f.write(compiled)
