import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({ value, size = 96, className = '' }) => {
  const [svgString, setSvgString] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (!value) {
      setSvgString('');
      return;
    }

    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      width: size,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((svg) => {
        if (isMounted) setSvgString(svg);
      })
      .catch((err) => {
        console.error('Error generando QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!svgString) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-white border border-zinc-200 flex items-center justify-center text-[9px] font-mono text-zinc-400 ${className}`}
      >
        QR...
      </div>
    );
  }

  return (
    <div
      className={`inline-block select-none overflow-hidden bg-white ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
};
