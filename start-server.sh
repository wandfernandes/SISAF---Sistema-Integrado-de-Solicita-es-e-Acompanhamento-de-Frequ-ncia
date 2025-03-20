#!/bin/bash

echo "Iniciando servidor SISAF..."
echo "Ambiente: ${NODE_ENV:-development}"

# Use tsx para executar TypeScript diretamente
NODE_ENV=development exec npx tsx server/server-start.ts