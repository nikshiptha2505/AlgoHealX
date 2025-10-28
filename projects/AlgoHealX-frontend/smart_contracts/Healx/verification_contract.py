"""
AlgoHealX Verification Contract
Verifies medicine authenticity and provides verification records
"""

from pyteal import *


def approval_program():
    """Main approval program for medicine verification"""
    
    # Global state keys
    batch_id_key = Bytes("batch_id")
    verification_count_key = Bytes("verification_count")
    is_authentic_key = Bytes("is_authentic")
    last_verification_timestamp_key = Bytes("last_verification_timestamp")
    qr_code_hash_key = Bytes("qr_code_hash")
    
    # Initialize contract
    on_creation = Seq([
        App.globalPut(batch_id_key, Txn.application_args[0]),
        App.globalPut(verification_count_key, Int(0)),
        App.globalPut(is_authentic_key, Int(1)),
        App.globalPut(last_verification_timestamp_key, Global.latest_timestamp()),
        App.globalPut(qr_code_hash_key, Txn.application_args[1]),
        Approve()
    ])
    
    # Verify medicine
    verify_medicine = Seq([
        Assert(Txn.application_args[1] == App.globalGet(qr_code_hash_key)),
        App.globalPut(verification_count_key, App.globalGet(verification_count_key) + Int(1)),
        App.globalPut(last_verification_timestamp_key, Global.latest_timestamp()),
        Approve()
    ])
    
    # Mark as counterfeit
    mark_counterfeit = Seq([
        App.globalPut(is_authentic_key, Int(0)),
        App.globalPut(last_verification_timestamp_key, Global.latest_timestamp()),
        Approve()
    ])
    
    # Get verification status
    get_verification_status = Seq([
        Approve()
    ])
    
    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == Global.creator_address())],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Txn.sender() == Global.creator_address())],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.application_args[0] == Bytes("verify"), verify_medicine],
        [Txn.application_args[0] == Bytes("mark_counterfeit"), mark_counterfeit],
        [Txn.application_args[0] == Bytes("get_status"), get_verification_status],
    )
    
    return program


def clear_state_program():
    """Clear state program"""
    return Approve()


if __name__ == "__main__":
    with open("verification_contract_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=6)
        f.write(compiled)
    
    with open("verification_contract_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=6)
        f.write(compiled)
