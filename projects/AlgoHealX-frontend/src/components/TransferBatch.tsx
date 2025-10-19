import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'

interface TransferBatchProps {
  openModal: boolean
  closeModal: () => void
  onTransfer: (batchId: string, newHolder: string, eventType: string) => Promise<void>
}

const TransferBatch: React.FC<TransferBatchProps> = ({ openModal, closeModal, onTransfer }) => {
  const { activeAddress } = useWallet()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    batchId: '',
    newHolder: '',
    eventType: 'to_distributor',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onTransfer(formData.batchId, formData.newHolder, formData.eventType)
      setFormData({
        batchId: '',
        newHolder: '',
        eventType: 'to_distributor',
      })
      closeModal()
    } catch (error) {
      console.error('Transfer error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (!openModal) return null

  return (
    <dialog open className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-2xl mb-4">Transfer Batch</h3>
        <p className="text-sm text-gray-600 mb-6">
          Transfer batch ownership in the supply chain
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Batch ID</span>
            </label>
            <input
              type="text"
              name="batchId"
              value={formData.batchId}
              onChange={handleChange}
              placeholder="Enter batch ID"
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Transfer To (Algorand Address)</span>
            </label>
            <input
              type="text"
              name="newHolder"
              value={formData.newHolder}
              onChange={handleChange}
              placeholder="Enter recipient address"
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Transfer Type</span>
            </label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="select select-bordered w-full"
            >
              <option value="to_distributor">Producer → Distributor</option>
              <option value="to_pharmacy">Distributor → Pharmacy</option>
              <option value="to_retailer">Pharmacy → Retailer</option>
            </select>
          </div>

          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-sm">All transfers are recorded on the blockchain</span>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !activeAddress}>
              {loading ? 'Transferring...' : 'Transfer Batch'}
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

export default TransferBatch
