#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';

async function simpleTest() {
  try {
    console.log('Testing notebook creation without MCP...');
    
    const testPath = './simple_test.ipynb';
    
    const notebook = {
      cells: [],
      metadata: {
        kernelspec: {
          display_name: "Python 3",
          language: "python", 
          name: "python3"
        },
        language_info: {
          name: "python",
          version: "3.8.0"
        }
      },
      nbformat: 4,
      nbformat_minor: 4
    };
    
    await fs.writeJson(testPath, notebook, { spaces: 2 });
    console.log('✓ Notebook created successfully');
    
    const readBack = await fs.readJson(testPath);
    console.log('✓ Notebook read successfully');
    console.log(`✓ Has ${readBack.cells.length} cells`);
    
    await fs.remove(testPath);
    console.log('✓ Cleanup completed');
    
    console.log('\n🎉 Basic file operations work correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

simpleTest();