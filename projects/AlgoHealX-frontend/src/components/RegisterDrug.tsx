import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'

interface RegisterDrugProps {
  openModal: boolean
  closeModal: () => void
  onRegister: (batchData: BatchData) => Promise<void>
}

export interface BatchData {
  batchId: string
  drugName: string
  productionDate: number
  expiryDate: number
  quantity: number
  qrHash: string
}

const RegisterDrug: React.FC<RegisterDrugProps> = ({ openModal, closeModal, onRegister }) => {
  const { activeAddress } = useWallet()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    batchId: '',
    drugName: '',
    productionDate: '',
    expiryDate: '',
    quantity: '',
  })

  const generateQRHash = (batchId: string, drugName: string) => {
    return `QR-${batchId}-${drugName}-${Date.now()}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const qrHash = generateQRHash(formData.batchId, formData.drugName)
      const batchData: BatchData = {
        batchId: formData.batchId,
        drugName: formData.drugName,
        productionDate: Math.floor(new Date(formData.productionDate).getTime() / 1000),
        expiryDate: Math.floor(new Date(formData.expiryDate).getTime() / 1000),
        quantity: parseInt(formData.quantity),
        qrHash,
      }

      await onRegister(batchData)

      setFormData({
        batchId: '',
        drugName: '',
        productionDate: '',
        expiryDate: '',
        quantity: '',
      })
      closeModal()
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (!openModal) return null

  return (
    <dialog open className="modal">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-4">Register Drug Batch</h3>
        <p className="text-sm text-gray-600 mb-6">
          Register a new pharmaceutical batch on the Algorand blockchain
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
              placeholder="e.g., BATCH-2025-001"
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Drug Name</span>
            </label>
            <input
              type="text"
              name="drugName"
              value={formData.drugName}
              onChange={handleChange}
              placeholder="e.g., Paracetamol 500mg"
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Production Date</span>
              </label>
              <input
                type="date"
                name="productionDate"
                value={formData.productionDate}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Expiry Date</span>
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Quantity (Units)</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g., 1000"
              className="input input-bordered w-full"
              min="1"
              required
            />
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
            <span className="text-sm">A unique QR hash will be generated automatically for this batch</span>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !activeAddress}>
              {loading ? 'Registering...' : 'Register Batch'}
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

export default RegisterDrug
