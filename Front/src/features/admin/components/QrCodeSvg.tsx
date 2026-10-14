import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 48,
  className = '',
  style,
}) => {
  const [svgString, setSvgString] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const safeValue = value && value.trim().length > 0 ? value.trim() : '0000000000000';

    QRCode.toString(safeValue, {
      type: 'svg',
      margin: 0,
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
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#FFFFFF',
          color: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '6px',
          fontFamily: 'monospace',
          border: 'none',
          ...style,
        }}
      >
        QR
      </div>
    );
  }

  return (
    <div
      className={`inline-block select-none overflow-hidden ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: '#FFFFFF',
        color: '#000000',
        border: 'none',
        lineHeight: 0,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
};
