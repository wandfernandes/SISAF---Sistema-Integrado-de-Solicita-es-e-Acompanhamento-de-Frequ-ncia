import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// Configuração do Firebase - Atualizando para usar variáveis de ambiente
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCI-WHNUlUbop5scod51-rzAm0wNx5Ziq4",
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "sisaf-replit"}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sisaf-replit",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sisaf-replit.appspot.com",
    messagingSenderId: "699955257006",
    appId: "1:699955257006:web:2f9cacb5fdb2bfddf6973f"
};
// Inicializar o Firebase
console.log("Firebase: Inicializando aplicação Firebase com configuração:", {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 8)}...` : 'Não definido',
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    appId: firebaseConfig.appId && firebaseConfig.appId.substring(0, 10) + "...",
});
const app = initializeApp(firebaseConfig);
console.log("Firebase: Aplicação inicializada com sucesso");
// Inicializar o Storage e exportar
console.log("Firebase: Inicializando storage...");
export const storage = getStorage(app);
console.log("Firebase: Storage inicializado com sucesso");
// Verificar se o storage foi inicializado corretamente
if (storage) {
    console.log("Firebase: Storage está pronto para uso");
    console.log("Firebase: Bucket configurado:", storage.app.options.storageBucket);
}
else {
    console.error("Erro: Firebase Storage não foi inicializado corretamente");
}
//# sourceMappingURL=firebase.js.map