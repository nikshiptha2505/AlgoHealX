import React, { useState } from 'react'

interface VerifyQRProps {
  openModal: boolean
  closeModal: () => void
  onVerify: (batchId: string) => Promise<BatchInfo | null>
}

export interface BatchInfo {
  batchId: string
  drugName: string
  producer: string
  productionDate: number
  expiryDate: number
  quantity: number
  isVerified: boolean
  verifier: string
  currentHolder: string
  qrHash: string
}

const VerifyQR: React.FC<VerifyQRProps> = ({ openModal, closeModal, onVerify }) => {
  const [batchId, setBatchId] = useState('')
  const [loading, setLoading] = useState(false)
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const info = await onVerify(batchId)
      setBatchInfo(info)
    } catch (error) {
      console.error('Verification error:', error)
      setBatchInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const handleClose = () => {
    setBatchId('')
    setBatchInfo(null)
    closeModal()
  }

  if (!openModal) return null

  return (
    <dialog open className="modal">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-4">Verify Medicine QR Code</h3>
        <p className="text-sm text-gray-600 mb-6">
          Scan or enter the batch ID to verify medicine authenticity
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Batch ID or QR Code</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="Enter batch ID from QR code"
                className="input input-bordered w-full"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </form>

        {batchInfo && (
          <div className="space-y-4">
            <div className={`alert ${batchInfo.isVerified ? 'alert-success' : 'alert-warning'}`}>
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
                  d={
                    batchInfo.isVerified
                      ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                      : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  }
                />
              </svg>
              <span className="font-bold">
                {batchInfo.isVerified ? 'Verified Medicine' : 'Pending Verification'}
              </span>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-lg mb-3">Batch Information</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Batch ID</p>
                    <p className="font-semibold">{batchInfo.batchId}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Drug Name</p>
                    <p className="font-semibold">{batchInfo.drugName}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Production Date</p>
                    <p className="font-semibold">{formatDate(batchInfo.productionDate)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="font-semibold">{formatDate(batchInfo.expiryDate)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="font-semibold">{batchInfo.quantity} units</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Current Status</p>
                    <p className="font-semibold">
                      {batchInfo.isVerified ? 'Government Verified' : 'Awaiting Verification'}
                    </p>
                  </div>
                </div>

                <div className="divider"></div>

                <h4 className="font-bold text-md mb-2">Supply Chain Details</h4>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Producer Address</p>
                    <p className="text-xs font-mono break-all">{batchInfo.producer}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Current Holder</p>
                    <p className="text-xs font-mono break-all">{batchInfo.currentHolder}</p>
                  </div>

                  {batchInfo.isVerified && (
                    <div>
                      <p className="text-sm text-gray-600">Verified By</p>
                      <p className="text-xs font-mono break-all">{batchInfo.verifier}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={handleClose}>
        <button>close</button>
      </form>
    </dialog>
  )
}

export default VerifyQR
