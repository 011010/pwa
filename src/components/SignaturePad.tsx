/**
 * Signature Pad Component
 *
 * Allows users to draw their signature on a canvas using touch or mouse.
 * Provides save and clear functionality with base64 export.
 */

import React, { useRef, useEffect, useState } from 'react';
import SignaturePadLib from 'signature_pad';
import type { SignaturePadProps } from '../types';

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);

  /**
   * Initialize signature pad
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const signaturePad = new SignaturePadLib(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1,
      maxWidth: 3,
      throttle: 16, // 60 FPS
      velocityFilterWeight: 0.7,
    });

    signaturePadRef.current = signaturePad;

    // Handle canvas resize
    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      canvas.getContext('2d')!.scale(ratio, ratio);

      // Clear the canvas after resize
      signaturePad.clear();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track signature changes
    const handleBeginStroke = () => {
      setIsEmpty(false);
    };

    signaturePad.addEventListener('beginStroke', handleBeginStroke);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      signaturePad.removeEventListener('beginStroke', handleBeginStroke);
      signaturePad.off();
    };
  }, []);

  /**
   * Clear signature
   */
  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);

      if (onClear) {
        onClear();
      }
    }
  };

  /**
   * Save signature as base64 image
   */
  const handleSave = () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      alert('Please provide a signature first');
      return;
    }

    // Get signature as base64 PNG
    const dataURL = signaturePadRef.current.toDataURL('image/png');
    onSave(dataURL);
  };

  /**
   * Undo last stroke
   */
  const handleUndo = () => {
    if (!signaturePadRef.current) return;

    const data = signaturePadRef.current.toData();
    if (data.length > 0) {
      data.pop(); // Remove last stroke
      signaturePadRef.current.fromData(data);

      // Check if canvas is now empty
      setIsEmpty(signaturePadRef.current.isEmpty());
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Digital Signature</h3>
        <p className="text-sm text-gray-600 mt-1">
          Sign in the area below using your finger or stylus
        </p>
      </div>

      {/* Canvas container */}
      <div className="flex-1 relative p-4 bg-gray-100">
        <div className="relative w-full h-full bg-white rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            style={{ touchAction: 'none' }}
          />

          {/* Empty state hint */}
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <p className="text-sm font-medium">Sign Here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex gap-2">
          {/* Undo button */}
          <button
            onClick={handleUndo}
            disabled={isEmpty}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            Undo
          </button>

          {/* Clear button */}
          <button
            onClick={handleClear}
            disabled={isEmpty}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isEmpty}
            className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
