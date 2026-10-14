import React, { useMemo } from 'react';

interface BarcodeEan13SvgProps {
  code: string;
  className?: string;
  style?: React.CSSProperties;
  height?: number;
}

const L_CODES: Record<string, string> = {
  '0': '0001101',
  '1': '0011001',
  '2': '0010011',
  '3': '0111101',
  '4': '0100011',
  '5': '0110001',
  '6': '0101111',
  '7': '0111011',
  '8': '0110111',
  '9': '0001011',
};

const G_CODES: Record<string, string> = {
  '0': '0100111',
  '1': '0110011',
  '2': '0011011',
  '3': '0100001',
  '4': '0011101',
  '5': '0111001',
  '6': '0000101',
  '7': '0010001',
  '8': '0001001',
  '9': '0010111',
};

const R_CODES: Record<string, string> = {
  '0': '1110010',
  '1': '1100110',
  '2': '1101100',
  '3': '1000010',
  '4': '1011100',
  '5': '1001110',
  '6': '1010000',
  '7': '1000100',
  '8': '1001000',
  '9': '1110100',
};

const PARITY_MAP: Record<string, string> = {
  '0': 'LLLLLL',
  '1': 'LLGLGG',
  '2': 'LLGGLG',
  '3': 'LLGGGL',
  '4': 'LGLLGG',
  '5': 'LGGLLG',
  '6': 'LGGGLL',
  '7': 'LGLGLG',
  '8': 'LGLGGL',
  '9': 'LGGLGL',
};

function calcularChecksumEan13(first12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(first12[i] || '0', 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

export const BarcodeEan13Svg: React.FC<BarcodeEan13SvgProps> = ({
  code,
  className = '',
  style,
  height = 26,
}) => {
  const { modules, isValid, firstDigit, left6, right6 } = useMemo(() => {
    // Normalizar código eliminando caracteres no numéricos
    const clean = (code || '').replace(/\D/g, '');
    let full = clean.length === 0 ? '200000000000' : clean;

    if (full.length < 12) {
      full = full.padStart(12, '0');
    }
    if (full.length === 12) {
      full = `${full}${calcularChecksumEan13(full)}`;
    } else if (full.length > 13) {
      full = full.slice(0, 13);
    }

    if (full.length !== 13) {
      full = '2000000000005';
    }

    const firstDigit = full[0];
    const left6 = full.slice(1, 7);
    const right6 = full.slice(7, 13);
    const parity = PARITY_MAP[firstDigit] || 'LLLLLL';

    const bits: { isBlack: boolean; isGuard: boolean }[] = [];

    // Guard inicial (101) - bits 0-2
    '101'.split('').forEach((b) => bits.push({ isBlack: b === '1', isGuard: true }));

    // Izquierda (6 dígitos x 7 módulos = 42 módulos, bits 3-44)
    for (let i = 0; i < 6; i++) {
      const digit = left6[i];
      const codeType = parity[i];
      const pattern = codeType === 'G' ? G_CODES[digit] : L_CODES[digit];
      pattern.split('').forEach((b) => bits.push({ isBlack: b === '1', isGuard: false }));
    }

    // Guard central (01010) - bits 45-49
    '01010'.split('').forEach((b) => bits.push({ isBlack: b === '1', isGuard: true }));

    // Derecha (6 dígitos x 7 módulos = 42 módulos, bits 50-91)
    for (let i = 0; i < 6; i++) {
      const digit = right6[i];
      const pattern = R_CODES[digit];
      pattern.split('').forEach((b) => bits.push({ isBlack: b === '1', isGuard: false }));
    }

    // Guard final (101) - bits 92-94
    '101'.split('').forEach((b) => bits.push({ isBlack: b === '1', isGuard: true }));

    return { modules: bits, isValid: true, firstDigit, left6, right6 };
  }, [code]);

  if (!isValid) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '6px',
          color: '#000000',
          backgroundColor: '#FFFFFF',
          ...style,
        }}
      >
        SIN CÓDIGO
      </div>
    );
  }

  // Dimensiones EAN-13 estándar:
  // Ancho de módulo = 1.15px, 95 módulos -> 109.25px
  // Quiet zone izquierda = 8px (aloja el 1er dígito antes de la guardia inicial)
  // Quiet zone derecha = 4.5px
  const moduleWidth = 1.15;
  const quietZoneLeft = 8;
  const quietZoneRight = 4.5;
  const dataBarHeight = 20;
  const guardHeight = 26;
  const totalWidth = quietZoneLeft + 95 * moduleWidth + quietZoneRight;
  const totalHeight = 28.5;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className={`select-none ${className}`}
      style={{
        shapeRendering: 'crispEdges',
        maxWidth: '100%',
        height: `${height}px`,
        backgroundColor: '#FFFFFF',
        ...style,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fondo blanco puro */}
      <rect x="0" y="0" width={totalWidth} height={totalHeight} fill="#FFFFFF" />

      {/* Barras verticales negras: guardias (h=26) vs datos (h=20) */}
      {modules.map((m, idx) => {
        if (!m.isBlack) return null;
        const x = quietZoneLeft + idx * moduleWidth;
        const h = m.isGuard ? guardHeight : dataBarHeight;
        return (
          <rect
            key={idx}
            x={x}
            y={0}
            width={moduleWidth}
            height={h}
            fill="#000000"
          />
        );
      })}

      {/* 1. Primer dígito a la izquierda de la primera barra de guardia */}
      <text
        x={4.2}
        y={26.5}
        textAnchor="middle"
        fill="#000000"
        fontSize="6.5"
        fontWeight="bold"
        fontFamily="'JetBrains Mono', 'Courier New', monospace"
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: '6.5px',
          fontWeight: 'bold',
          fill: '#000000',
        }}
      >
        {firstDigit}
      </text>

      {/* 2. Primer grupo de 6 dígitos centrado bajo la mitad izquierda */}
      <text
        x={35.6}
        y={26.5}
        textAnchor="middle"
        letterSpacing="0.5px"
        fill="#000000"
        fontSize="6.5"
        fontWeight="bold"
        fontFamily="'JetBrains Mono', 'Courier New', monospace"
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: '6.5px',
          fontWeight: 'bold',
          fill: '#000000',
        }}
      >
        {left6}
      </text>

      {/* 3. Segundo grupo de 6 dígitos centrado bajo la mitad derecha */}
      <text
        x={89.65}
        y={26.5}
        textAnchor="middle"
        letterSpacing="0.5px"
        fill="#000000"
        fontSize="6.5"
        fontWeight="bold"
        fontFamily="'JetBrains Mono', 'Courier New', monospace"
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: '6.5px',
          fontWeight: 'bold',
          fill: '#000000',
        }}
      >
        {right6}
      </text>
    </svg>
  );
};
