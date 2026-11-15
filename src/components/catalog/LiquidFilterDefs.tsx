/**
 * Filtro SVG partilhado do "metal líquido" (ref. vídeo 4).
 * Ruído fractal animado + mapa de deslocamento: deforma os gradientes do cartão como um líquido.
 * Renderizado uma vez no layout; os cartões referenciam-no com filter: url(#so-liquid).
 */
export function LiquidFilterDefs() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }} focusable="false">
      <defs>
        <filter id="so-liquid" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.007" numOctaves="1" seed="7" result="noise">
            <animate
              attributeName="baseFrequency"
              dur="16s"
              values="0.004 0.007;0.007 0.0035;0.004 0.007"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="55" xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </defs>
    </svg>
  );
}
