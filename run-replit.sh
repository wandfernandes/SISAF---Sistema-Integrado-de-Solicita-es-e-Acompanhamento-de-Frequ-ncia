#!/bin/bash

# Script simples para iniciar o servidor bridge no ambiente Replit
# Este script é usado no workflow do Replit

echo "=== Iniciando servidor SISAF em modo Replit ==="
echo "Data e hora: $(date)"

# Executar o servidor bridge em CommonJS para evitar problemas de ESM
node server-bridge.cjs