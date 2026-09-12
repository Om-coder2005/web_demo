"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Hero3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create 3D floating geometrical "POS elements" (Golden Serving Plates, Canteen Rings, Glowing Embers)
    const group = new THREE.Group();

    // Plate 1 (Signature Khandoli Golden Yellow Dish)
    const plateGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.4, 32);
    const plateMat = new THREE.MeshPhongMaterial({
      color: 0xFCC500,
      wireframe: false,
      shininess: 120,
      flatShading: false
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(-4, 2, 0);
    plate.rotation.x = 0.5;
    group.add(plate);

    // Torus (Matte Charcoal Ring with metallic sheen)
    const torusGeo = new THREE.TorusGeometry(1.8, 0.6, 16, 100);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.2,
      metalness: 0.8
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.set(4, -1, 1);
    group.add(torus);

    // Floating Glowing Orb (Signature Egg Yolk Amber Glow)
    const orbGeo = new THREE.IcosahedronGeometry(1.2, 2);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xFCC500,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0, -3, -2);
    group.add(orb);

    // Additional floating golden particles
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 140;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 30;
    }

    particlesGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    const particlesMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xFCC500,
      transparent: true,
      opacity: 0.85
    });

    const particleMesh = new THREE.Points(particlesGeo, particlesMat);
    group.add(particleMesh);

    scene.add(group);

    // Lights (Warm Golden & Neutral)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xFCC500, 2.5, 50);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffa000, 1.8, 50);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Mouse movement response
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      plate.rotation.y += 0.01;
      plate.rotation.z += 0.005;

      torus.rotation.x += 0.01;
      torus.rotation.y += 0.015;

      orb.rotation.y += 0.02;

      particleMesh.rotation.y += 0.002;

      // Smooth camera sway following mouse
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 2 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // Resize listener
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0
      }}
    />
  );
}
