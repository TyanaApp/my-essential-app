import { useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface DNANode {
  id: string;
  title: string;
  date: string;
  type: 'trigger' | 'goal' | 'stress_peak';
  yPosition: number;
}

interface VerticalDNAHelixProps {
  nodes: DNANode[];
  onNodeClick: (node: DNANode) => void;
  selectedNodeId: string | null;
}

const VerticalDNAHelix = ({ nodes, onNodeClick, selectedNodeId }: VerticalDNAHelixProps) => {
  const { scrollY } = useScroll();
  
  // Pulse animation based on scroll
  const pulseScale = useTransform(scrollY, [0, 500, 1000], [1, 1.05, 1]);
  const pulseOpacity = useTransform(scrollY, [0, 250, 500, 750, 1000], [0.8, 1, 0.8, 1, 0.8]);

  const helixHeight = Math.max(800, nodes.length * 150 + 200);
  
  // Generate helix path points
  const helixData = useMemo(() => {
    const points: { x1: number; y: number; x2: number }[] = [];
    const nodePositions: { x: number; y: number; nodeIndex: number }[] = [];
    
    const amplitude = 40; // Helix width
    const frequency = 0.015; // How tight the spiral is
    
    for (let y = 0; y <= helixHeight; y += 8) {
      const phase = y * frequency;
      const x1 = 50 + Math.sin(phase) * amplitude;
      const x2 = 50 + Math.sin(phase + Math.PI) * amplitude;
      points.push({ x1, y, x2 });
    }
    
    // Calculate node positions along the helix
    nodes.forEach((node, index) => {
      const y = 100 + index * 120;
      const phase = y * frequency;
      const side = index % 2 === 0 ? 1 : -1;
      const x = 50 + Math.sin(phase + (side === 1 ? 0 : Math.PI)) * amplitude;
      nodePositions.push({ x, y, nodeIndex: index });
    });
    
    return { points, nodePositions };
  }, [nodes, helixHeight]);

  // Create SVG path for both strands
  const strand1Path = useMemo(() => {
    return helixData.points.map((p, i) => 
      (i === 0 ? 'M' : 'L') + `${p.x1} ${p.y}`
    ).join(' ');
  }, [helixData]);

  const strand2Path = useMemo(() => {
    return helixData.points.map((p, i) => 
      (i === 0 ? 'M' : 'L') + `${p.x2} ${p.y}`
    ).join(' ');
  }, [helixData]);

  // Cross connections (base pairs)
  const connections = useMemo(() => {
    return helixData.points.filter((_, i) => i % 12 === 0).map((p, i) => ({
      x1: p.x1,
      y1: p.y,
      x2: p.x2,
      y2: p.y,
      key: i,
    }));
  }, [helixData]);

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-0" style={{ height: helixHeight }}>
      <motion.svg
        width="100"
        height={helixHeight}
        viewBox={`0 0 100 ${helixHeight}`}
        className="overflow-visible"
        style={{ scale: pulseScale }}
      >
        {/* Glow filter */}
        <defs>
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="helixGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(190 100% 60%)" />
            <stop offset="50%" stopColor="hsl(200 90% 55%)" />
            <stop offset="100%" stopColor="hsl(210 85% 50%)" />
          </linearGradient>
        </defs>

        {/* Strand 1 - Glow layer */}
        <motion.path
          d={strand1Path}
          fill="none"
          stroke="hsl(195 100% 50%)"
          strokeWidth="4"
          filter="url(#strongGlow)"
          style={{ opacity: pulseOpacity }}
        />
        
        {/* Strand 1 - Main */}
        <motion.path
          d={strand1Path}
          fill="none"
          stroke="url(#helixGradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Strand 2 - Glow layer */}
        <motion.path
          d={strand2Path}
          fill="none"
          stroke="hsl(195 100% 50%)"
          strokeWidth="4"
          filter="url(#strongGlow)"
          style={{ opacity: pulseOpacity }}
        />
        
        {/* Strand 2 - Main */}
        <motion.path
          d={strand2Path}
          fill="none"
          stroke="url(#helixGradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Base pair connections */}
        {connections.map((conn) => (
          <motion.line
            key={conn.key}
            x1={conn.x1}
            y1={conn.y1}
            x2={conn.x2}
            y2={conn.y2}
            stroke="hsl(195 80% 60%)"
            strokeWidth="1"
            opacity={0.4}
            filter="url(#neonGlow)"
          />
        ))}

        {/* Event nodes on the helix */}
        {helixData.nodePositions.map((pos, idx) => {
          const node = nodes[idx];
          const isSelected = node.id === selectedNodeId;
          const nodeColor = 
            node.type === 'trigger' ? 'hsl(350 80% 60%)' :
            node.type === 'goal' ? 'hsl(140 70% 50%)' :
            'hsl(45 90% 55%)';
          
          return (
            <g key={node.id}>
              {/* Connection line from node to card position */}
              <motion.line
                x1={pos.x}
                y1={pos.y}
                x2={idx % 2 === 0 ? -60 : 160}
                y2={pos.y}
                stroke={nodeColor}
                strokeWidth="1"
                opacity={0.5}
                strokeDasharray="4 4"
                filter="url(#neonGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
              />
              
              {/* Outer glow ring */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={isSelected ? 16 : 12}
                fill="transparent"
                stroke={nodeColor}
                strokeWidth="2"
                filter="url(#strongGlow)"
                animate={{
                  r: isSelected ? [16, 20, 16] : [12, 14, 12],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              
              {/* Main node */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={isSelected ? 10 : 8}
                fill={nodeColor}
                stroke="white"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onNodeClick(node)}
              />
            </g>
          );
        })}
      </motion.svg>
    </div>
  );
};

export default VerticalDNAHelix;
