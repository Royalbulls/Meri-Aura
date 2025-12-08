export const securityService = {
    // 1. Generate Key from Password (PBKDF2)
    deriveKey: async (password: string, salt: Uint8Array) => {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
        );
        return window.crypto.subtle.deriveKey(
            { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    },

    // 2. Encrypt Data
    encrypt: async (data: string, password: string) => {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await securityService.deriveKey(password, salt);
        const enc = new TextEncoder();
        const encrypted = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv }, key, enc.encode(data)
        );

        // Pack everything into a buffer: Salt + IV + Data
        const buffer = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
        buffer.set(salt, 0);
        buffer.set(iv, salt.byteLength);
        buffer.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);
        
        // Convert to Base64 for file storage
        let binary = '';
        for (let i = 0; i < buffer.byteLength; i++) binary += String.fromCharCode(buffer[i]);
        return btoa(binary);
    },

    // 3. Decrypt Data
    decrypt: async (base64Data: string, password: string) => {
        try {
            const binary = atob(base64Data);
            const buffer = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);

            const salt = buffer.slice(0, 16);
            const iv = buffer.slice(16, 28);
            const data = buffer.slice(28);

            const key = await securityService.deriveKey(password, salt);
            const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv }, key, data
            );

            const dec = new TextDecoder();
            return dec.decode(decrypted);
        } catch (e) {
            console.error("Decryption failed:", e);
            throw new Error("Invalid Password or Corrupted File");
        }
    }
};