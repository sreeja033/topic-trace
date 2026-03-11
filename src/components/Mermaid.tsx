import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif'
});

export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    if (chart) {
      const renderChart = async () => {
        try {
          const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          setSvgContent(svg);
        } catch (error) {
          console.error("Failed to render mermaid chart", error);
        }
      };
      renderChart();
    }
  }, [chart]);

  return (
    <div 
      className="flex justify-center overflow-auto w-full p-4"
      dangerouslySetInnerHTML={{ __html: svgContent }} 
    />
  );
}
