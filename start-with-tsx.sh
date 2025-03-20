#!/bin/bash

# Script para iniciar o servidor usando tsx (compatível com ESM e TypeScript)
echo "Iniciando servidor SISAF usando tsx..."
echo "Diretório atual: $(pwd)"
echo "Arquivos no diretório server:"
ls -la server/

# Usar tsx para compilar e executar TypeScript diretamente
NODE_OPTIONS="--experimental-specifier-resolution=node" npx tsx --trace-warnings server/index.ts