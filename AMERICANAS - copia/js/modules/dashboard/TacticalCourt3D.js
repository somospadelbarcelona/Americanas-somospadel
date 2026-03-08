/**
 * TacticalCourt3D.js - COACH & MASTER EDITION 🎾🎓
 * Ultra-realistic Padel simulation with Mesh Fences, Pro Clothing, and Tactical Analysis pauses.
 */

window.TacticalCourt3D = {
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 1. SCENE SETUP
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // Sky Blue

        const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // 2. ENVIRONMENT (BARCELONA PADEL EL PRAT VIBE)
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0x999999 }));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Trees & Ambient Fans
        for (let i = 0; i < 30; i++) {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0x4d2600 }));
            const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshStandardMaterial({ color: 0x2d5a27 }));
            leaves.position.y = 3;
            tree.add(trunk, leaves);
            tree.position.set((Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 60);
            if (Math.abs(tree.position.x) > 8) scene.add(tree);
        }

        // 3. THE COURT (PRO SPECS)
        const court = new THREE.Group();
        const turf = new THREE.Mesh(new THREE.PlaneGeometry(10, 20), new THREE.MeshStandardMaterial({ color: 0x005cb8, roughness: 0.8 }));
        turf.rotation.x = -Math.PI / 2;
        turf.position.y = 0.01;
        turf.receiveShadow = true;
        court.add(turf);

        // Marks
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const mkL = (w, h, x, z) => {
            const l = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lineMat);
            l.rotation.x = -Math.PI / 2; l.position.set(x, 0.02, z); court.add(l);
        };
        mkL(10, 0.1, 0, 10); mkL(10, 0.1, 0, -10);
        mkL(0.1, 20, 5, 0); mkL(0.1, 20, -5, 0);
        mkL(10, 0.1, 0, 6.95); mkL(10, 0.1, 0, -6.95);
        mkL(0.08, 13.9, 0, 0);

        // GLASS WALLS
        const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, opacity: 0.3, transparent: true, thickness: 0.1, ior: 1.5 });
        const createWall = (w, h, x, z, ry = 0) => {
            const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), glassMat);
            g.position.set(x, h / 2, z); g.rotation.y = ry;
            court.add(g);
        };
        createWall(10, 3, 0, 10.04); createWall(10, 3, 0, -10.04);
        createWall(4, 3, 5.04, 8, Math.PI / 2); createWall(4, 3, -5.04, 8, Math.PI / 2);
        createWall(4, 3, 5.04, -8, Math.PI / 2); createWall(4, 3, -5.04, -8, Math.PI / 2);

        // --- NEW: SIDE MESH FENCING (REJAS) ---
        const meshMat = new THREE.MeshStandardMaterial({ color: 0x111111, wireframe: true, transparent: true, opacity: 0.4 });
        const createFence = (w, h, x, z) => {
            const f = new THREE.Mesh(new THREE.PlaneGeometry(w, h), meshMat);
            f.rotation.y = Math.PI / 2;
            f.position.set(x, h / 2, z);
            court.add(f);

            // Post for fence
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 0.15), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            p.position.set(x, 1.5, z - w / 2);
            court.add(p);
        }
        createFence(12, 3, 5.06, 0);
        createFence(12, 3, -5.06, 0);

        // THE NET
        const netGroup = new THREE.Group();
        const netMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.88), new THREE.MeshStandardMaterial({ color: 0x111111, transparent: true, opacity: 0.6, wireframe: true }));
        netMesh.position.y = 0.44;
        const netTop = new THREE.Mesh(new THREE.BoxGeometry(10.1, 0.08, 0.08), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        netTop.position.y = 0.88;
        netGroup.add(netMesh, netTop);
        court.add(netGroup);

        // CURVED LIGHT POLES (El Prat Style)
        const mkPole = (x, z, ry) => {
            const g = new THREE.Group();
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 0.2), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            post.position.y = 2.5;
            const arc = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.06, 16, 32, Math.PI), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            arc.position.set(-1.5, 5, 0); arc.rotation.z = -Math.PI / 2;
            g.add(post, arc); g.position.set(x, 0, z); g.rotation.y = ry; return g;
        };
        scene.add(mkPole(5.6, 6, 0), mkPole(5.6, -6, 0), mkPole(-5.6, 6, Math.PI), mkPole(-5.6, -6, Math.PI));

        scene.add(court);

        // 4. PRO PLAYERS (REAL CLOTHING & RACKETS)
        const createProPlayer = (shirtColor, brandIdx) => {
            const p = new THREE.Group();
            const model = new THREE.Group();

            // Shorts (Real Mesh)
            const shorts = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.3, 4, 8), new THREE.MeshStandardMaterial({ color: 0x222222 }));
            shorts.position.y = 0.4;
            model.add(shorts);

            // T-Shirt (Pro Fit)
            const shirt = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.6, 4, 8), new THREE.MeshStandardMaterial({ color: shirtColor }));
            shirt.position.y = 1.0;
            model.add(shirt);

            // Head & Cap
            const head = new THREE.Group();
            const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            cap.position.y = 0.1;
            head.add(skull, cap);
            head.position.y = 1.5;
            model.add(head);

            // Detailed Racket (Bullpadel/Head Style)
            const racket = new THREE.Group();
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3), new THREE.MeshStandardMaterial({ color: 0x0 }));
            racket.add(handle);

            const heart = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.05), new THREE.MeshStandardMaterial({ color: 0x333333 }));
            heart.position.y = 0.15;
            racket.add(heart);

            const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 32), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            frame.rotation.x = Math.PI / 2; frame.position.y = 0.35;
            const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), new THREE.MeshBasicMaterial({ color: brandIdx === 0 ? 0xff6600 : 0x00ffff, transparent: true, opacity: 0.8 }));
            logo.position.set(0, 0.35, 0.03);
            racket.add(frame, logo);

            racket.position.set(0.35, 1.2, 0.2);
            racket.rotation.x = -Math.PI / 4;
            model.add(racket);
            p.racket = racket;

            p.add(model);
            p.model = model;
            p.castShadow = true;
            return p;
        };

        const teamA = [createProPlayer(0xCCFF00, 0), createProPlayer(0xCCFF00, 1)];
        const teamB = [createProPlayer(0xFF3333, 0), createProPlayer(0xFF3333, 1)];
        scene.add(...teamA, ...teamB);

        // BALL
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0xCCFF00, emissive: 0xCCFF00 }));
        ball.castShadow = true;
        scene.add(ball);

        // 5. MATCH & COACH ENGINE
        let match = {
            t: 0,
            duration: 1.2,
            attacker: teamA[0], defender: teamB[0],
            start: new THREE.Vector3(0, 5, 8),
            bounce: new THREE.Vector3(2, 0, -4),
            end: new THREE.Vector3(2, 1, -8),
            shot: "SAQUE",
            isPaused: false,
            coachTips: [
                { type: "SAQUE", text: "Saque profundo hacia el cristal para forzar el error del rival." },
                { type: "BANDEJA", text: "Bandeja: Mantén la posición de red sin arriesgar, buscando profundidad." },
                { type: "VOLEA", text: "Volea: Ataca la reja lateral para que el rebote sea impredecible." },
                { type: "REMATE", text: "Remate X3: Golpea la bola en su punto más alto para sacarla por el lateral." }
            ]
        };

        const showCoachTip = (type) => {
            const tip = match.coachTips.find(t => t.type === type) || match.coachTips[0];
            const overlay = document.getElementById('coach-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                overlay.querySelector('#coach-title').innerText = `💡 TÁCTICA: ${type}`;
                overlay.querySelector('#coach-text').innerText = tip.text;
                match.isPaused = true;
                setTimeout(() => {
                    overlay.style.display = 'none';
                    match.isPaused = false;
                }, 4000);
            }
        };

        const nextStroke = () => {
            const isA = teamA.includes(match.attacker);
            match.start.copy(ball.position);

            const rnd = Math.random();
            if (rnd > 0.8) {
                match.shot = "REMATE";
                match.bounce.set((Math.random() - 0.5) * 4, 0, isA ? -2 : 2);
                match.end.set((Math.random() - 0.5) * 10, 6, isA ? -8 : 8);
                showCoachTip("REMATE");
            } else if (rnd > 0.6) {
                match.shot = "BANDEJA";
                match.bounce.set((Math.random() - 0.5) * 8, 0, isA ? -7 : 7);
                match.end.copy(match.bounce).add(new THREE.Vector3(0, 1.2, isA ? -3 : 3));
                if (Math.random() < 0.3) showCoachTip("BANDEJA");
            } else {
                match.shot = "VOLEA";
                match.bounce.set((Math.random() > 0.5 ? 4.8 : -4.8), 0, isA ? -4 : 4);
                match.end.copy(match.bounce).add(new THREE.Vector3(0, 1.2, isA ? -2 : 2));
                if (Math.random() < 0.2) showCoachTip("VOLEA");
            }

            match.defender = isA ? teamB[Math.floor(Math.random() * 2)] : teamA[Math.floor(Math.random() * 2)];
            match.t = 0;
            match.duration = match.shot === "REMATE" ? 0.6 : 1.2;
        };

        // 6. LIGHTING & RENDER
        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(20, 30, 10); sun.castShadow = true;
        scene.add(sun);

        const animate = () => {
            requestAnimationFrame(animate);
            if (match.isPaused) return renderer.render(scene, camera);

            match.t += 0.016;
            const p = Math.min(match.t / match.duration, 1);

            // Ball Physics
            if (p < 0.5) {
                const a = p * 2;
                ball.position.lerpVectors(match.start, match.bounce, a);
                ball.position.y += Math.sin(a * Math.PI) * (match.shot === "REMATE" ? 1.5 : 3);
            } else {
                const a = (p - 0.5) * 2;
                ball.position.lerpVectors(match.bounce, match.end, a);
                ball.position.y += Math.sin(a * Math.PI) * 1.5;
            }

            if (p >= 1) {
                match.attacker = match.defender;
                nextStroke();
            }

            // PRO MOVEMENTS (Split Step & Rotation)
            [...teamA, ...teamB].forEach(plr => {
                const isDef = (plr === match.defender);
                if (isDef) {
                    plr.position.lerp(new THREE.Vector3(match.end.x, 0, match.end.z), 0.15);
                    plr.model.position.y = Math.abs(Math.sin(match.t * 18)) * 0.12;
                    if (p > 0.8) {
                        plr.racket.rotation.x = -Math.PI + Math.sin(match.t * 20) * 1.5;
                        plr.rotation.y = Math.atan2(ball.position.x - plr.position.x, ball.position.z - plr.position.z);
                    }
                } else {
                    const targetZ = teamA.includes(plr) ? 7 : -7;
                    const targetX = (plr === teamA[0] || plr === teamB[0]) ? -2.5 : 2.5;
                    plr.position.lerp(new THREE.Vector3(targetX, 0, targetZ), 0.05);
                }
            });

            // Camera Cinematic
            const time = Date.now() * 0.0003;
            camera.position.set(Math.sin(time) * 20, 12, Math.cos(time) * 18);
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        nextStroke();
        animate();
    },

    renderHTML() {
        return `
            <div class="glass-card-enterprise" style="padding: 0; background: #000; border-radius: 28px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); position: relative; box-shadow: 0 40px 100px rgba(0,0,0,0.8);">
                <!-- COACH OVERLAY -->
                <div id="coach-overlay" style="position: absolute; inset: 0; z-index: 100; background: rgba(0,0,0,0.8); display: none; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center; backdrop-filter: blur(10px);">
                    <div style="background: #CCFF00; color: #000; padding: 4px 12px; border-radius: 4px; font-weight: 900; font-size: 0.7rem; margin-bottom: 15px;">COACH MODE</div>
                    <h3 id="coach-title" style="color: white; font-size: 1.5rem; font-weight: 950; margin: 0 0 10px 0;"></h3>
                    <p id="coach-text" style="color: rgba(255,255,255,0.8); font-size: 1rem; line-height: 1.5; max-width: 80%; font-weight: 500;"></p>
                    <div style="margin-top: 20px; font-size: 0.7rem; color: #CCFF00; font-weight: 900; letter-spacing: 2px;">REANUDANDO EN 3s...</div>
                </div>

                <div style="position: absolute; top: 20px; left: 25px; z-index: 10;">
                    <div style="font-size: 0.6rem; font-weight: 950; color: #CCFF00; letter-spacing: 2px;">LIVE SIMULATION</div>
                    <div style="font-size: 1rem; color: white; font-weight: 900;">BARCELONA PADEL EL PRAT</div>
                </div>

                <div id="tactical-court-canvas" style="width: 100%; height: 500px;"></div>

                <div style="position: absolute; bottom: 25px; width: 100%; display: flex; justify-content: center; z-index: 5; pointer-events: none;">
                    <div style="background: rgba(0,0,0,0.7); backdrop-filter: blur(15px); padding: 10px 40px; border-radius: 60px; display: flex; gap: 20px; align-items: center; border: 1px solid rgba(255,255,255,0.2);">
                        <div style="color: #00E36D; font-size: 0.65rem; font-weight: 900;"><i class="fas fa-chalkboard-teacher"></i> COACH ANALYSIS ACTIVE</div>
                    </div>
                </div>
            </div>
        `;
    }
};
