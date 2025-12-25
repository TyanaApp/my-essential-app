import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface DNAStrandProps {
  color1: string;
  color2: string;
}

const DNAStrand = ({ color1, color2 }: DNAStrandProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const { spheres, connections } = useMemo(() => {
    const sphereData: { position: [number, number, number]; color: string }[] = [];
    const connectionData: { start: [number, number, number]; end: [number, number, number] }[] = [];
    
    const turns = 3;
    const pointsPerTurn = 12;
    const totalPoints = turns * pointsPerTurn;
    const height = 6;
    const radius = 0.8;
    
    for (let i = 0; i < totalPoints; i++) {
      const t = i / totalPoints;
      const angle = t * turns * Math.PI * 2;
      const y = (t - 0.5) * height;
      
      // First strand
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      sphereData.push({ position: [x1, y, z1], color: color1 });
      
      // Second strand (opposite side)
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;
      sphereData.push({ position: [x2, y, z2], color: color2 });
      
      // Connection between strands (base pairs)
      if (i % 2 === 0) {
        connectionData.push({
          start: [x1, y, z1],
          end: [x2, y, z2],
        });
      }
    }
    
    return { spheres: sphereData, connections: connectionData };
  }, [color1, color2]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* DNA spheres */}
      {spheres.map((sphere, i) => (
        <mesh key={`sphere-${i}`} position={sphere.position}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color={sphere.color}
            emissive={sphere.color}
            emissiveIntensity={0.5}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      ))}
      
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
            <cylinderGeometry args={[0.02, 0.02, length, 8]} />
            <meshStandardMaterial
              color="#d4a574"
              emissive="#d4a574"
              emissiveIntensity={0.3}
              transparent
              opacity={0.6}
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
            <cylinderGeometry args={[0.03, 0.03, length, 8]} />
            <meshStandardMaterial
              color={sphere.color}
              emissive={sphere.color}
              emissiveIntensity={0.4}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const DNA3DHelix = () => {
  return (
    <div className="w-full h-full min-h-[500px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#a855f7" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#d4a574" />
        <pointLight position={[0, 0, 3]} intensity={0.8} color="#c084fc" />
        
        <Float
          speed={1.5}
          rotationIntensity={0.2}
          floatIntensity={0.3}
        >
          <DNAStrand color1="#a855f7" color2="#d4a574" />
        </Float>
        
        {/* Glow effect */}
        <mesh position={[0, 0, -2]}>
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.05}
          />
        </mesh>
      </Canvas>
    </div>
  );
};

export default DNA3DHelix;
