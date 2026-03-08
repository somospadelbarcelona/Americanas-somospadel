/**
 * Tactical3DWidget.js
 * Advanced WebGL 3D Visualization for Player Tactics and Stats.
 * Deepmind AI Prototyping Engine.
 */

window.Tactical3DWidget = {
    init(containerId, stats = { power: 85, control: 70, speed: 90, stamina: 75, technique: 88 }) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 1. SCENE SETUP
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.innerHTML = ''; // Clear container
        container.appendChild(renderer.domElement);

        // 2. TACTICAL SPHERE (Wireframe + Glow)
        const geometry = new THREE.IcosahedronGeometry(2, 2);
        const material = new THREE.MeshPhongMaterial({
            color: 0xCCFF00,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            emissive: 0xCCFF00,
            emissiveIntensity: 0.5
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // 3. INTERNAL DATA CORE (Pulsing solid)
        const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
        const coreMat = new THREE.MeshPhongMaterial({
            color: 0xCCFF00,
            transparent: true,
            opacity: 0.6,
            shininess: 100
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        scene.add(core);

        // 4. LIGHTING
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xCCFF00, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        camera.position.z = 5;

        // 5. ANIMATION LOOP
        let frame = 0;
        const animate = () => {
            requestAnimationFrame(animate);
            frame += 0.01;

            sphere.rotation.y += 0.005;
            sphere.rotation.x += 0.002;

            core.rotation.y -= 0.008;
            core.scale.setScalar(1 + Math.sin(frame * 2) * 0.05);

            renderer.render(scene, camera);
        };

        animate();

        // Handle Resize
        const resizeObserver = new ResizeObserver(() => {
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            }
        });
        resizeObserver.observe(container);
    },

    renderHTML() {
        return `
            <div class="glass-card-enterprise animate-fade-in" style="padding: 20px; position: relative; overflow: hidden; min-height: 250px; background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 0.65rem; font-weight: 800; color: #CCFF00; letter-spacing: 2px; text-transform: uppercase;">
                            AI Tactical Analysis
                        </div>
                        <div style="font-size: 1.1rem; font-weight: 900; color: white; margin-top: 4px;">
                            NEURAL SPHERE <span style="font-weight: 300; opacity: 0.5;">V1.0</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="background: rgba(204, 255, 0, 0.1); color: #CCFF00; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; border: 1px solid rgba(204, 255, 0, 0.2);">LIVE TELEMETRY</span>
                    </div>
                </div>

                <div id="three-tactical-canvas" style="width: 100%; height: 180px; position: relative; cursor: grab;">
                    <!-- WebGL Canvas here -->
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.55rem; color: rgba(255,255,255,0.4); font-weight: 800; text-transform: uppercase;">Précisión</div>
                        <div style="font-size: 0.9rem; font-weight: 900; color: white;">92%</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.55rem; color: rgba(255,255,255,0.4); font-weight: 800; text-transform: uppercase;">Agresión</div>
                        <div style="font-size: 0.9rem; font-weight: 900; color: #FF2D55;">ALTA</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.55rem; color: rgba(255,255,255,0.4); font-weight: 800; text-transform: uppercase;">Consistencia</div>
                        <div style="font-size: 0.9rem; font-weight: 900; color: #CCFF00;">8.4</div>
                    </div>
                </div>

                <!-- OVERLAY SCAN LINES -->
                <div style="position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(204, 255, 0, 0.03) 0px, transparent 1px, transparent 4px); opacity: 0.5;"></div>
            </div>
        `;
    }
};
