/**
 * DatabaseService.js (Global Version)
 * Wrapper para Firestore global.
 */
(function () {
    const db = window.firebase ? firebase.firestore() : null;

    class DatabaseService {
        constructor(collectionName) {
            this.collectionName = collectionName;
            this.collection = db ? db.collection(collectionName) : null;
        }

        async getAll() {
            if (!this.collection) return [];
            const snapshot = await this.collection.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        async getById(id) {
            if (!this.collection) return null;
            const doc = await this.collection.doc(id).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        }

        async create(data) {
            if (!this.collection) return { id: 'offline-' + Date.now(), ...data };
            const docRef = await this.collection.add({
                ...data,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: docRef.id, ...data };
        }

        async update(id, data) {
            if (!this.collection) return { id, ...data };
            await this.collection.doc(id).update(data);
            return { id, ...data };
        }

        async delete(id) {
            if (!this.collection) return;
            await this.collection.doc(id).delete();
        }
    }

    // Factory method exposed globally
    window.createService = (collectionName) => new DatabaseService(collectionName);
    console.log("💾 DatabaseService Global Loaded");
})();
