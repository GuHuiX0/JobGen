/**
 * WhiteStudioScene
 * -----------------------------------------------------------------------------
 * Full-screen 3D studio background used in the interview room.
 *
 * Responsibilities:
 * - Initialize core Three.js systems (scene, camera, renderer)
 * - Load HDRI lighting + static environment model
 * - Load and animate the floating robot (GLTF + AnimationMixer)
 * - Support layout presets for camera offsets and robot positioning
 * - Provide subtle mouse-based parallax for immersive depth
 * - Maintain a continuous animation loop with cleanup on unmount
 *
 * Props:
 * - layoutPreset: chooses camera/robot offsets (e.g., "leftThirds")
 *
 * Notes:
 * - Runs entirely off-screen; UI elements are layered above this canvas
 * - WebGL resources are explicitly disposed to avoid memory leaks
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader';

const WhiteStudioScene = ({ layoutPreset = 'leftThirds' }) => {
  // Mount + scene handles
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);

  // Animation + state refs
  const animationRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const cameraRotationRef = useRef({ x: 0, y: 0 });

  // Robot + animation mixer
  const robotRef = useRef(null);
  const mixerRef = useRef(null);

  const lookAtOffsetRef = useRef(new THREE.Vector3(0, 0.7, 0));

  /**
   * Scene initialization
   * ---------------------------------------------------------------------------
   * Sets up renderer, scene, camera, HDRI, models, lighting, and animation loop.
   */
  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    /** Layout presets for camera + robot offsets */
    const PRESETS = {
      leftThirds: { fov: 70, offsetX: -0.35, offsetY: 0.15, distance: 1.6, robotScale: 0.9 },
      sunkenStage: { fov: 62, offsetX: 0, offsetY: -0.05, distance: 1.8, robotScale: 0.95 },
    };
    const P = PRESETS[layoutPreset] || PRESETS.leftThirds;

    /** Scene */
    const scene = new THREE.Scene();
    const bg = new THREE.Color(0xe9edf6);
    scene.background = bg;
    scene.fog = new THREE.Fog(bg.getHex(), 40, 120);
    sceneRef.current = scene;

    /** Camera */
    const camera = new THREE.PerspectiveCamera(P.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 2.5);
    camera.lookAt(0, 1.3, 0);
    cameraRef.current = camera;

    /** Renderer */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.physicallyCorrectLights = true;
    rendererRef.current = renderer;

    /** Environment HDRI */
    new HDRLoader().load('/textures/studio_small_09_1k.hdr', (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = hdr;
    });

    currentMount.appendChild(renderer.domElement);

    /** Lighting + models */
    setupLighting(scene);
    loadGLBModel(scene);
    loadRobotModel(scene, camera, P);

    /**
     * Mouse parallax (light camera sway)
     */
    const targetRotation = { x: 0, y: 0 };
    const handleMouseMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      const maxAngle = THREE.MathUtils.degToRad(10);

      targetRotation.y = -nx * maxAngle;
      targetRotation.x = -ny * maxAngle;
    };
    window.addEventListener('mousemove', handleMouseMove);

    /**
     * Per-frame look-at behavior for camera
     */
    const updateCameraRotation = (cam) => {
      if (robotRef.current) {
        cam.lookAt(robotRef.current.position.clone().add(lookAtOffsetRef.current));
        return;
      }
      const { x, y } = cameraRotationRef.current;
      const d = 10;
      cam.lookAt(
        cam.position.x + Math.sin(y) * Math.cos(x) * d,
        cam.position.y + Math.sin(x) * d,
        cam.position.z + Math.cos(y) * Math.cos(x) * d
      );
    };

    /**
     * Animation loop
     */
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      cameraRotationRef.current.x += (targetRotation.x - cameraRotationRef.current.x) * 0.08;
      cameraRotationRef.current.y += (targetRotation.y - cameraRotationRef.current.y) * 0.08;

      updateCameraRotation(camera);

      // Floating robot motion + Y-offset sync with camera
      if (robotRef.current) {
        const t = performance.now() * 0.001;
        const baseY = robotRef.current.userData.baseY ?? robotRef.current.position.y;
        robotRef.current.userData.baseY = baseY;
        robotRef.current.position.y = baseY + Math.sin(t) * 0.15;

        camera.position.y = robotRef.current.position.y + lookAtOffsetRef.current.y;
      }

      const delta = clockRef.current.getDelta();
      mixerRef.current?.update(delta);

      renderer.render(scene, camera);
    };
    animate();

    /** Resize handler */
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    /**
     * Cleanup (dispose WebGL objects to prevent memory leaks)
     */
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      if (currentMount && renderer.domElement)
        currentMount.removeChild(renderer.domElement);

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
        }
      });

      renderer.dispose();
    };
  }, [layoutPreset]);

  /**
   * Studio lighting setup
   * ---------------------------------------------------------------------------
   * Soft directional + hemisphere lights to match the clean gallery HDRI.
   */
  const setupLighting = (scene) => {
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const main = new THREE.DirectionalLight(0xeaf0ff, 1.0);
    main.position.set(10, 20, 10);
    main.castShadow = true;
    main.shadow.mapSize.set(2048, 2048);
    scene.add(main);

    scene.add(new THREE.DirectionalLight(0xe3eaff, 0.4).position.set(-10, 15, -10));
    scene.add(new THREE.DirectionalLight(0xf8fbff, 0.7).position.set(0, 8, -12));
    scene.add(new THREE.DirectionalLight(0xe8edff, 0.3).position.set(0, 12, 12));
    scene.add(new THREE.HemisphereLight(0xf4f6fb, 0xdfe4ee, 0.4));
    scene.add(new THREE.PointLight(0xffffff, 0.6, 30).position.set(5, 8, 5));
    scene.add(new THREE.PointLight(0xffffff, 0.5, 30).position.set(-6, 7, -4));
  };

  /**
   * Load static GLB environment model
   */
  const loadGLBModel = (scene) => {
    new GLTFLoader().load('/models/white_round_exhibition_gallery.glb', (gltf) => {
      const model = gltf.scene;

      const enhanceMaterial = (mat) => {
        const mats = Array.isArray(mat) ? mat : [mat];
        mats.forEach((m) => {
          if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
            m.color?.set('#e4e9f3');
            m.metalness = 0.2;
            m.roughness = 0.32;
            m.envMapIntensity = 1.4;

            if (m.isMeshPhysicalMaterial) {
              m.clearcoat = 0.15;
              m.sheen = 0.18;
              m.sheenColor = new THREE.Color('#f7f9fc');
            }
          }
          if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
          m.envMap = scene.environment;
          m.needsUpdate = true;
        });
      };

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          enhanceMaterial(child.material);
        }
      });

      scene.add(model);
    });
  };

  /**
   * Load animated robot model + bind animation clips
   */
  const loadRobotModel = (scene, camera, P) => {
    new GLTFLoader().load('/models/futuristic_flying_animated_robot_-_low_poly.glb', (gltf) => {
      const robot = gltf.scene;

      // Scale robot based on bounding box
      const box = new THREE.Box3().setFromObject(robot);
      const size = new THREE.Vector3();
      box.getSize(size);
      const scale = size.y > 0 ? 1.3 / size.y : 1;
      robot.scale.setScalar(scale * (P.robotScale || 1));

      const group = new THREE.Group();
      group.add(robot);

      // Position robot relative to camera + preset offsets
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);

      const pos = camera.position.clone().add(forward.multiplyScalar(P.distance || 1.5));
      const right = new THREE.Vector3().crossVectors(camera.up, forward).normalize();

      pos.add(right.multiplyScalar(P.offsetX || 0));
      pos.y = camera.position.y + (P.offsetY || 0);

      group.position.copy(pos);
      group.lookAt(camera.position);

      // Animation
      if (gltf.animations?.length) {
        const mixer = new THREE.AnimationMixer(robot);
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        mixerRef.current = mixer;
      }

      scene.add(group);
      robotRef.current = group;
    });
  };

  return <div ref={mountRef} className="absolute inset-0" />;
};

export default WhiteStudioScene;
