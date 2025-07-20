#!/usr/bin/env node

import { JupyterMCPClient } from './src/client.js';
import fs from 'fs-extra';

async function runTest() {
  const client = new JupyterMCPClient();
  
  try {
    console.log('Starting Jupyter MCP test...');
    await client.connect();
    console.log('✓ Connected to Jupyter MCP Server');
    
    const tools = await client.listTools();
    console.log(`✓ Available tools: ${tools.length}`);
    
    const testNotebookPath = './test_notebook.ipynb';
    
    if (await fs.pathExists(testNotebookPath)) {
      await fs.remove(testNotebookPath);
    }
    
    console.log('\n🧪 Creating test notebook...');
    const createResult = await client.createNotebook(testNotebookPath);
    console.log('✓', createResult.content[0].text);

    console.log('\n📝 Adding a markdown cell...');
    const addResult = await client.addCell(testNotebookPath, 'markdown', '# Test Notebook\nThis is a test notebook created via MCP.', -1);
    console.log('✓', addResult.content[0].text);

    console.log('\n💻 Adding a code cell...');
    const codeResult = await client.addCell(testNotebookPath, 'code', 'print("Hello from Jupyter MCP!")\nx = 2 + 2\nprint(f"2 + 2 = {x}")', 0);
    console.log('✓', codeResult.content[0].text);

    console.log('\n📋 Getting notebook outline...');
    const outline = await client.getOutline(testNotebookPath);
    console.log('✓ Outline generated');

    console.log('\n📊 Getting notebook info...');
    const info = await client.getNotebookInfo(testNotebookPath);
    const infoData = JSON.parse(info.content[0].text);
    console.log(`✓ Notebook has ${infoData.cell_count} cells (${infoData.code_cells} code, ${infoData.markdown_cells} markdown)`);

    console.log('\n✅ Validating notebook...');
    const validation = await client.validateNotebook(testNotebookPath);
    console.log('✓', validation.content[0].text);

    console.log('\n🧹 Cleaning up...');
    await fs.remove(testNotebookPath);
    console.log('✓ Test notebook removed');

    console.log('\n🎉 All tests passed! Jupyter MCP Gateway is working correctly.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();