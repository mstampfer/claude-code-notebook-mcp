# Jupyter MCP Gateway

A Model Context Protocol (MCP) server that provides comprehensive Jupyter notebook interaction capabilities, compatible with Claude Code.

> **Note**: This library emulates the functionality of the [cursor-notebook-mcp](https://github.com/jbeno/cursor-notebook-mcp) repository but runs in a web browser. For live updates in Jupyter, install the collaboration extension:
> 
> ```bash
> pip install jupyter-collaboration
> jupyter labextension install @jupyter/collaboration-extension
> ```
> 
> Or for JupyterLab 3.x:
> ```bash
> pip install jupyterlab-collaboration
> ```

## Features

This MCP server implements all 29 required Jupyter notebook operations:

### Notebook Management
- `notebook_create` - Creates a new, empty notebook file
- `notebook_delete` - Deletes an existing notebook file  
- `notebook_rename` - Renames/moves a notebook file from one path to another
- `notebook_read` - Reads an entire notebook and returns its structure as a dictionary

### Cell Operations
- `notebook_read_cell` - Reads the source content of a specific cell
- `notebook_add_cell` - Adds a new code or markdown cell after a specified index
- `notebook_edit_cell` - Replaces the source content of a specific cell
- `notebook_delete_cell` - Deletes a specific cell
- `notebook_change_cell_type` - Changes a cell's type (code, markdown, or raw)
- `notebook_duplicate_cell` - Duplicates a cell multiple times (default: once)
- `notebook_move_cell` - Moves a cell to a different position
- `notebook_split_cell` - Splits a cell into two at a specified line number
- `notebook_merge_cells` - Merges a cell with the cell immediately following it

### Cell Content & Metadata
- `notebook_read_cell_metadata` - Reads the metadata of a specific cell
- `notebook_edit_cell_metadata` - Updates the metadata of a specific cell
- `notebook_read_cell_output` - Reads the output list of a specific code cell
- `notebook_edit_cell_output` - Allows direct manipulation and setting of cell outputs
- `notebook_clear_cell_outputs` - Clears the outputs and execution count of a specific cell
- `notebook_clear_all_outputs` - Clears outputs and execution counts for all code cells

### Notebook Information & Metadata
- `notebook_get_cell_count` - Returns the total number of cells
- `notebook_read_metadata` - Reads the top-level notebook metadata
- `notebook_edit_metadata` - Updates the top-level notebook metadata
- `notebook_get_info` - Retrieves general information (cell count, metadata, kernel, language info)
- `notebook_validate` - Validates the notebook structure against the nbformat schema

### Advanced Operations
- `notebook_export` - Exports the notebook to another format (e.g., python, html) using nbconvert
- `notebook_get_outline` - Produces an outline showing cell numbers with major headings/functions and line counts
- `notebook_search` - Searches cells for a keyword, showing which cell matches were found with contextual snippets
- `notebook_bulk_add_cells` - Adds multiple cells to a notebook in a single operation
- `notebook_get_server_path_context` - Provides detailed server path configuration

## Installation

```bash
npm install
```

## Usage

### As MCP Server (for Claude Code)

#### Option 1: Using Claude CLI (Recommended)

1. Navigate to the project directory:
```bash
cd /path/to/jupyter-mcp-gateway
```

2. Add the MCP server:
```bash
claude mcp add jupyter "$(pwd)/src/server.js"
```

3. Verify the server was added:
```bash
claude mcp list
```

#### Option 2: Manual Configuration

1. Create a `.mcp.json` file in your project root:
```json
{
  "mcpServers": {
    "jupyter": {
      "command": "node",
      "args": ["src/server.js"],
      "env": {}
    }
  }
}
```

2. Or add to your user settings at `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "jupyter": {
      "command": "node",
      "args": ["src/server.js"],
      "cwd": "/path/to/jupyter-mcp-gateway"
    }
  }
}
```

3. Start Claude Code and the Jupyter tools will be available.

### Standalone Client

```bash
node src/client.js
```

This will run a demonstration showing the basic capabilities.

### Programmatic Usage

```javascript
import { JupyterMCPClient } from './src/client.js';

const client = new JupyterMCPClient();
await client.connect();

// Create a new notebook
await client.createNotebook('./my_notebook.ipynb');

// Add a markdown cell
await client.addCell('./my_notebook.ipynb', 'markdown', '# My Notebook', -1);

// Add a code cell
await client.addCell('./my_notebook.ipynb', 'code', 'print("Hello World")', 0);

// Get notebook outline
const outline = await client.getOutline('./my_notebook.ipynb');
console.log(outline.content[0].text);
```

## Compatibility

- **Claude Code**: Fully compatible with Claude Code's MCP integration
- **Node.js**: Requires Node.js 18+ with ES modules support
- **Jupyter**: Compatible with nbformat 4.x notebooks

## Development

### Running the Server
```bash
npm start
```

### Development Mode (with file watching)
```bash
npm run dev
```

### Testing
```bash
node src/client.js
```

## Architecture

- **Server** (`src/server.js`): MCP server implementation with all 29 Jupyter notebook tools
- **Client** (`src/client.js`): Example client with convenience methods for common operations
- **Configuration** (`claude-code-config.json`): Claude Code MCP server configuration

The server uses the official MCP SDK and implements the full MCP protocol for tool calling. All notebook operations are performed using Node.js file system operations and JSON manipulation, ensuring compatibility across platforms.