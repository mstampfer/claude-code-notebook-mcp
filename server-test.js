#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

async function testServer() {
  console.log('Testing MCP server startup...');
  
  const serverProcess = spawn('node', ['src/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let output = '';
  let errorOutput = '';
  
  serverProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  serverProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });
  
  setTimeout(() => {
    serverProcess.kill('SIGTERM');
  }, 2000);
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code: ${code}`);
    console.log('STDERR output:', errorOutput);
    console.log('STDOUT output:', output);
    
    if (errorOutput.includes('Jupyter MCP Server running on stdio')) {
      console.log('✓ Server started successfully!');
    } else {
      console.log('❌ Server startup may have issues');
    }
  });
  
  await sleep(3000);
}

testServer();