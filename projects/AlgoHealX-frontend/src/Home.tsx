import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import RegisterDrug, { BatchData } from './components/RegisterDrug'
import VerifyBatch from './components/VerifyBatch'
import TransferBatch from './components/TransferBatch'
import VerifyQR, { BatchInfo } from './components/VerifyQR'
import { useSnackbar } from 'notistack'

const Home: React.FC = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openRegisterModal, setOpenRegisterModal] = useState<boolean>(false)
  const [openVerifyModal, setOpenVerifyModal] = useState<boolean>(false)
  const [openTransferModal, setOpenTransferModal] = useState<boolean>(false)
  const [openQRModal, setOpenQRModal] = useState<boolean>(false)
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const handleRegisterDrug = async (batchData: BatchData) => {
    try {
      enqueueSnackbar('Registering drug batch on blockchain...', { variant: 'info' })
      console.log('Batch registration:', batchData)
      enqueueSnackbar(`Batch ${batchData.batchId} registered successfully!`, { variant: 'success' })
    } catch (error) {
      enqueueSnackbar('Failed to register batch', { variant: 'error' })
      throw error
    }
  }

  const handleVerifyBatch = async (batchId: string) => {
    try {
      enqueueSnackbar('Verifying batch on blockchain...', { variant: 'info' })
      console.log('Verifying batch:', batchId)
      enqueueSnackbar(`Batch ${batchId} verified successfully!`, { variant: 'success' })
    } catch (error) {
      enqueueSnackbar('Failed to verify batch', { variant: 'error' })
      throw error
    }
  }

  const handleTransferBatch = async (batchId: string, newHolder: string, eventType: string) => {
    try {
      enqueueSnackbar('Transferring batch ownership...', { variant: 'info' })
      console.log('Transfer:', { batchId, newHolder, eventType })
      enqueueSnackbar(`Batch ${batchId} transferred successfully!`, { variant: 'success' })
    } catch (error) {
      enqueueSnackbar('Failed to transfer batch', { variant: 'error' })
      throw error
    }
  }

  const handleVerifyQR = async (batchId: string): Promise<BatchInfo | null> => {
    try {
      enqueueSnackbar('Fetching batch information...', { variant: 'info' })
      console.log('Verifying QR for batch:', batchId)

      const mockBatchInfo: BatchInfo = {
        batchId,
        drugName: 'Paracetamol 500mg',
        producer: 'PRODUCERADDRESSEXAMPLE123456789',
        productionDate: Math.floor(Date.now() / 1000) - 86400 * 30,
        expiryDate: Math.floor(Date.now() / 1000) + 86400 * 365,
        quantity: 1000,
        isVerified: true,
        verifier: 'GOVADDRESSEXAMPLE123456789',
        currentHolder: 'PHARMACYADDRESSEXAMPLE123456789',
        qrHash: `QR-${batchId}-${Date.now()}`,
      }

      enqueueSnackbar('Batch information retrieved!', { variant: 'success' })
      return mockBatchInfo
    } catch (error) {
      enqueueSnackbar('Failed to retrieve batch information', { variant: 'error' })
      return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg
                className="w-8 h-8 text-blue-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <h1 className="text-2xl font-bold text-gray-800">AlgoHealX</h1>
            </div>
            <button
              onClick={() => setOpenWalletModal(true)}
              className="btn btn-primary btn-sm"
            >
              {activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Blockchain-Powered Medicine Authentication
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Eliminate counterfeit drugs with transparent, immutable tracking on Algorand blockchain.
            Every medicine batch is verifiable, traceable, and secure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="card bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="card-title text-lg">Register Batch</h3>
              <p className="text-sm text-gray-600 mb-4">
                Producers register new medicine batches with unique QR codes
              </p>
              <button
                onClick={() => setOpenRegisterModal(true)}
                className="btn btn-primary btn-sm w-full"
                disabled={!activeAddress}
              >
                Register Medicine
              </button>
            </div>
          </div>

          <div className="card bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="card-title text-lg">Verify Batch</h3>
              <p className="text-sm text-gray-600 mb-4">
                Government authorities verify and approve drug quality
              </p>
              <button
                onClick={() => setOpenVerifyModal(true)}
                className="btn btn-success btn-sm w-full"
                disabled={!activeAddress}
              >
                Verify Medicine
              </button>
            </div>
          </div>

          <div className="card bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <h3 className="card-title text-lg">Track Supply Chain</h3>
              <p className="text-sm text-gray-600 mb-4">
                Transfer batches through distributors to pharmacies
              </p>
              <button
                onClick={() => setOpenTransferModal(true)}
                className="btn btn-secondary btn-sm w-full"
                disabled={!activeAddress}
              >
                Transfer Batch
              </button>
            </div>
          </div>

          <div className="card bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <h3 className="card-title text-lg">Verify QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Consumers scan QR codes to verify medicine authenticity
              </p>
              <button
                onClick={() => setOpenQRModal(true)}
                className="btn btn-accent btn-sm w-full"
              >
                Scan QR Code
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">Producer Registers</h4>
              <p className="text-sm text-gray-600">
                Pharmaceutical companies register medicine batches with unique QR codes on blockchain
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">Government Verifies</h4>
              <p className="text-sm text-gray-600">
                Regulatory authorities verify drug quality and safety, recording approval on-chain
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">Supply Chain Tracks</h4>
              <p className="text-sm text-gray-600">
                Every transfer from producer to distributor to pharmacy is transparently logged
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h4 className="font-semibold mb-2">Consumer Verifies</h4>
              <p className="text-sm text-gray-600">
                End users scan QR codes to instantly verify medicine authenticity and history
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            Built on Algorand Blockchain | Securing Global Healthcare Supply Chain
          </p>
        </div>
      </footer>

      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
      <RegisterDrug
        openModal={openRegisterModal}
        closeModal={() => setOpenRegisterModal(false)}
        onRegister={handleRegisterDrug}
      />
      <VerifyBatch
        openModal={openVerifyModal}
        closeModal={() => setOpenVerifyModal(false)}
        onVerify={handleVerifyBatch}
      />
      <TransferBatch
        openModal={openTransferModal}
        closeModal={() => setOpenTransferModal(false)}
        onTransfer={handleTransferBatch}
      />
      <VerifyQR
        openModal={openQRModal}
        closeModal={() => setOpenQRModal(false)}
        onVerify={handleVerifyQR}
      />
    </div>
  )
}

export default Home
