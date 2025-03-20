import { useState, useEffect } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/nav/sidebar";
import { Loader2, CheckCircle2, XCircle, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
export default function FirebaseTest() {
    const [testing, setTesting] = useState(false);
    const [logs, setLogs] = useState([]);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [diagnosisDetails, setDiagnosisDetails] = useState(null);
    const { toast } = useToast();
    // Função para adicionar log com timestamp
    const addLog = (message) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`); // Log no console também
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };
    // Executar verificação inicial da configuração ao carregar a página
    useEffect(() => {
        addLog("Carregando página de diagnóstico...");
        addLog(`Verificando configuração do Firebase Storage`);
        try {
            // Verificar se o storage está inicializado
            if (storage) {
                const bucket = storage.app.options.storageBucket;
                addLog(`Firebase Storage parece configurado. Bucket: ${bucket || "Não definido"}`);
                if (!bucket) {
                    setDiagnosisDetails("O bucket do Firebase Storage não está configurado. Verifique as variáveis de ambiente.");
                }
            }
            else {
                addLog("ERRO: Firebase Storage não foi inicializado corretamente");
                setDiagnosisDetails("Firebase Storage não foi inicializado corretamente. Verifique a configuração do Firebase.");
            }
            // Verificar variáveis de ambiente (apenas nomes, não valores)
            addLog("Verificando variáveis de ambiente do Firebase:");
            const apiKeyExists = !!import.meta.env.VITE_FIREBASE_API_KEY;
            const projectIdExists = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
            const storageBucketExists = !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
            addLog(`VITE_FIREBASE_API_KEY: ${apiKeyExists ? "Presente" : "Ausente"}`);
            addLog(`VITE_FIREBASE_PROJECT_ID: ${projectIdExists ? "Presente" : "Ausente"}`);
            addLog(`VITE_FIREBASE_STORAGE_BUCKET: ${storageBucketExists ? "Presente" : "Ausente"}`);
            if (!apiKeyExists || !projectIdExists || !storageBucketExists) {
                setDiagnosisDetails("Uma ou mais variáveis de ambiente do Firebase estão faltando.");
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
            addLog(`ERRO durante verificação inicial: ${errorMessage}`);
            setDiagnosisDetails(`Erro ao verificar configuração: ${errorMessage}`);
        }
    }, []);
    // Função para executar diagnóstico completo
    const runDiagnostics = async () => {
        setTesting(true);
        setSuccess(false);
        setError(null);
        setFileUrl(null);
        setDiagnosisDetails(null);
        // Manter logs anteriores, mas adicionar separador
        addLog("-----------------------------------");
        addLog("Iniciando novo teste de diagnóstico");
        try {
            // Verificando configuração do Firebase
            addLog("Verificando configuração do Firebase Storage...");
            addLog(`Bucket configurado: ${storage.app.options.storageBucket || "Não definido"}`);
            if (!storage.app.options.storageBucket) {
                throw new Error("Bucket de storage não configurado no Firebase");
            }
            // Criar um arquivo de texto simples em memória (muito pequeno)
            addLog("Criando arquivo de teste simples (pequeno)...");
            const testContent = "Teste" + Date.now();
            const testBlob = new Blob([testContent], { type: "text/plain" });
            // Gerar um nome de arquivo único para o teste
            const testFilePath = `test-minimal-${Date.now()}.txt`;
            addLog(`Caminho do arquivo de teste: ${testFilePath}`);
            // Criar referência ao arquivo no storage
            const fileRef = ref(storage, testFilePath);
            addLog("Referência do arquivo criada");
            // Tentar fazer upload do arquivo
            addLog("Iniciando upload... (isso pode levar alguns segundos)");
            const startTime = Date.now();
            addLog(`[${startTime}] Chamando uploadBytes...`);
            try {
                const uploadResult = await uploadBytes(fileRef, testBlob);
                const uploadTime = Date.now();
                addLog(`[${uploadTime}] Upload concluído em ${uploadTime - startTime}ms`);
                // Tentar obter a URL do arquivo
                addLog(`[${uploadTime}] Obtendo URL de download...`);
                try {
                    const url = await getDownloadURL(uploadResult.ref);
                    const downloadTime = Date.now();
                    addLog(`[${downloadTime}] URL obtida em ${downloadTime - uploadTime}ms`);
                    addLog(`URL: ${url.substring(0, 50)}...`);
                    // Sucesso!
                    setSuccess(true);
                    setFileUrl(url);
                    setDiagnosisDetails("Teste completado com SUCESSO! O Firebase Storage está funcionando corretamente.");
                    toast({
                        title: "Diagnóstico concluído com sucesso",
                        description: "O Firebase Storage está funcionando corretamente!",
                    });
                }
                catch (downloadErr) {
                    const errorMessage = downloadErr instanceof Error ? downloadErr.message : "Erro desconhecido";
                    addLog(`ERRO ao obter URL: ${errorMessage}`);
                    setError(`Erro ao obter URL: ${errorMessage}`);
                    setDiagnosisDetails("O upload funcionou, mas houve um erro ao obter a URL. Isso pode indicar problemas com as regras de segurança do Firebase Storage para leitura (get).");
                    throw new Error(`Erro ao obter URL do arquivo: ${errorMessage}`);
                }
            }
            catch (uploadErr) {
                const errorMessage = uploadErr instanceof Error ? uploadErr.message : "Erro desconhecido";
                addLog(`ERRO durante upload: ${errorMessage}`);
                setError(`Erro durante upload: ${errorMessage}`);
                // Diagnóstico específico com base no erro
                if (errorMessage.includes("permission-denied")) {
                    setDiagnosisDetails("ERRO DE PERMISSÃO: As regras de segurança do Firebase Storage estão bloqueando o upload. Acesse o console do Firebase e configure as regras para permitir uploads.");
                }
                else if (errorMessage.includes("quota-exceeded")) {
                    setDiagnosisDetails("ERRO DE COTA: A cota do Firebase Storage foi excedida.");
                }
                else if (errorMessage.includes("network")) {
                    setDiagnosisDetails("ERRO DE REDE: Problemas de conectividade com o Firebase Storage. Verifique sua conexão ou se há algum bloqueio de rede.");
                }
                else if (errorMessage.includes("retry-limit-exceeded")) {
                    setDiagnosisDetails("ERRO DE LIMITE DE TENTATIVAS: O upload falhou após várias tentativas. Isso pode indicar instabilidade na rede ou problemas com as regras de segurança.");
                }
                else {
                    setDiagnosisDetails(`Erro não categorizado: ${errorMessage}`);
                }
                throw uploadErr;
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
            addLog(`Teste falhou: ${errorMessage}`);
            if (!error) {
                setError(errorMessage);
            }
            toast({
                title: "Erro no diagnóstico",
                description: errorMessage,
                variant: "destructive"
            });
        }
        finally {
            setTesting(false);
        }
    };
    return (<div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Diagnóstico do Firebase Storage</h1>

          <div className="grid gap-6">
            {diagnosisDetails && (<Card className={success ? "border-green-500" : error ? "border-red-500" : "border-yellow-500"}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    {success ? (<><CheckCircle2 className="text-green-500"/> Diagnóstico</>) : error ? (<><XCircle className="text-red-500"/> Problema Detectado</>) : (<><AlertTriangle className="text-yellow-500"/> Atenção</>)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{diagnosisDetails}</p>
                </CardContent>
              </Card>)}

            <Card>
              <CardHeader>
                <CardTitle>Teste de Upload</CardTitle>
                <CardDescription>
                  Este teste irá verificar se o Firebase Storage está configurado corretamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={runDiagnostics} disabled={testing} className="w-full" size="lg">
                  {testing ? (<>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                      Testando...
                    </>) : ("Iniciar teste de diagnóstico")}
                </Button>

                {success && (<div className="flex items-center gap-2 text-green-600 mt-4">
                    <CheckCircle2 className="h-5 w-5"/>
                    <span className="font-medium">Firebase Storage funcionando!</span>
                  </div>)}

                {error && (<div className="flex items-center gap-2 text-red-600 mt-4">
                    <XCircle className="h-5 w-5"/>
                    <span className="font-medium">Erro: {error}</span>
                  </div>)}
              </CardContent>
              {fileUrl && (<CardFooter>
                  <Button variant="outline" size="sm" asChild className="gap-1 text-primary">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4"/>
                      Ver arquivo de teste
                    </a>
                  </Button>
                </CardFooter>)}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logs do teste</CardTitle>
                <CardDescription>
                  Detalhes técnicos do processo de diagnóstico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-white p-4 rounded-md font-mono text-sm h-[300px] overflow-y-auto">
                  {logs.length === 0 ? (<div className="text-gray-400">Execute o teste para ver os logs</div>) : (logs.map((log, index) => <div key={index}>{log}</div>))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instruções para solução</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Se o teste falhar com erro de permissão:</h3>
                  <ol className="list-decimal list-inside ml-4 text-muted-foreground space-y-1">
                    <li>Acesse o console do Firebase (https://console.firebase.google.com/)</li>
                    <li>Navegue até seu projeto e selecione "Storage" no menu lateral</li>
                    <li>Clique na aba "Regras"</li>
                    <li>Temporariamente, para teste, defina as regras como:</li>
                    <pre className="bg-muted p-2 my-2 rounded-md text-sm overflow-x-auto">
                      {`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write;
    }
  }
}`}
                    </pre>
                    <li>Clique em "Publicar" e execute o teste novamente</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Se o teste falhar com erro de rede:</h3>
                  <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                    <li>Verifique se o Replit tem conexão com a internet</li>
                    <li>Verifique se o Firebase não está bloqueado na sua rede</li>
                    <li>Tente novamente mais tarde, pois pode ser um problema temporário</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Se o teste falhar com erro de configuração:</h3>
                  <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                    <li>Verifique se as variáveis de ambiente do Firebase estão configuradas corretamente</li>
                    <li>Confirme se o storageBucket no arquivo firebase.ts corresponde ao bucket no console do Firebase</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=firebase-test.jsx.map