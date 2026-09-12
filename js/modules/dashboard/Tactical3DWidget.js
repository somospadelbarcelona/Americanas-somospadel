/**
 * Tactical3DWidget.js
 * Widget de previsualización en 3D animado de la pizarra táctica (War Room 3D) en el Dashboard.
 */

window.Tactical3DWidget = {
    scene: null,
    camera: null,
    renderer: null,
    courtGroup: null,
    container: null,
    animationId: null,
    resizeObserver: null,

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.renderer) {
            try {
                this.renderer.dispose();
                if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                }
            } catch (e) {}
            this.renderer = null;
        }
        this.scene = null;
        this.camera = null;
        this.courtGroup = null;
    },

    init(containerId) {
        this.destroy();

        this.container = document.getElementById(containerId);
        if (!this.container) return;

        // Limpiar contenedor
        this.container.innerHTML = '';

        const width = this.container.clientWidth || 300;
        const height = this.container.clientHeight || 140;

        // 1. SCENE SETUP
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a); // Fondo oscuro slate

        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.container.appendChild(this.renderer.domElement);

        // 2. CREAR MINI PISTA
        this.courtGroup = new THREE.Group();
        
        // Césped azul
        const turf = new THREE.Mesh(new THREE.PlaneGeometry(6, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 }));
        turf.rotation.x = -Math.PI / 2;
        this.courtGroup.add(turf);

        // Líneas rápidas
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const addL = (w, h, x, z) => {
            const l = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lineMat);
            l.rotation.x = -Math.PI / 2;
            l.position.set(x, 0.01, z);
            this.courtGroup.add(l);
        };
        addL(6, 0.05, 0, 6);
        addL(6, 0.05, 0, -6);
        addL(0.05, 12, 3, 0);
        addL(0.05, 12, -3, 0);
        addL(6, 0.05, 0, 4.1);
        addL(6, 0.05, 0, -4.1);
        addL(0.05, 8.2, 0, 0);

        // Red
        const net = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, wireframe: true }));
        net.position.y = 0.3;
        this.courtGroup.add(net);

        // Mini Jugadores (Esferas sencillas de colores para el preview animado)
        const addMiniPlayer = (color, x, z) => {
            const g = new THREE.Group();
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4), new THREE.MeshStandardMaterial({ color: color }));
            body.position.y = 0.2;
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
            head.position.y = 0.45;
            g.add(body, head);
            g.position.set(x, 0, z);
            this.courtGroup.add(g);
        };
        addMiniPlayer(0xCCFF00, -1.2, 4); // Nosotros
        addMiniPlayer(0xCCFF00, 1.2, 4);  // Compañero
        addMiniPlayer(0xef4444, -1.2, -2); // Rival 1
        addMiniPlayer(0xef4444, 1.2, -2);  // Rival 2

        this.scene.add(this.courtGroup);

        // ILUMINACIÓN
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(5, 10, 5);
        this.scene.add(light);

        // Posición de la cámara
        this.camera.position.set(0, 7, 8);
        this.camera.lookAt(0, 0, 0);

        // 3. BUCLE DE ROTACIÓN AUTOMÁTICA
        let angle = 0;
        const animate = () => {
            if (!this.renderer) return;
            this.animationId = requestAnimationFrame(animate);
            angle += 0.006;
            
            // Órbita lenta
            this.camera.position.x = 8.5 * Math.sin(angle);
            this.camera.position.z = 8.5 * Math.cos(angle);
            this.camera.lookAt(0, 0.3, 0);

            this.renderer.render(this.scene, this.camera);
        };
        animate();

        // Redimensionamiento responsivo
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
    },

    renderHTML() {
        return `
            <div class="glass-card-enterprise animate-fade-in" style="
                margin: 0 15px 12px !important;
                padding: 20px;
                position: relative;
                overflow: hidden;
                min-height: 270px;
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 28px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                cursor: pointer;
            " onclick="window.DashboardView.openTacticalWarRoom()">
                
                <!-- Fondo cuadriculado táctico -->
                <div style="position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(204, 255, 0, 0.02) 0px, transparent 1px, transparent 4px); opacity: 0.5;"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 0.6rem; font-weight: 1000; color: #CCFF00; letter-spacing: 2px; text-transform: uppercase;">
                            Pizarra de Estrategia
                        </div>
                        <div style="font-size: 1.15rem; font-weight: 950; color: white; margin-top: 4px; font-family: 'Outfit';">
                            WAR ROOM 3D INTERACTIVO
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="background: rgba(204, 255, 0, 0.12); color: #CCFF00; padding: 4px 10px; border-radius: 8px; font-size: 0.58rem; font-weight: 950; border: 1px solid rgba(204, 255, 0, 0.25);">PROBA LA PIZARRA</span>
                    </div>
                </div>

                <!-- Canvas de Three.js en miniatura -->
                <div id="three-tactical-canvas" style="width: 100%; height: 140px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); background: #090f1e; pointer-events: none;">
                    <!-- Canvas de Three.js cargado vía JS -->
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;">
                    <span style="font-size: 0.68rem; color: rgba(255,255,255,0.5); font-weight: 600; max-width: 60%; line-height: 1.2;">
                        Arrastra a tus jugadores, calcula huecos y visualiza tácticas de ataque y defensa.
                    </span>
                    <button style="
                        background: #CCFF00;
                        color: #000000;
                        border: none;
                        outline: none;
                        padding: 8px 16px;
                        border-radius: 12px;
                        font-size: 0.68rem;
                        font-weight: 950;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        box-shadow: 0 4px 10px rgba(204, 255, 0, 0.3);
                        transition: transform 0.2s;
                        font-family: 'Outfit';
                    ">
                        DISEÑAR TÁCTICA <i class="fas fa-play" style="font-size: 0.6rem;"></i>
                    </button>
                </div>
            </div>
        `;
    }
};
