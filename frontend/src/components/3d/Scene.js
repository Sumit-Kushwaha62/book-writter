import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

const Book3D = () => {
  const bookRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (bookRef.current) {
      bookRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
      bookRef.current.position.y = Math.sin(t) * 0.1;
    }
  });

  return (
    <group ref={bookRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Book Cover */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3, 4, 0.5]} />
          <MeshTransmissionMaterial 
            backside 
            samples={4} 
            thickness={1} 
            chromaticAberration={0.025} 
            anisotropy={0.1} 
            distortion={0.1} 
            distortionScale={0.1} 
            temporalDistortion={0.1} 
            color="#bae6fd"
          />
        </mesh>
        
        {/* Pages */}
        <mesh position={[0.1, 0, 0]}>
          <boxGeometry args={[2.8, 3.8, 0.45]} />
          <meshStandardMaterial color="#fefce8" roughness={0.3} />
        </mesh>

        <Text
          position={[0, 0, 0.26]}
          fontSize={0.3}
          color="#0369a1"
          font="https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD7K8U3Zcy9o-T65K1988g5jW_N1Z1_Y6.woff"
        >
          AI WRITER
        </Text>
      </Float>
    </group>
  );
};

export default Book3D;
