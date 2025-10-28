import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X } from 'lucide-react';
import QrReader from 'react-qr-scanner';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = (result) => {
    if (result?.text) {
      onScan(result.text);
    }
  };

  const handleError = (error) => {
    console.error('QR Scan Error:', error);
    setError('Failed to access camera. Please check permissions.');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
              setError('Failed to create canvas context');
              return;
            }
            
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            
            const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height);
            
            if (code) {
              onScan(code.data);
            } else {
              setError('No QR code found in image');
            }
          } catch (err) {
            setError('Failed to read QR code from image');
          }
        };
        img.src = imageData;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Scan QR Code</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!scanMode && (
          <div className="space-y-3">
            <Button
              onClick={() => setScanMode('camera')}
              className="w-full"
              variant="outline"
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan with Camera
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload from Gallery
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {scanMode === 'camera' && (
          <div className="space-y-4">
            <QrReader
              onResult={handleScan}
              constraints={{ facingMode: 'environment' }}
              containerStyle={{ width: '100%' }}
              videoContainerStyle={{ paddingTop: '100%' }}
            />
            <Button
              onClick={() => setScanMode(null)}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive mt-4">{error}</p>
        )}
      </CardContent>
    </Card>
  );
};
