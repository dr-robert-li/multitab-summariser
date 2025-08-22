#!/bin/bash

# Multi-Tab Summarizer - Ollama Helper Script
# This script helps start Ollama with the correct CORS configuration

# Check if extension ID is provided as argument
if [ "$1" ]; then
    EXTENSION_ID="$1"
else
    echo "Usage: ./start-ollama.sh <your-extension-id>"
    echo ""
    echo "To find your extension ID:"
    echo "1. Open Chrome and go to chrome://extensions/"
    echo "2. Find 'Multi-Tab Summarizer' in the list"
    echo "3. Copy the ID shown under the extension name"
    echo ""
    echo "Example: ./start-ollama.sh ckeegdgmbadeeplemigcgaojkaediein"
    exit 1
fi

# Stop any existing Ollama processes
echo "Stopping existing Ollama processes..."
pkill -f ollama

# Wait a moment for processes to stop
sleep 2

# Start Ollama with the correct CORS configuration for Chrome extension
echo "Starting Ollama with Chrome extension CORS support..."
echo "Extension ID: $EXTENSION_ID"

OLLAMA_ORIGINS="chrome-extension://$EXTENSION_ID" ollama serve
