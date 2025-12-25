import React, { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface DNANode {
  id: string;
  title: string;
  date: string;
  type: string;
}

interface DNAStrandProps {
  color1: string;
  color2: string;
  nodes: DNANode[];
  onNodeClick: (node: DNANode) => void;
  selectedNodeId: string | null;
}

const DNAStrand = ({ color1, color2, nodes, onNodeClick, selectedNodeId }: DNAStrandProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const { spheres, connections, nodeMapping } = useMemo(() => {
    const sphereData: { position: [number, number, number]; color: string; index: number }[] = [];
    const connectionData: { start: [number, number, number]; end: [number, number, number] }[] = [];
    const mapping: { [key: number]: DNANode } = {};
    
    // Dynamic height based on number of nodes (minimum 3 turns, grows with events)
    const baseTurns = 2;
    const extraTurns = Math.max(0, nodes.length - 4) * 0.5;
    const turns = baseTurns + extraTurns;
    const pointsPerTurn = 8;
    const totalPoints = Math.max(turns * pointsPerTurn, 16);
    const baseHeight = 4;
    const height = baseHeight + (nodes.length * 0.3);
    const radius = 0.4; // Narrower
    
    for (let i = 0; i < totalPoints; i++) {
      const t = i / totalPoints;
      const angle = t * turns * Math.PI * 2;
      const y = (t - 0.5) * height;
      
      // First strand
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const sphereIndex1 = sphereData.length;
      sphereData.push({ position: [x1, y, z1], color: color1, index: sphereIndex1 });
      
      // Map nodes to spheres
      const nodeIndex = Math.floor((i / totalPoints) * nodes.length);
      if (nodes[nodeIndex] && i % 2 === 0) {
        mapping[sphereIndex1] = nodes[nodeIndex];
      }
      
      // Second strand (opposite side)
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;
      const sphereIndex2 = sphereData.length;
      sphereData.push({ position: [x2, y, z2], color: color2, index: sphereIndex2 });
      
      if (nodes[nodeIndex] && i % 2 === 1) {
        mapping[sphereIndex2] = nodes[nodeIndex];
      }
      
      // Connection between strands (base pairs)
      if (i % 2 === 0) {
        connectionData.push({
          start: [x1, y, z1],
          end: [x2, y, z2],
        });
      }
    }
    
    return { spheres: sphereData, connections: connectionData, nodeMapping: mapping };
  }, [color1, color2, nodes]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  const handleSphereClick = useCallback((e: ThreeEvent<MouseEvent>, index: number) => {
    e.stopPropagation();
    const node = nodeMapping[index];
    if (node) {
      onNodeClick(node);
    }
  }, [nodeMapping, onNodeClick]);

  const isNodeActive = (index: number) => {
    const node = nodeMapping[index];
    return node && node.id === selectedNodeId;
  };

  const hasNode = (index: number) => !!nodeMapping[index];

  return (
    <group ref={groupRef}>
      {/* DNA spheres */}
      {spheres.map((sphere, i) => {
        const hasLinkedNode = hasNode(i);
        const isActive = isNodeActive(i);
        const isHovered = hoveredIndex === i && hasLinkedNode;
        const scale = isActive ? 1.8 : isHovered ? 1.4 : 1;
        
        return (
          <mesh 
            key={`sphere-${i}`} 
            position={sphere.position}
            scale={scale}
            onClick={(e) => hasLinkedNode && handleSphereClick(e, i)}
            onPointerEnter={() => hasLinkedNode && setHoveredIndex(i)}
            onPointerLeave={() => setHoveredIndex(null)}
          >
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color={sphere.color}
              emissive={sphere.color}
              emissiveIntensity={isActive ? 1.5 : isHovered ? 1 : 0.8}
              metalness={0.1}
              roughness={0.2}
              transparent
              opacity={hasLinkedNode ? 0.9 : 0.4}
            />
          </mesh>
        );
      })}
      
      {/* Glow rings for active nodes */}
      {spheres.map((sphere, i) => {
        if (!isNodeActive(i)) return null;
        return (
          <mesh key={`glow-${i}`} position={sphere.position}>
            <ringGeometry args={[0.1, 0.15, 32]} />
            <meshBasicMaterial
              color={sphere.color}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
      
      {/* Base pair connections */}
      {connections.map((conn, i) => {
        const start = new THREE.Vector3(...conn.start);
        const end = new THREE.Vector3(...conn.end);
        const mid = start.clone().lerp(end, 0.5);
        const length = start.distanceTo(end);
        const direction = end.clone().sub(start).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction
        );
        
        return (
          <mesh
            key={`conn-${i}`}
            position={[mid.x, mid.y, mid.z]}
            quaternion={quaternion}
          >
            <cylinderGeometry args={[0.015, 0.015, length, 8]} />
            <meshStandardMaterial
              color="#c084fc"
              emissive="#c084fc"
              emissiveIntensity={0.5}
              transparent
              opacity={0.3}
            />
          </mesh>
        );
      })}
      
      {/* Backbone connections */}
      {spheres.map((sphere, i, arr) => {
        if (i < 2) return null;
        const prevIndex = i - 2;
        if (prevIndex < 0) return null;
        
        const prevSphere = arr[prevIndex];
        const start = new THREE.Vector3(...prevSphere.position);
        const end = new THREE.Vector3(...sphere.position);
        const mid = start.clone().lerp(end, 0.5);
        const length = start.distanceTo(end);
        const direction = end.clone().sub(start).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction
        );
        
        return (
          <mesh
            key={`backbone-${i}`}
            position={[mid.x, mid.y, mid.z]}
            quaternion={quaternion}
          >
            <cylinderGeometry args={[0.02, 0.02, length, 8]} />
            <meshStandardMaterial
              color={sphere.color}
              emissive={sphere.color}
              emissiveIntensity={0.6}
              transparent
              opacity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
};

interface DNA3DHelixProps {
  events?: { id: string; title: string; date: string; type: string }[];
  onNodeClick?: (node: { id: string; title: string; date: string; type: string }) => void;
  selectedEventId?: string | null;
}

const DNA3DHelix = ({ events = [], onNodeClick, selectedEventId = null }: DNA3DHelixProps) => {
  const handleNodeClick = useCallback((node: DNANode) => {
    onNodeClick?.(node);
  }, [onNodeClick]);

  // Calculate height based on events
  const containerHeight = Math.max(500, 400 + events.length * 20);

  return (
    <div className="w-full h-full" style={{ minHeight: `${containerHeight}px` }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[3, 3, 3]} intensity={1.5} color="#a855f7" />
        <pointLight position={[-3, -3, -3]} intensity={0.8} color="#d4a574" />
        <pointLight position={[0, 0, 2]} intensity={1} color="#c084fc" />
        <pointLight position={[0, 2, 0]} intensity={0.5} color="#e9d5ff" />
        
        <Float
          speed={1}
          rotationIntensity={0.1}
          floatIntensity={0.2}
        >
          <DNAStrand 
            color1="#a855f7" 
            color2="#d4a574" 
            nodes={events}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedEventId}
          />
        </Float>
        
        {/* Outer glow effect */}
        <mesh position={[0, 0, -3]}>
          <circleGeometry args={[2, 64]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.08}
          />
        </mesh>
        
        {/* Inner glow */}
        <mesh position={[0, 0, -2.5]}>
          <circleGeometry args={[1, 64]} />
          <meshBasicMaterial
            color="#c084fc"
            transparent
            opacity={0.1}
          />
        </mesh>
      </Canvas>
    </div>
  );
};

export default DNA3DHelix;
