"""
Deployment script for AlgoHealX smart contracts
"""

import base64
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import ApplicationCreateTxn, OnComplete, StateSchema
from algosdk.logic import get_application_address


# Algorand node configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""  # Public node, no token needed


def compile_program(client, source_code):
    """Compile PyTeal source code to TEAL"""
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])


def deploy_contract(client, creator_private_key, approval_program, clear_program, 
                   global_schema, local_schema, app_args=None):
    """Deploy a smart contract to Algorand"""
    
    # Get account info
    creator_address = account.address_from_private_key(creator_private_key)
    
    # Get suggested params
    params = client.suggested_params()
    
    # Create application transaction
    txn = ApplicationCreateTxn(
        sender=creator_address,
        sp=params,
        on_complete=OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
        app_args=app_args or []
    )
    
    # Sign transaction
    signed_txn = txn.sign(creator_private_key)
    
    # Send transaction
    tx_id = client.send_transaction(signed_txn)
    print(f"Transaction ID: {tx_id}")
    
    # Wait for confirmation
    try:
        confirmed_txn = wait_for_confirmation(client, tx_id, 4)
        print(f"Transaction confirmed in round: {confirmed_txn['confirmed-round']}")
        
        # Get application ID
        app_id = confirmed_txn['application-index']
        print(f"Application ID: {app_id}")
        
        # Get application address
        app_address = get_application_address(app_id)
        print(f"Application Address: {app_address}")
        
        return app_id, app_address
        
    except Exception as e:
        print(f"Error: {e}")
        return None, None


def wait_for_confirmation(client, txid, timeout):
    """Wait for transaction confirmation"""
    start_round = client.status()["last-round"] + 1
    current_round = start_round
    
    while current_round < start_round + timeout:
        try:
            pending_txn = client.pending_transaction_info(txid)
        except Exception:
            return
        
        if pending_txn.get("confirmed-round", 0) > 0:
            return pending_txn
        elif pending_txn["pool-error"]:
            raise Exception(f'Pool error: {pending_txn["pool-error"]}')
        
        client.status_after_block(current_round)
        current_round += 1
    
    raise Exception(f"Transaction not confirmed after {timeout} rounds")


def deploy_all_contracts():
    """Deploy all AlgoHealX contracts"""
    
    # Initialize algod client
    algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
    
    print("AlgoHealX Smart Contract Deployment")
    print("=" * 50)
    
    # For demo purposes - in production, use secure key management
    print("\nNOTE: In production, use secure key management (e.g., KMS)")
    creator_mnemonic = input("Enter creator account mnemonic (or press Enter for new account): ")
    
    if not creator_mnemonic:
        # Generate new account
        private_key, address = account.generate_account()
        print(f"\nNew account created: {address}")
        print(f"Mnemonic: {mnemonic.from_private_key(private_key)}")
        print("⚠️  SAVE THIS MNEMONIC SECURELY!")
        print("⚠️  Fund this account with ALGO before deploying")
        input("Press Enter after funding the account...")
    else:
        private_key = mnemonic.to_private_key(creator_mnemonic)
        address = account.address_from_private_key(private_key)
        print(f"Using account: {address}")
    
    # Define schemas for each contract
    # Global schema: (num_uints, num_byte_slices)
    # Local schema: (num_uints, num_byte_slices)
    
    contracts = {
        "medicine_registry": {
            "approval": "medicine_registry_approval.teal",
            "clear": "medicine_registry_clear.teal",
            "global_schema": StateSchema(num_uints=2, num_byte_slices=7),
            "local_schema": StateSchema(num_uints=0, num_byte_slices=0)
        },
        "supply_chain_tracker": {
            "approval": "supply_chain_tracker_approval.teal",
            "clear": "supply_chain_tracker_clear.teal",
            "global_schema": StateSchema(num_uints=2, num_byte_slices=5),
            "local_schema": StateSchema(num_uints=0, num_byte_slices=0)
        },
        "verification_contract": {
            "approval": "verification_contract_approval.teal",
            "clear": "verification_contract_clear.teal",
            "global_schema": StateSchema(num_uints=3, num_byte_slices=2),
            "local_schema": StateSchema(num_uints=0, num_byte_slices=0)
        },
        "regulator_approval": {
            "approval": "regulator_approval_approval.teal",
            "clear": "regulator_approval_clear.teal",
            "global_schema": StateSchema(num_uints=2, num_byte_slices=4),
            "local_schema": StateSchema(num_uints=0, num_byte_slices=0)
        }
    }
    
    deployed_contracts = {}
    
    for contract_name, contract_info in contracts.items():
        print(f"\n\nDeploying {contract_name}...")
        print("-" * 50)
        
        try:
            # Read TEAL programs
            with open(contract_info["approval"], "r") as f:
                approval_program = f.read().encode()
            
            with open(contract_info["clear"], "r") as f:
                clear_program = f.read().encode()
            
            # Compile programs
            approval_compiled = compile_program(algod_client, approval_program)
            clear_compiled = compile_program(algod_client, clear_program)
            
            # Deploy contract
            app_id, app_address = deploy_contract(
                algod_client,
                private_key,
                approval_compiled,
                clear_compiled,
                contract_info["global_schema"],
                contract_info["local_schema"]
            )
            
            if app_id:
                deployed_contracts[contract_name] = {
                    "app_id": app_id,
                    "app_address": app_address
                }
                print(f"✅ {contract_name} deployed successfully!")
            else:
                print(f"❌ Failed to deploy {contract_name}")
                
        except Exception as e:
            print(f"❌ Error deploying {contract_name}: {e}")
    
    # Save deployment info
    print("\n\n" + "=" * 50)
    print("DEPLOYMENT SUMMARY")
    print("=" * 50)
    
    if deployed_contracts:
        with open("deployment_info.txt", "w") as f:
            f.write("AlgoHealX Smart Contract Deployment Info\n")
            f.write("=" * 50 + "\n\n")
            
            for contract_name, info in deployed_contracts.items():
                print(f"\n{contract_name}:")
                print(f"  App ID: {info['app_id']}")
                print(f"  Address: {info['app_address']}")
                
                f.write(f"{contract_name}:\n")
                f.write(f"  App ID: {info['app_id']}\n")
                f.write(f"  Address: {info['app_address']}\n\n")
        
        print("\n✅ Deployment info saved to deployment_info.txt")
        print("\n⚠️  Update frontend environment variables with these App IDs")
    else:
        print("\n❌ No contracts were deployed successfully")


if __name__ == "__main__":
    deploy_all_contracts()
