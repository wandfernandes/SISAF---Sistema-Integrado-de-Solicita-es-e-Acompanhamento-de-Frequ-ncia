/**
 * Script para atualizar a configuração do workflow do Replit
 * Configurando para usar a porta 3000 em vez da porta 5000
 */

// No Replit, o arquivo .replit controla o comportamento do botão "Run"
// Nós precisamos modificar este arquivo para escutar a porta 3000 em vez da porta 5000
// Contudo, como não podemos modificar diretamente o arquivo .replit, usaremos um ambiente especial

console.log("SISAF Configuração de Porta");
console.log("===========================");
console.log("Informações para o ambiente Replit:");
console.log("1. O servidor SISAF está configurado para escutar na porta 3000");
console.log("2. Para acessar a aplicação, use a URL:");
console.log(`   https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
console.log("3. Para teste local, acesse: http://localhost:3000");
console.log("===========================");
console.log("Uso do ambiente Replit:");
console.log("- O botão 'Run' na interface do Replit iniciará a aplicação");
console.log("- Os logs do servidor estarão visíveis no console");
console.log("===========================");

// Exibir o URL completo para acesso quando no ambiente Replit
if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
  console.log(`✅ URL Replit completa: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
} else {
  console.log("❌ Ambiente Replit não detectado");
}