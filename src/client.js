#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

class JupyterMCPClient {
  constructor() {
    this.client = new Client(
      {
        name: "jupyter-mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );
  }

  async connect(serverCommand = ['node', 'src/server.js']) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const projectRoot = path.dirname(__dirname);
    
    const serverProcess = spawn(serverCommand[0], serverCommand.slice(1), {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: projectRoot
    });

    const transport = new StdioClientTransport({
      readable: serverProcess.stdout,
      writable: serverProcess.stdin
    });

    await this.client.connect(transport);
    
    process.on('SIGINT', () => {
      serverProcess.kill('SIGINT');
      process.exit(0);
    });

    return this.client;
  }

  async listTools() {
    const response = await this.client.request(
      { method: "tools/list" },
      { method: "tools/list", params: {} }
    );
    return response.tools;
  }

  async callTool(name, args) {
    const response = await this.client.request(
      { method: "tools/call" },
      { 
        method: "tools/call", 
        params: { 
          name, 
          arguments: args 
        } 
      }
    );
    return response;
  }

  async createNotebook(path) {
    return await this.callTool('notebook_create', { path });
  }

  async readNotebook(path) {
    return await this.callTool('notebook_read', { path });
  }

  async addCell(path, cellType, source, index) {
    return await this.callTool('notebook_add_cell', { 
      path, 
      cell_type: cellType, 
      source, 
      index 
    });
  }

  async editCell(path, cellIndex, newSource) {
    return await this.callTool('notebook_edit_cell', { 
      path, 
      cell_index: cellIndex, 
      new_source: newSource 
    });
  }

  async deleteCell(path, cellIndex) {
    return await this.callTool('notebook_delete_cell', { 
      path, 
      cell_index: cellIndex 
    });
  }

  async getOutline(path) {
    return await this.callTool('notebook_get_outline', { path });
  }

  async searchNotebook(path, query, caseSensitive = false) {
    return await this.callTool('notebook_search', { 
      path, 
      query, 
      case_sensitive: caseSensitive 
    });
  }

  async getNotebookInfo(path) {
    return await this.callTool('notebook_get_info', { path });
  }

  async clearAllOutputs(path) {
    return await this.callTool('notebook_clear_all_outputs', { path });
  }

  async validateNotebook(path) {
    return await this.callTool('notebook_validate', { path });
  }
}

export { JupyterMCPClient };

const __filename = fileURLToPath(import.meta.url);
if (import.meta.url === `file://${process.argv[1]}`) {
  async function demo() {
    const client = new JupyterMCPClient();
    
    try {
      await client.connect();
      console.log('Connected to Jupyter MCP Server');
      
      const tools = await client.listTools();
      console.log(`Available tools: ${tools.length}`);
      tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });

      const testNotebookPath = './test_notebook.ipynb';
      
      console.log('\nCreating test notebook...');
      const createResult = await client.createNotebook(testNotebookPath);
      console.log(createResult.content[0].text);

      console.log('\nAdding a markdown cell...');
      const addResult = await client.addCell(testNotebookPath, 'markdown', '# Test Notebook\nThis is a test notebook created via MCP.', -1);
      console.log(addResult.content[0].text);

      console.log('\nAdding a code cell...');
      const codeResult = await client.addCell(testNotebookPath, 'code', 'print("Hello from Jupyter MCP!")\nx = 2 + 2\nprint(f"2 + 2 = {x}")', 0);
      console.log(codeResult.content[0].text);

      console.log('\nGetting notebook outline...');
      const outline = await client.getOutline(testNotebookPath);
      console.log(outline.content[0].text);

      console.log('\nGetting notebook info...');
      const info = await client.getNotebookInfo(testNotebookPath);
      console.log(info.content[0].text);

      console.log('\nValidating notebook...');
      const validation = await client.validateNotebook(testNotebookPath);
      console.log(validation.content[0].text);

    } catch (error) {
      console.error('Error:', error);
    }
  }

  demo();
}