#!/usr/bin/env node

// Setup script to help users configure Ollama for the Chrome extension
const extensionId = 'ckeegdgmbadeeplemigcgaojkaediein'; // This will be the actual extension ID when published

console.log('🔧 Multi-Tab Summarizer Setup');
console.log('===============================\n');

console.log('To use this extension with Ollama, you need to configure Ollama to allow Chrome extension origins.\n');

console.log('📋 Setup Instructions:');
console.log('1. Stop your current Ollama server (Ctrl+C if running)');
console.log('2. Run Ollama with the following command:\n');

console.log('   For development (unpacked extension):');
console.log(`   OLLAMA_ORIGINS="chrome-extension://${extensionId}" ollama serve\n`);

console.log('   For published extension:');
console.log('   OLLAMA_ORIGINS="chrome-extension://*" ollama serve\n');

console.log('3. Load/reload the Chrome extension');
console.log('4. Start summarizing!\n');

console.log('💡 Why is this needed?');
console.log('Chrome extensions have strict security policies that require explicit permission');
console.log('from localhost services like Ollama. This is a one-time setup.\n');

console.log('🎯 Alternative: If you want zero configuration, use the OpenAI provider instead.');
console.log('Just enter your OpenAI API key in the extension popup.\n');

console.log('📖 For more help, see: README.md');

if (process.argv.includes('--copy')) {
  const { exec } = require('child_process');
  const command = `OLLAMA_ORIGINS="chrome-extension://${extensionId}" ollama serve`;
  
  // Try to copy to clipboard on macOS
  exec(`echo '${command}' | pbcopy`, (error) => {
    if (!error) {
      console.log('\n✅ Command copied to clipboard!');
    }
  });
}