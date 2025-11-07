/**
 * QR/Barcode Scanner Component
 *
 * Uses @zxing/browser to scan QR codes and barcodes from the device camera.
 * Supports multiple barcode formats and handles camera permissions.
 */

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { ScannerProps } from '../types';
import { config } from '../config/environment';

export const QRScanner: React.FC<ScannerProps> = ({ onScanSuccess, onScanError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  /**
   * Track if a scan has been processed to prevent duplicate scans
   * This prevents the scanner from processing the same code multiple times
   * before the camera stops
   */
  const hasScannedRef = useRef<boolean>(false);

  /**
   * Initialize scanner
   */
  useEffect(() => {
    const initScanner = async () => {
      try {
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not supported. Please use HTTPS or a compatible browser.');
        }

        // Request camera permission - Prefer rear camera with autofocus
        let stream;
        try {
          // Try to get rear camera first
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' }, // Prefer rear camera, but allow fallback
            },
          });
        } catch (err) {
          // If that fails, try without facingMode constraint
          console.log('[QR Scanner] Rear camera not available, trying any camera...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        }

        // Permission granted
        setHasPermission(true);

        // Stop the test stream
        stream.getTracks().forEach((track) => track.stop());

        // Initialize the barcode reader
        readerRef.current = new BrowserMultiFormatReader();

        console.log('[QR Scanner] Scanner initialized successfully');
      } catch (err) {
        console.error('[QR Scanner] Failed to initialize:', err);
        const errorMessage = err instanceof Error ? err.message : 'Camera access denied. Please enable camera permissions.';
        setError(errorMessage);
        setHasPermission(false);

        if (onScanError) {
          onScanError(err as Error);
        }
      }
    };

    initScanner();

    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, [onScanError]);

  /**
   * Start scanning
   */
  const startScanning = async () => {
    if (!videoRef.current || isScanning) {
      return;
    }

    // Reinitialize reader if needed
    if (!readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader();
    }

    // Reset scan flag when starting a new scan session
    hasScannedRef.current = false;

    setIsScanning(true);
    setError(null);

    try {
      // Get available video input devices
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Filter out virtual cameras and prefer back/rear camera on mobile devices
      const realCameras = videoInputDevices.filter((device: any) => {
        const label = device.label.toLowerCase();
        return !label.includes('obs') && !label.includes('virtual') && !label.includes('snap');
      });

      const camerasToUse = realCameras.length > 0 ? realCameras : videoInputDevices;

      const selectedDevice =
        camerasToUse.find((device: any) => {
          const label = device.label.toLowerCase();
          return label.includes('back') || label.includes('rear') || label.includes('trasera') || label.includes('principal');
        }) || camerasToUse[camerasToUse.length - 1] || camerasToUse[0];

      console.log('[QR Scanner] Using camera:', selectedDevice.label);

      // Start decoding from video device
      await readerRef.current.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            // Check if we've already processed a scan to prevent duplicates
            // This is critical because the scanner can detect the same code
            // multiple times in consecutive video frames
            if (hasScannedRef.current) {
              console.log('[QR Scanner] Duplicate scan detected, ignoring');
              return;
            }

            // Mark as scanned immediately to prevent duplicate processing
            hasScannedRef.current = true;

            // Successful scan
            const code = result.getText();
            console.log('[QR Scanner] Scanned code:', code);

            // Stop scanning immediately before calling callback
            // This prevents additional scans while the callback is processing
            stopScanning();

            // Call the success callback after stopping
            onScanSuccess(code);
          }

          if (error) {
            // Log errors (these are expected during normal scanning)
            // Don't spam the console with NotFoundException
            if (error.name !== 'NotFoundException') {
              console.error('[QR Scanner] Decode error:', error);
            }
          }
        }
      );

      console.log('[QR Scanner] Started scanning');
    } catch (err) {
      console.error('[QR Scanner] Failed to start scanning:', err);
      setError('Failed to start scanner. Please try again.');
      setIsScanning(false);

      if (onScanError) {
        onScanError(err as Error);
      }
    }
  };

  /**
   * Stop scanning and release camera
   * This function is critical for preventing memory leaks and ensuring
   * the camera is properly released when scanning is complete or interrupted
   */
  const stopScanning = () => {
    console.log('[QR Scanner] Stopping scanner...');

    // Clear the reader reference to stop processing new frames
    // Note: BrowserMultiFormatReader doesn't have a reset() method,
    // so we rely on stopping the video stream and clearing the reference
    if (readerRef.current) {
      readerRef.current = null;
      console.log('[QR Scanner] Reader reference cleared');
    }

    // Stop any video tracks directly to release camera
    // This is the primary method to stop the scanner
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('[QR Scanner] Stopped video track:', track.label);
      });
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    console.log('[QR Scanner] Scanner stopped and camera released');
  };

  /**
   * Auto-start scanning when component mounts and has permission
   */
  useEffect(() => {
    if (hasPermission && !isScanning) {
      startScanning();
    }
  }, [hasPermission]);

  /**
   * Timeout for scanning
   */
  useEffect(() => {
    if (!isScanning) return;

    const timeoutId = setTimeout(() => {
      setError('Scanning timeout. Please try again.');
      stopScanning();
    }, config.scannerTimeout);

    return () => clearTimeout(timeoutId);
  }, [isScanning]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Video element for camera feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Scanning overlay */}
      {isScanning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Scanning frame */}
          <div className="relative w-64 h-64 border-4 border-primary-500 rounded-lg">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>

            {/* Scanning line animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-full h-1 bg-primary-500 shadow-lg shadow-primary-500 animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Status overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {error ? (
          <div className="bg-red-500/90 text-white px-4 py-3 rounded-lg mb-2 text-center">
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-white text-sm font-medium mb-2">
              {isScanning ? 'Scanning...' : 'Ready to scan'}
            </p>
            <p className="text-gray-300 text-xs">
              Position the QR code or barcode within the frame
            </p>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex gap-2 mt-3">
          {!isScanning && hasPermission && (
            <button
              onClick={startScanning}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Start Scanning
            </button>
          )}
          {isScanning && (
            <button
              onClick={stopScanning}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Stop Scanning
            </button>
          )}
        </div>
      </div>

      {/* Permission denied message */}
      {!hasPermission && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-center px-6">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-white text-lg font-semibold mb-2">Camera Access Required</h3>
            <p className="text-gray-400 text-sm">
              Please enable camera permissions to use the scanner
            </p>
          </div>
        </div>
      )}

      {/* Add scanning animation keyframes */}
      <style>{`
        @keyframes scan {
          0% {
            top: 0;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
