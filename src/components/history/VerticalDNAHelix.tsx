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
  
  const pulseScale = useTransform(scrollY, [0, 500, 1000], [1, 1.05, 1]);
  const pulseOpacity = useTransform(scrollY, [0, 250, 500, 750, 1000], [0.8, 1, 0.8, 1, 0.8]);

  const helixHeight = Math.max(800, nodes.length * 150 + 200);
  
  const helixData = useMemo(() => {
    const points: { x1: number; y: number; x2: number }[] = [];
    const nodePositions: { x: number; y: number; nodeIndex: number; side: 'left' | 'right' }[] = [];
    
    const amplitude = 40;
    const frequency = 0.015;
    
    for (let y = 0; y <= helixHeight; y += 8) {
      const phase = y * frequency;
      const x1 = 50 + Math.sin(phase) * amplitude;
      const x2 = 50 + Math.sin(phase + Math.PI) * amplitude;
      points.push({ x1, y, x2 });
    }
    
    nodes.forEach((node, index) => {
      const y = 100 + index * 120;
      const phase = y * frequency;
      const side = index % 2 === 0 ? 'left' : 'right';
      const x = 50 + Math.sin(phase + (side === 'left' ? 0 : Math.PI)) * amplitude;
      nodePositions.push({ x, y, nodeIndex: index, side });
    });
    
    return { points, nodePositions };
  }, [nodes, helixHeight]);

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

  const connections = useMemo(() => {
    return helixData.points.filter((_, i) => i % 12 === 0).map((p, i) => ({
      x1: p.x1,
      y1: p.y,
      x2: p.x2,
      y2: p.y,
      key: i,
    }));
  }, [helixData]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'hsl(350 80% 60%)';
      case 'goal': return 'hsl(140 70% 50%)';
      case 'stress_peak': return 'hsl(45 90% 55%)';
      default: return 'hsl(195 100% 50%)';
    }
  };

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-0" style={{ height: helixHeight, width: 300 }}>
      <motion.svg
        width="300"
        height={helixHeight}
        viewBox={`-100 0 300 ${helixHeight}`}
        className="overflow-visible"
        style={{ scale: pulseScale }}
      >
        <defs>
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="lineGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="helixGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(190 100% 60%)" />
            <stop offset="50%" stopColor="hsl(200 90% 55%)" />
            <stop offset="100%" stopColor="hsl(210 85% 50%)" />
          </linearGradient>
          
          {/* Animated gradient for connection lines */}
          <linearGradient id="connectionGradientLeft" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="hsl(195 100% 60%)" stopOpacity="1">
              <animate attributeName="stopOpacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="hsl(195 100% 50%)" stopOpacity="0.6">
              <animate attributeName="stopOpacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
          
          <linearGradient id="connectionGradientRight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(195 100% 60%)" stopOpacity="1">
              <animate attributeName="stopOpacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="hsl(195 100% 50%)" stopOpacity="0.6">
              <animate attributeName="stopOpacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
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

        {/* Animated connection lines from nodes to cards */}
        {helixData.nodePositions.map((pos, idx) => {
          const node = nodes[idx];
          const isSelected = node.id === selectedNodeId;
          const nodeColor = getNodeColor(node.type);
          const targetX = pos.side === 'left' ? -120 : 220;
          
          // Create curved path for the connection
          const controlX = pos.side === 'left' ? pos.x - 40 : pos.x + 40;
          const curvePath = `M ${pos.x} ${pos.y} Q ${controlX} ${pos.y} ${targetX} ${pos.y}`;
          
          return (
            <g key={`conn-${node.id}`}>
              {/* Glow layer for connection */}
              <motion.path
                d={curvePath}
                fill="none"
                stroke={nodeColor}
                strokeWidth="3"
                strokeOpacity={0.3}
                filter="url(#lineGlow)"
                initial={{ pathLength: 0 }}
                animate={{ 
                  pathLength: 1,
                  strokeOpacity: isSelected ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2],
                }}
                transition={{ 
                  pathLength: { duration: 1, delay: idx * 0.15 },
                  strokeOpacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                }}
              />
              
              {/* Main connection line */}
              <motion.path
                d={curvePath}
                fill="none"
                stroke={pos.side === 'left' ? 'url(#connectionGradientLeft)' : 'url(#connectionGradientRight)'}
                strokeWidth="2"
                strokeDasharray="8 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
              />
              
              {/* Animated particle along the line */}
              <motion.circle
                r="3"
                fill={nodeColor}
                filter="url(#strongGlow)"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: idx * 0.5,
                  ease: 'linear',
                }}
              >
                <animateMotion
                  dur="3s"
                  repeatCount="indefinite"
                  path={curvePath}
                  begin={`${idx * 0.5}s`}
                />
              </motion.circle>
            </g>
          );
        })}

        {/* Event nodes on the helix */}
        {helixData.nodePositions.map((pos, idx) => {
          const node = nodes[idx];
          const isSelected = node.id === selectedNodeId;
          const nodeColor = getNodeColor(node.type);
          
          return (
            <g key={node.id}>
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
              
              {/* Secondary pulse ring */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={8}
                fill="transparent"
                stroke={nodeColor}
                strokeWidth="1"
                strokeOpacity={0.3}
                animate={{
                  r: [8, 24, 8],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: idx * 0.2,
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
