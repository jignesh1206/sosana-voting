'use client';

import { useEffect } from 'react';

export default function Polyfills() {
  useEffect(() => {
    // Polyfill for crypto
    if (typeof window !== 'undefined') {
      if (!window.crypto) {
        (window as any).crypto = require('crypto-browserify');
      }
      
      // Ensure Buffer is available
      if (!window.Buffer) {
        (window as any).Buffer = require('buffer').Buffer;
      }
      
      // Ensure process is available
      if (!window.process) {
        (window as any).process = require('process/browser');
      }
    }
  }, []);

  return null;
}
