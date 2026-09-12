/**
 * TacticalCourt3D.js - WAR ROOM 3D 🎾🎓
 * Pizarra táctica interactiva tridimensional con arrastre de jugadores por Raycasting,
 * cálculo geométrico de huecos (zonas de sombra) y consejos tácticos en tiempo real.
 */

window.TacticalCourt3D = {
    scene: null,
    camera: null,
    renderer: null,
    draggables: [],
    draggedPlayer: null,
    raycaster: null,
    mouse: null,
    plane: null,
    offset: null,
    intersection: null,
    zoneVisualizer: null,
    gapVisualizer: null,
    viewMode: '3d',
    cameraAngleX: 0,
    cameraAngleY: 0.6,
    isPanning: false,
    prevMousePos: { x: 0, y: 0 },
    container: null,
    animationId: null,
    resizeObserver: null,
    cleanupEvents: null,

    // Mallas de jugadores de fácil acceso
    p1: null, // Alejandro (Tú)
    p2: null, // Compañero
    p3: null, // Rival 1
    p4: null, // Rival 2

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.cleanupEvents) {
            this.cleanupEvents();
            this.cleanupEvents = null;
        }
        if (this.renderer) {
            try {
                this.renderer.dispose();
                if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                }
            } catch (e) {
                console.warn("TacticalCourt3D: error disposing renderer", e);
            }
            this.renderer = null;
        }
        this.scene = null;
        this.camera = null;
        this.draggables = [];
        this.draggedPlayer = null;
        this.p1 = null;
        this.p2 = null;
        this.p3 = null;
        this.p4 = null;
        this.zoneVisualizer = null;
        this.gapVisualizer = null;
    },

    init(containerId) {
        this.destroy();

        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.container.innerHTML = '';
        this.draggables = [];
        this.draggedPlayer = null;
        this.viewMode = '3d';
        this.cameraAngleX = 0;
        this.cameraAngleY = 0.6;
        this.isPanning = false;

        // 1. CREAR ESCENA, CÁMARA Y RENDERER
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a); // Fondo oscuro premium slate

        const initialWidth = this.container.clientWidth || 400;
        const initialHeight = this.container.clientHeight || 300;

        this.camera = new THREE.PerspectiveCamera(40, initialWidth / initialHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(initialWidth, initialHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Redimensionamiento responsivo para el simulador táctico completo
        const observer = new ResizeObserver(() => {
            if (this.container && this.container.clientWidth > 0 && this.container.clientHeight > 0 && this.renderer && this.camera) {
                this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            }
        });
        observer.observe(this.container);
        this.resizeObserver = observer;

        setTimeout(() => {
            if (this.container && this.container.clientWidth > 0 && this.container.clientHeight > 0 && this.renderer && this.camera) {
                this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            }
        }, 60);

        // 2. ENTORNO Y SUELO GRIS CLARO
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 3. LA PISTA DE PÁDEL (Azul oficial)
        const court = new THREE.Group();
        const turf = new THREE.Mesh(new THREE.PlaneGeometry(10, 20), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.75, metalness: 0.1 })); // Azul premium
        turf.rotation.x = -Math.PI / 2;
        turf.position.y = 0.01;
        turf.receiveShadow = true;
        court.add(turf);

        // Líneas de juego de la pista (blancas)
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const addLine = (w, h, x, z) => {
            const l = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lineMat);
            l.rotation.x = -Math.PI / 2;
            l.position.set(x, 0.02, z);
            court.add(l);
        };
        addLine(10, 0.08, 0, 10);      // Fondo A
        addLine(10, 0.08, 0, -10);     // Fondo B
        addLine(0.08, 20, 5, 0);       // Lateral derecho
        addLine(0.08, 20, -5, 0);      // Lateral izquierdo
        addLine(10, 0.08, 0, 6.95);    // Línea de saque A
        addLine(10, 0.08, 0, -6.95);   // Línea de saque B
        addLine(0.08, 13.9, 0, 0);     // Línea central de saque

        // Paredes de cristal (Glass walls) - MeshStandardMaterial transparente garantizado en todos los dispositivos
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.28,
            roughness: 0.1,
            metalness: 0.1
        });
        const addGlassWall = (w, h, x, z, ry = 0) => {
            const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), glassMat);
            g.position.set(x, h / 2, z);
            g.rotation.y = ry;
            court.add(g);
        };
        addGlassWall(10, 3, 0, 10.03);      // Cristal fondo A
        addGlassWall(10, 3, 0, -10.03);     // Cristal fondo B
        addGlassWall(4, 3, 5.03, 8, Math.PI / 2);  // Cristal lateral derecho A
        addGlassWall(4, 3, -5.03, 8, Math.PI / 2); // Cristal lateral izquierdo A
        addGlassWall(4, 3, 5.03, -8, Math.PI / 2); // Cristal lateral derecho B
        addGlassWall(4, 3, -5.03, -8, Math.PI / 2);// Cristal lateral izquierdo B

        // Rejas laterales (Mesh fences)
        const fenceMat = new THREE.MeshStandardMaterial({ color: 0x475569, wireframe: true, transparent: true, opacity: 0.35 });
        const addFence = (w, h, x, z) => {
            const f = new THREE.Mesh(new THREE.PlaneGeometry(w, h, Math.round(w * 2), Math.round(h * 2)), fenceMat);
            f.rotation.y = Math.PI / 2;
            f.position.set(x, h / 2, z);
            court.add(f);

            // Postes negros de estructura
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3, 0.12), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
            post.position.set(x, 1.5, z - w / 2);
            court.add(post);
        };
        addFence(12, 3, 5.04, 0);
        addFence(12, 3, -5.04, 0);

        // La Red (Net)
        const netGroup = new THREE.Group();
        const netMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.88, 20, 4), new THREE.MeshStandardMaterial({ color: 0x64748b, transparent: true, opacity: 0.5, wireframe: true }));
        netMesh.position.y = 0.44;
        const netTop = new THREE.Mesh(new THREE.BoxGeometry(10.05, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        netTop.position.y = 0.88;
        netGroup.add(netMesh, netTop);
        court.add(netGroup);

        this.scene.add(court);

        // 4. CREAR JUGADORES (Team A Amarillo, Team B Rojo)
        // Compatible con todas las versiones de Three.js (r128 a r170+)
        const createPlayerMesh = (color, name) => {
            const playerGroup = new THREE.Group();
            
            // Cuerpo principal cilíndrico / cápsula
            let bodyGeo;
            if (typeof THREE.CapsuleGeometry === 'function') {
                bodyGeo = new THREE.CapsuleGeometry(0.25, 0.7, 8, 16);
            } else {
                bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.7, 16);
            }
            const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.1 }));
            body.position.y = 0.6;
            body.castShadow = true;
            playerGroup.add(body);

            // Cabeza (Sphere)
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 }));
            head.position.y = 1.25;
            head.castShadow = true;
            playerGroup.add(head);

            // Pala (Racket)
            const racket = new THREE.Group();
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
            racket.add(handle);
            const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
            frame.rotation.x = Math.PI / 2;
            frame.position.y = 0.3;
            racket.add(frame);
            racket.position.set(0.4, 0.7, 0.1);
            racket.rotation.x = -Math.PI / 4;
            playerGroup.add(racket);

            // Caja de colisión invisible optimizada para Raycasting táctil y ratón
            const clickBox = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 2.0, 1.2),
                new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
            );
            clickBox.position.y = 0.9;
            playerGroup.add(clickBox);
            playerGroup.clickBox = clickBox;

            playerGroup.playerName = name;
            return playerGroup;
        };

        // Equipo A: Tú (Amarillo) y Compañero (Amarillo)
        this.p1 = createPlayerMesh(0xCCFF00, "Tú (Alejandro)");
        this.p1.position.set(-2, 0, 6.5);
        this.p2 = createPlayerMesh(0xCCFF00, "Tu Compañero");
        this.p2.position.set(2, 0, 6.5);

        // Equipo B: Rival 1 y Rival 2 (Rojos)
        this.p3 = createPlayerMesh(0xef4444, "Rival 1");
        this.p3.position.set(-2, 0, -3);
        this.p4 = createPlayerMesh(0xef4444, "Rival 2");
        this.p4.position.set(2, 0, -3);

        this.scene.add(this.p1, this.p2, this.p3, this.p4);
        this.draggables.push(this.p1, this.p2, this.p3, this.p4);

        // 5. VISUALIZADORES DE ZONAS TÁCTICAS (En el suelo de la pista)
        // Zona recomendada de ataque (Rojo)
        const zoneGeo = new THREE.RingGeometry(0.01, 1.4, 32);
        const zoneMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.0 });
        this.zoneVisualizer = new THREE.Mesh(zoneGeo, zoneMat);
        this.zoneVisualizer.rotation.x = -Math.PI / 2;
        this.zoneVisualizer.position.y = 0.025;
        this.scene.add(this.zoneVisualizer);

        // Zona desprotegida propia (Amarillo)
        const gapGeo = new THREE.RingGeometry(0.01, 1.2, 32);
        const gapMat = new THREE.MeshBasicMaterial({ color: 0xeab308, side: THREE.DoubleSide, transparent: true, opacity: 0.0 });
        this.gapVisualizer = new THREE.Mesh(gapGeo, gapMat);
        this.gapVisualizer.rotation.x = -Math.PI / 2;
        this.gapVisualizer.position.y = 0.025;
        this.scene.add(this.gapVisualizer);

        // 6. ILUMINACIÓN
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const sun = new THREE.DirectionalLight(0xffffff, 1.1);
        sun.position.set(15, 25, 10);
        sun.castShadow = true;
        this.scene.add(sun);

        // 7. INICIALIZAR RAYCASTER E INTERSECCIONES
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Plano Y=0 para el arrastre
        this.offset = new THREE.Vector3();
        this.intersection = new THREE.Vector3();

        // 8. CONFIGURAR EVENTOS DE INTERACCIÓN
        this.setupEvents();

        // 9. RENDER INITIAL FRAME & UPDATE ENGINE
        this.updateTacticalEngine();
        this.animate();
    },

    setupEvents() {
        const dom = this.renderer.domElement;
        dom.style.touchAction = 'none';
        dom.style.cursor = 'grab';

        const getCoords = (e) => {
            const rect = dom.getBoundingClientRect();
            const touch = (e.touches && e.touches.length > 0) ? e.touches[0] : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0] : null);
            const clientX = touch ? touch.clientX : e.clientX;
            const clientY = touch ? touch.clientY : e.clientY;
            return {
                x: ((clientX - rect.left) / (rect.width || 1)) * 2 - 1,
                y: -((clientY - rect.top) / (rect.height || 1)) * 2 + 1,
                rawX: clientX,
                rawY: clientY
            };
        };

        const onDown = (e) => {
            const coords = getCoords(e);
            this.mouse.set(coords.x, coords.y);
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Intersectar con los clickBoxes de los jugadores draggables
            const clickBoxes = this.draggables.map(d => d.clickBox).filter(Boolean);
            const intersects = this.raycaster.intersectObjects(clickBoxes, false);

            if (intersects.length > 0) {
                this.draggedPlayer = intersects[0].object.parent;
                if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
                    this.offset.copy(this.draggedPlayer.position).sub(this.intersection);
                }
                dom.style.cursor = 'grabbing';
            } else {
                this.isPanning = true;
                this.prevMousePos.x = coords.rawX;
                this.prevMousePos.y = coords.rawY;
                dom.style.cursor = 'move';
            }
        };

        const onMove = (e) => {
            if (this.draggedPlayer) {
                const coords = getCoords(e);
                this.mouse.set(coords.x, coords.y);
                this.raycaster.setFromCamera(this.mouse, this.camera);

                if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
                    const targetPos = this.intersection.clone().add(this.offset);
                    targetPos.x = Math.max(-4.8, Math.min(4.8, targetPos.x));
                    targetPos.z = Math.max(-9.8, Math.min(9.8, targetPos.z));
                    targetPos.y = 0;

                    this.draggedPlayer.position.copy(targetPos);
                    this.updateTacticalEngine();
                }
            } else if (this.isPanning && this.viewMode === '3d') {
                const coords = getCoords(e);
                const deltaX = coords.rawX - this.prevMousePos.x;
                const deltaY = coords.rawY - this.prevMousePos.y;

                this.cameraAngleX -= deltaX * 0.007;
                this.cameraAngleY = Math.max(0.15, Math.min(Math.PI / 2 - 0.08, this.cameraAngleY + deltaY * 0.007));

                this.prevMousePos.x = coords.rawX;
                this.prevMousePos.y = coords.rawY;
            }
        };

        const onUp = () => {
            this.draggedPlayer = null;
            this.isPanning = false;
            if (dom) dom.style.cursor = 'grab';
        };

        const onTouchStart = (e) => {
            if (e.cancelable) e.preventDefault();
            onDown(e);
        };

        const onTouchMove = (e) => {
            if (e.cancelable) e.preventDefault();
            onMove(e);
        };

        dom.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);

        dom.addEventListener('touchstart', onTouchStart, { passive: false });
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onUp, { passive: false });
        window.addEventListener('touchcancel', onUp, { passive: false });

        this.cleanupEvents = () => {
            dom.removeEventListener('mousedown', onDown);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            dom.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onUp);
            window.removeEventListener('touchcancel', onUp);
        };
    },

    changeCamera(mode) {
        this.viewMode = mode;
        const panelInfo = document.getElementById('tactical-camera-info');
        if (panelInfo) {
            panelInfo.innerText = mode === '3d' ? 'VISTA 3D ORBITAL' : 'PIZARRA 2D CENITAL';
        }
    },

    resetPlayers() {
        if (!this.p1 || !this.p2 || !this.p3 || !this.p4) return;
        this.p1.position.set(-2, 0, 6.5);
        this.p2.position.set(2, 0, 6.5);
        this.p3.position.set(-2, 0, -3);
        this.p4.position.set(2, 0, -3);
        this.cameraAngleX = 0;
        this.cameraAngleY = 0.6;
        this.updateTacticalEngine();
    },

    updateTacticalEngine() {
        if (!this.p1 || !this.p2 || !this.p3 || !this.p4) return;

        // Coordenadas de los jugadores
        const posP1 = this.p1.position; // Tú
        const posP2 = this.p2.position; // Compañero
        const posR1 = this.p3.position; // Rival 1
        const posR2 = this.p4.position; // Rival 2

        let tipTitle = "Posicionamiento Básico";
        let tipText = "Arrastra a los jugadores para simular situaciones de juego. Los círculos en la pista te indicarán las mejores opciones tácticas.";
        
        let zoneVisible = false;
        let gapVisible = false;

        // 1. ANÁLISIS DE NUESTRA DEFENSA (Brecha o Pasillo Central)
        const distPartner = Math.hypot(posP1.x - posP2.x, posP1.z - posP2.z);
        if (distPartner > 3.9) {
            gapVisible = true;
            if (this.gapVisualizer) {
                this.gapVisualizer.position.set((posP1.x + posP2.x) / 2, 0.025, (posP1.z + posP2.z) / 2);
                this.gapVisualizer.scale.setScalar(distPartner * 0.35);
                this.gapVisualizer.material.opacity = 0.45;
            }
            tipTitle = "⚠️ ¡Brecha en el Centro!";
            tipText = `Hay demasiada separación entre tu compañero y tú en la pista (${distPartner.toFixed(1)}m). El rival podrá definir fácilmente tirando una bola rápida al medio. Uno de los dos debe cerrar hacia el centro.`;
        } else {
            if (this.gapVisualizer) {
                this.gapVisualizer.material.opacity = 0.0;
            }
        }

        // 2. ANÁLISIS DE ATAQUE (Zonas de Sombra del Rival)
        const rival1AtNet = posR1.z > -4.5;
        const rival2AtNet = posR2.z > -4.5;

        if (distPartner <= 3.9) {
            if (rival1AtNet && rival2AtNet) {
                zoneVisible = true;
                if (this.zoneVisualizer) {
                    this.zoneVisualizer.position.set(0, 0.025, -7.8);
                    this.zoneVisualizer.scale.setScalar(1.5);
                    this.zoneVisualizer.material.opacity = 0.45;
                }
                tipTitle = "🎯 Rivales en la Red (Lanzar Globo)";
                tipText = "Tus oponentes han subido a la red y tienen la posición de ataque dominada. Juega un GLOBO alto y profundo hacia las esquinas para obligarles a retroceder y ganar vosotros la red.";
            } else if (!rival1AtNet && !rival2AtNet) {
                zoneVisible = true;
                if (posP1.z < 3 && posP2.z < 3) {
                    if (this.zoneVisualizer) {
                        this.zoneVisualizer.position.set(0, 0.025, -3.5);
                        this.zoneVisualizer.scale.setScalar(1.3);
                        this.zoneVisualizer.material.opacity = 0.45;
                    }
                    tipTitle = "🔥 Tenéis la Red (Volea al Centro)";
                    tipText = "Los rivales están defendiendo en el fondo y vosotros tenéis la red ganada. Presiona con una VOLEA baja al centro de la pista para provocar dudas en su comunicación.";
                } else {
                    if (this.zoneVisualizer) {
                        this.zoneVisualizer.position.set((posR1.x + posR2.x) / 2, 0.025, (posR1.z + posR2.z) / 2 + 1);
                        this.zoneVisualizer.scale.setScalar(1.0);
                        this.zoneVisualizer.material.opacity = 0.3;
                    }
                    tipTitle = "⚖️ Peloteo de Fondo";
                    tipText = "Todos los jugadores están al fondo de la pista. Mantén un peloteo cruzado seguro y sin prisa, esperando una bola cómoda para lanzar un globo profundo y subir a atacar.";
                }
            } else {
                zoneVisible = true;
                const backwardRival = posR1.z > posR2.z ? posR2 : posR1;
                if (this.zoneVisualizer) {
                    this.zoneVisualizer.position.set(backwardRival.x, 0.025, backwardRival.z + 1.5);
                    this.zoneVisualizer.scale.setScalar(1.2);
                    this.zoneVisualizer.material.opacity = 0.45;
                }
                tipTitle = "⚡ Rival Descompensado";
                tipText = "Hay un oponente en la red y otro al fondo. Ataca jugando en paralelo a la espalda del jugador de red o busca una bola profunda cruzada a la esquina del jugador retrasado.";
            }
        }

        if (!zoneVisible && this.zoneVisualizer) {
            this.zoneVisualizer.material.opacity = 0.0;
        }

        const coachTitleDom = document.getElementById('war-room-coach-title');
        const coachTextDom = document.getElementById('war-room-coach-text');
        
        if (coachTitleDom) coachTitleDom.innerText = tipTitle;
        if (coachTextDom) coachTextDom.innerHTML = tipText;
    },

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Actualizar cámara en modo 3D orbital
        if (this.viewMode === '3d' && this.camera) {
            const radius = 21;
            this.camera.position.x = radius * Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY);
            this.camera.position.z = radius * Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY);
            this.camera.position.y = radius * Math.sin(this.cameraAngleY);
            this.camera.lookAt(0, 0, 0);
        } else if (this.viewMode === '2d' && this.camera) {
            this.camera.position.set(0, 23, 0.001);
            this.camera.lookAt(0, 0, 0);
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    renderHTML() {
        return '';
    }
};
