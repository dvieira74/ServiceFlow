import type { SVGProps } from 'react';

export function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Círculo externo representando controle e unidade */}
      <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
      
      {/* Símbolo de engrenagem simplificado para serviço */}
      <path 
        d="M12 8v4l2.5 2.5" 
        strokeOpacity="0.6"
      />
      
      {/* Elemento dinâmico representando o Fluxo e Sucesso */}
      <path 
        d="M7 12l3 3 7-7" 
        stroke="hsl(var(--accent))" 
        strokeWidth="3" 
      />
      
      {/* Detalhes de precisão */}
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeOpacity="0.3" strokeWidth="1.5" />
    </svg>
  );
}
