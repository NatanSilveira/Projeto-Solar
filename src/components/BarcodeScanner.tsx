import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    // Configurando o scanner: 10 frames por segundo, área de foco (qrbox) retangular para código de barras
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 300, height: 150 },
        aspectRatio: 1.0,
      },
      false // verbose
    );

    scanner.render(
      (decodedText) => {
        // Sucesso: para os frames, limpa e envia o texto
        scanner.clear();
        onScan(decodedText);
      },
      (error) => {
        // Ignora erros de frame (acontecem a cada frame que a câmera não vê um código)
      }
    );

    // Cleanup quando o componente for desmontado
    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-4 backdrop-blur-sm">
      <div className="bg-coke-darker p-4 rounded-2xl w-full max-w-sm border border-coke-gray relative">
        <button 
          onClick={onClose}
          className="absolute -top-14 right-0 text-white p-3 rounded-full bg-coke-gray hover:bg-coke-red transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-white text-center font-bold mb-4 uppercase tracking-wider text-sm">Centralizar Código de Barras</h3>
        
        {/* O scanner injeta a própria UI aqui */}
        <div id="reader" ref={scannerRef} className="w-full bg-white rounded-xl overflow-hidden [&>div]:border-none [&_video]:rounded-xl [&_img]:rounded-xl"></div>
        
        <p className="text-text-dim text-xs text-center mt-4">
          Posicione o código de barras no centro do quadrado para fazer a leitura automática.
        </p>
      </div>
    </div>
  );
}
