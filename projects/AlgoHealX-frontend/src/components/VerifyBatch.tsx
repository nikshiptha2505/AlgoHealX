import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'

interface VerifyBatchProps {
  openModal: boolean
  closeModal: () => void
  onVerify: (batchId: string) => Promise<void>
}

const VerifyBatch: React.FC<VerifyBatchProps> = ({ openModal, closeModal, onVerify }) => {
  const { activeAddress } = useWallet()
  const [batchId, setBatchId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onVerify(batchId)
      setBatchId('')
      closeModal()
    } catch (error) {
      console.error('Verification error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!openModal) return null

  return (
    <dialog open className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-2xl mb-4">Verify Drug Batch</h3>
        <p className="text-sm text-gray-600 mb-6">
          Government regulatory authority verification
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Batch ID</span>
            </label>
            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="Enter batch ID to verify"
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="alert alert-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm">Only authorized government accounts should verify batches</span>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={loading || !activeAddress}>
              {loading ? 'Verifying...' : 'Verify Batch'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={closeModal}>
        <button>close</button>
      </form>
    </dialog>
  )
}

export default VerifyBatch
