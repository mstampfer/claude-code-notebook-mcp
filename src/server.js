#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

class JupyterMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "claude-code-notebook-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "notebook_create",
          description: "Creates a new, empty notebook file",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path where the notebook will be created"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "notebook_delete",
          description: "Deletes an existing notebook file",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook to delete"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "notebook_rename",
          description: "Renames/moves a notebook file from one path to another",
          inputSchema: {
            type: "object",
            properties: {
              old_path: {
                type: "string",
                description: "Current path of the notebook"
              },
              new_path: {
                type: "string",
                description: "New path for the notebook"
              }
            },
            required: ["old_path", "new_path"]
          }
        },
        {
          name: "notebook_read",
          description: "Reads an entire notebook and returns its structure as a dictionary",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook to read"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "notebook_read_cell",
          description: "Reads the source content of a specific cell",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the cell to read"
              }
            },
            required: ["path", "cell_index"]
          }
        },
        {
          name: "notebook_add_cell",
          description: "Adds a new code or markdown cell after a specified index",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_type: {
                type: "string",
                enum: ["code", "markdown", "raw"],
                description: "Type of cell to add"
              },
              source: {
                type: "string",
                description: "Source content for the new cell"
              },
              index: {
                type: "number",
                description: "Index after which to insert the cell"
              }
            },
            required: ["path", "cell_type", "source", "index"]
          }
        },
        {
          name: "notebook_edit_cell",
          description: "Replaces the source content of a specific cell",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the cell to edit"
              },
              new_source: {
                type: "string",
                description: "New source content for the cell"
              }
            },
            required: ["path", "cell_index", "new_source"]
          }
        },
        {
          name: "notebook_delete_cell",
          description: "Deletes a specific cell",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the cell to delete"
              }
            },
            required: ["path", "cell_index"]
          }
        },
        {
          name: "notebook_change_cell_type",
          description: "Changes a cell's type (code, markdown, or raw)",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the cell to modify"
              },
              new_type: {
                type: "string",
                enum: ["code", "markdown", "raw"],
                description: "New cell type"
              }
            },
            required: ["path", "cell_index", "new_type"]
          }
        },
        {
          name: "notebook_duplicate_cell",
          description: "Duplicates a cell multiple times (default: once)",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the cell to duplicate"
              },
              count: {
                type: "number",
                default: 1,
                description: "Number of times to duplicate the cell"
              }
            },
            required: ["path", "cell_index"]
          }
        },
        {
          name: "notebook_get_cell_count",
          description: "Returns the total number of cells",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "notebook_read_metadata",
          description: "Reads the top-level notebook metadata",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "notebook_edit_metadata",
          description: "Updates the top-level notebook metadata",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              metadata: {
                type: "object",
                description: "New metadata object"
              }
            },
            required: ["path", "metadata"]
          }
        },
        {
          name: "notebook_read_cell_metadata",
          description: "Reads the metadata of a specific cell",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the cell"
              }
            },
            required: ["path", "cell_index"]
          }
        },
        {
          name: "notebook_read_cell_output",
          description: "Reads the output list of a specific code cell",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the cell"
              }
            },
            required: ["path", "cell_index"]
          }
        },
        {
          name: "notebook_edit_cell_metadata",
          description: "Updates the metadata of a specific cell",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the cell"
              },
              metadata: {
                type: "object",
                description: "New metadata object"
              }
            },
            required: ["path", "cell_index", "metadata"]
          }
        },
        {
          name: "notebook_clear_cell_outputs",
          description: "Clears the outputs and execution count of a specific cell",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the cell"
              }
            },
            required: ["path", "cell_index"]
          }
        },
        {
          name: "notebook_clear_all_outputs",
          description: "Clears outputs and execution counts for all code cells",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "notebook_move_cell",
          description: "Moves a cell to a different position",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              from_index: {
                type: "number",
                description: "Current index of the cell"
              },
              to_index: {
                type: "number",
                description: "Target index for the cell"
              }
            },
            required: ["path", "from_index", "to_index"]
          }
        },
        {
          name: "notebook_split_cell",
          description: "Splits a cell into two at a specified line number",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the cell to split"
              },
              line_number: {
                type: "number",
                description: "Line number at which to split"
              }
            },
            required: ["path", "cell_index", "line_number"]
          }
        },
        {
          name: "notebook_merge_cells",
          description: "Merges a cell with the cell immediately following it",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the first cell to merge"
              }
            },
            required: ["path", "cell_index"]
          }
        },
        {
          name: "notebook_validate",
          description: "Validates the notebook structure against the nbformat schema",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "notebook_get_info",
          description: "Retrieves general information (cell count, metadata, kernel, language info)",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "notebook_export",
          description: "Exports the notebook to another format (e.g., python, html) using nbconvert",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              format: {
                type: "string",
                enum: ["python", "html", "markdown", "latex", "pdf"],
                description: "Export format"
              },
              output_path: {
                type: "string",
                description: "Path for the exported file"
              }
            },
            required: ["path", "format"]
          }
        },
        {
          name: "notebook_get_outline",
          description: "Produces an outline showing cell numbers with major headings/functions and line counts",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "notebook_search",
          description: "Searches cells for a keyword, showing which cell matches were found with contextual snippets",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              query: {
                type: "string",
                description: "Search query"
              },
              case_sensitive: {
                type: "boolean",
                default: false,
                description: "Whether the search should be case sensitive"
              }
            },
            required: ["path", "query"]
          }
        },
        {
          name: "notebook_edit_cell_output",
          description: "Allows direct manipulation and setting of cell outputs",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cell_index: {
                type: "number",
                description: "Index of the cell"
              },
              outputs: {
                type: "array",
                description: "New outputs array"
              }
            },
            required: ["path", "cell_index", "outputs"]
          }
        },
        {
          name: "notebook_bulk_add_cells",
          description: "Adds multiple cells to a notebook in a single operation",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the notebook"
              },
              cells: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    cell_type: {
                      type: "string",
                      enum: ["code", "markdown", "raw"]
                    },
                    source: {
                      type: "string"
                    }
                  },
                  required: ["cell_type", "source"]
                },
                description: "Array of cells to add"
              },
              index: {
                type: "number",
                description: "Index after which to insert the cells"
              }
            },
            required: ["path", "cells", "index"]
          }
        },
        {
          name: "notebook_get_server_path_context",
          description: "Provides detailed server path configuration (allowed_roots, OS path style, project directory validation, and path construction guidance)",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to analyze"
              }
            },
            required: ["path"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "notebook_create":
            return await this.createNotebook(args.path);
          case "notebook_delete":
            return await this.deleteNotebook(args.path);
          case "notebook_rename":
            return await this.renameNotebook(args.old_path, args.new_path);
          case "notebook_read":
            return await this.readNotebook(args.path);
          case "notebook_read_cell":
            return await this.readCell(args.path, args.cell_index);
          case "notebook_add_cell":
            return await this.addCell(args.path, args.cell_type, args.source, args.index);
          case "notebook_edit_cell":
            return await this.editCell(args.path, args.cell_index, args.new_source);
          case "notebook_delete_cell":
            return await this.deleteCell(args.path, args.cell_index);
          case "notebook_change_cell_type":
            return await this.changeCellType(args.path, args.cell_index, args.new_type);
          case "notebook_duplicate_cell":
            return await this.duplicateCell(args.path, args.cell_index, args.count || 1);
          case "notebook_get_cell_count":
            return await this.getCellCount(args.path);
          case "notebook_read_metadata":
            return await this.readMetadata(args.path);
          case "notebook_edit_metadata":
            return await this.editMetadata(args.path, args.metadata);
          case "notebook_read_cell_metadata":
            return await this.readCellMetadata(args.path, args.cell_index);
          case "notebook_read_cell_output":
            return await this.readCellOutput(args.path, args.cell_index);
          case "notebook_edit_cell_metadata":
            return await this.editCellMetadata(args.path, args.cell_index, args.metadata);
          case "notebook_clear_cell_outputs":
            return await this.clearCellOutputs(args.path, args.cell_index);
          case "notebook_clear_all_outputs":
            return await this.clearAllOutputs(args.path);
          case "notebook_move_cell":
            return await this.moveCell(args.path, args.from_index, args.to_index);
          case "notebook_split_cell":
            return await this.splitCell(args.path, args.cell_index, args.line_number);
          case "notebook_merge_cells":
            return await this.mergeCells(args.path, args.cell_index);
          case "notebook_validate":
            return await this.validateNotebook(args.path);
          case "notebook_get_info":
            return await this.getNotebookInfo(args.path);
          case "notebook_export":
            return await this.exportNotebook(args.path, args.format, args.output_path);
          case "notebook_get_outline":
            return await this.getOutline(args.path);
          case "notebook_search":
            return await this.searchNotebook(args.path, args.query, args.case_sensitive);
          case "notebook_edit_cell_output":
            return await this.editCellOutput(args.path, args.cell_index, args.outputs);
          case "notebook_bulk_add_cells":
            return await this.bulkAddCells(args.path, args.cells, args.index);
          case "notebook_get_server_path_context":
            return await this.getServerPathContext(args.path);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  createEmptyNotebook() {
    return {
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
  }

  async createNotebook(notebookPath) {
    const notebook = this.createEmptyNotebook();
    await fs.ensureDir(path.dirname(notebookPath));
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Created new notebook at: ${notebookPath}`,
        },
      ],
    };
  }

  async deleteNotebook(notebookPath) {
    await fs.remove(notebookPath);
    
    return {
      content: [
        {
          type: "text",
          text: `Deleted notebook: ${notebookPath}`,
        },
      ],
    };
  }

  async renameNotebook(oldPath, newPath) {
    await fs.ensureDir(path.dirname(newPath));
    await fs.move(oldPath, newPath);
    
    return {
      content: [
        {
          type: "text",
          text: `Renamed notebook from ${oldPath} to ${newPath}`,
        },
      ],
    };
  }

  async readNotebook(notebookPath) {
    const notebook = await fs.readJson(notebookPath);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(notebook, null, 2),
        },
      ],
    };
  }

  async readCell(notebookPath, cellIndex) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length || cellIndex < 0) {
      throw new Error(`Cell index ${cellIndex} out of bounds`);
    }
    
    const cell = notebook.cells[cellIndex];
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
    
    return {
      content: [
        {
          type: "text",
          text: source,
        },
      ],
    };
  }

  async addCell(notebookPath, cellType, source, index) {
    const notebook = await fs.readJson(notebookPath);
    
    const newCell = {
      cell_type: cellType,
      metadata: {},
      source: source
    };
    
    if (cellType === 'code') {
      newCell.execution_count = null;
      newCell.outputs = [];
    }
    
    notebook.cells.splice(index + 1, 0, newCell);
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Added ${cellType} cell at index ${index + 1}`,
        },
      ],
    };
  }

  async editCell(notebookPath, cellIndex, newSource) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length || cellIndex < 0) {
      throw new Error(`Cell index ${cellIndex} out of bounds`);
    }
    
    notebook.cells[cellIndex].source = newSource;
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Updated cell ${cellIndex}`,
        },
      ],
    };
  }

  async deleteCell(notebookPath, cellIndex) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length || cellIndex < 0) {
      throw new Error(`Cell index ${cellIndex} out of bounds`);
    }
    
    notebook.cells.splice(cellIndex, 1);
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Deleted cell ${cellIndex}`,
        },
      ],
    };
  }

  async changeCellType(notebookPath, cellIndex, newType) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length || cellIndex < 0) {
      throw new Error(`Cell index ${cellIndex} out of bounds`);
    }
    
    const cell = notebook.cells[cellIndex];
    cell.cell_type = newType;
    
    if (newType === 'code') {
      cell.execution_count = null;
      cell.outputs = [];
    } else {
      delete cell.execution_count;
      delete cell.outputs;
    }
    
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Changed cell ${cellIndex} type to ${newType}`,
        },
      ],
    };
  }

  async duplicateCell(notebookPath, cellIndex, count) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length || cellIndex < 0) {
      throw new Error(`Cell index ${cellIndex} out of bounds`);
    }
    
    const originalCell = JSON.parse(JSON.stringify(notebook.cells[cellIndex]));
    
    for (let i = 0; i < count; i++) {
      const duplicatedCell = JSON.parse(JSON.stringify(originalCell));
      if (duplicatedCell.cell_type === 'code') {
        duplicatedCell.execution_count = null;
        duplicatedCell.outputs = [];
      }
      notebook.cells.splice(cellIndex + 1 + i, 0, duplicatedCell);
    }
    
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Duplicated cell ${cellIndex} ${count} time(s)`,
        },
      ],
    };
  }

  async getCellCount(notebookPath) {
    const notebook = await fs.readJson(notebookPath);
    
    return {
      content: [
        {
          type: "text",
          text: `${notebook.cells.length}`,
        },
      ],
    };
  }

  async readMetadata(notebookPath) {
    const notebook = await fs.readJson(notebookPath);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(notebook.metadata, null, 2),
        },
      ],
    };
  }

  async editMetadata(notebookPath, metadata) {
    const notebook = await fs.readJson(notebookPath);
    notebook.metadata = { ...notebook.metadata, ...metadata };
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: "Updated notebook metadata",
        },
      ],
    };
  }

  async readCellMetadata(notebookPath, cellIndex) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length || cellIndex < 0) {
      throw new Error(`Cell index ${cellIndex} out of bounds`);
    }
    
    const metadata = notebook.cells[cellIndex].metadata || {};
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(metadata, null, 2),
        },
      ],
    };
  }

  async readCellOutput(notebookPath, cellIndex) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length || cellIndex < 0) {
      throw new Error(`Cell index ${cellIndex} out of bounds`);
    }
    
    const cell = notebook.cells[cellIndex];
    const outputs = cell.outputs || [];
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(outputs, null, 2),
        },
      ],
    };
  }

  async editCellMetadata(notebookPath, cellIndex, metadata) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length || cellIndex < 0) {
      throw new Error(`Cell index ${cellIndex} out of bounds`);
    }
    
    notebook.cells[cellIndex].metadata = { ...notebook.cells[cellIndex].metadata, ...metadata };
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Updated metadata for cell ${cellIndex}`,
        },
      ],
    };
  }

  async clearCellOutputs(notebookPath, cellIndex) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length || cellIndex < 0) {
      throw new Error(`Cell index ${cellIndex} out of bounds`);
    }
    
    const cell = notebook.cells[cellIndex];
    if (cell.cell_type === 'code') {
      cell.outputs = [];
      cell.execution_count = null;
    }
    
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Cleared outputs for cell ${cellIndex}`,
        },
      ],
    };
  }

  async clearAllOutputs(notebookPath) {
    const notebook = await fs.readJson(notebookPath);
    
    notebook.cells.forEach(cell => {
      if (cell.cell_type === 'code') {
        cell.outputs = [];
        cell.execution_count = null;
      }
    });
    
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: "Cleared all outputs",
        },
      ],
    };
  }

  async moveCell(notebookPath, fromIndex, toIndex) {
    const notebook = await fs.readJson(notebookPath);
    
    if (fromIndex >= notebook.cells.length || fromIndex < 0 || toIndex >= notebook.cells.length || toIndex < 0) {
      throw new Error("Cell index out of bounds");
    }
    
    const cell = notebook.cells.splice(fromIndex, 1)[0];
    notebook.cells.splice(toIndex, 0, cell);
    
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Moved cell from index ${fromIndex} to ${toIndex}`,
        },
      ],
    };
  }

  async splitCell(notebookPath, cellIndex, lineNumber) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length || cellIndex < 0) {
      throw new Error(`Cell index ${cellIndex} out of bounds`);
    }
    
    const cell = notebook.cells[cellIndex];
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
    const lines = source.split('\n');
    
    if (lineNumber >= lines.length || lineNumber < 0) {
      throw new Error(`Line number ${lineNumber} out of bounds`);
    }
    
    const firstPart = lines.slice(0, lineNumber).join('\n');
    const secondPart = lines.slice(lineNumber).join('\n');
    
    cell.source = firstPart;
    
    const newCell = {
      cell_type: cell.cell_type,
      metadata: {},
      source: secondPart
    };
    
    if (cell.cell_type === 'code') {
      newCell.execution_count = null;
      newCell.outputs = [];
    }
    
    notebook.cells.splice(cellIndex + 1, 0, newCell);
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Split cell ${cellIndex} at line ${lineNumber}`,
        },
      ],
    };
  }

  async mergeCells(notebookPath, cellIndex) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length - 1 || cellIndex < 0) {
      throw new Error("Cannot merge: cell index out of bounds or no next cell");
    }
    
    const currentCell = notebook.cells[cellIndex];
    const nextCell = notebook.cells[cellIndex + 1];
    
    const currentSource = Array.isArray(currentCell.source) ? currentCell.source.join('') : currentCell.source;
    const nextSource = Array.isArray(nextCell.source) ? nextCell.source.join('') : nextCell.source;
    
    currentCell.source = currentSource + '\n' + nextSource;
    notebook.cells.splice(cellIndex + 1, 1);
    
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Merged cell ${cellIndex} with cell ${cellIndex + 1}`,
        },
      ],
    };
  }

  async validateNotebook(notebookPath) {
    try {
      const notebook = await fs.readJson(notebookPath);
      
      const requiredFields = ['cells', 'metadata', 'nbformat', 'nbformat_minor'];
      const missingFields = requiredFields.filter(field => !(field in notebook));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      if (!Array.isArray(notebook.cells)) {
        throw new Error("'cells' must be an array");
      }
      
      for (let i = 0; i < notebook.cells.length; i++) {
        const cell = notebook.cells[i];
        if (!cell.cell_type || !['code', 'markdown', 'raw'].includes(cell.cell_type)) {
          throw new Error(`Invalid cell_type at index ${i}: ${cell.cell_type}`);
        }
        if (!('source' in cell)) {
          throw new Error(`Missing 'source' in cell at index ${i}`);
        }
      }
      
      return {
        content: [
          {
            type: "text",
            text: "Notebook validation passed",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Validation failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getNotebookInfo(notebookPath) {
    const notebook = await fs.readJson(notebookPath);
    
    const info = {
      cell_count: notebook.cells.length,
      code_cells: notebook.cells.filter(cell => cell.cell_type === 'code').length,
      markdown_cells: notebook.cells.filter(cell => cell.cell_type === 'markdown').length,
      raw_cells: notebook.cells.filter(cell => cell.cell_type === 'raw').length,
      nbformat: notebook.nbformat,
      nbformat_minor: notebook.nbformat_minor,
      kernel: notebook.metadata.kernelspec?.name || 'unknown',
      language: notebook.metadata.language_info?.name || 'unknown'
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  async exportNotebook(notebookPath, format, outputPath) {
    return {
      content: [
        {
          type: "text",
          text: `Export functionality requires nbconvert. This is a basic implementation that would need nbconvert integration for formats: ${format}`,
        },
      ],
    };
  }

  async getOutline(notebookPath) {
    const notebook = await fs.readJson(notebookPath);
    
    const outline = notebook.cells.map((cell, index) => {
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
      const lines = source.split('\n');
      const lineCount = lines.length;
      
      let title = `Cell ${index} (${cell.cell_type})`;
      
      if (cell.cell_type === 'markdown') {
        const headerMatch = source.match(/^#+\s+(.+)/m);
        if (headerMatch) {
          title += ` - ${headerMatch[1]}`;
        }
      } else if (cell.cell_type === 'code') {
        const defMatch = source.match(/^def\s+(\w+)/m);
        const classMatch = source.match(/^class\s+(\w+)/m);
        if (defMatch) {
          title += ` - def ${defMatch[1]}()`;
        } else if (classMatch) {
          title += ` - class ${classMatch[1]}`;
        }
      }
      
      return `${title} (${lineCount} lines)`;
    });
    
    return {
      content: [
        {
          type: "text",
          text: outline.join('\n'),
        },
      ],
    };
  }

  async searchNotebook(notebookPath, query, caseSensitive = false) {
    const notebook = await fs.readJson(notebookPath);
    const results = [];
    
    notebook.cells.forEach((cell, index) => {
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
      const searchText = caseSensitive ? source : source.toLowerCase();
      const searchQuery = caseSensitive ? query : query.toLowerCase();
      
      if (searchText.includes(searchQuery)) {
        const lines = source.split('\n');
        const matchingLines = lines
          .map((line, lineIndex) => ({ line, lineIndex }))
          .filter(({ line }) => (caseSensitive ? line : line.toLowerCase()).includes(searchQuery));
        
        results.push({
          cell_index: index,
          cell_type: cell.cell_type,
          matches: matchingLines.map(({ line, lineIndex }) => ({
            line_number: lineIndex + 1,
            content: line.trim()
          }))
        });
      }
    });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  async editCellOutput(notebookPath, cellIndex, outputs) {
    const notebook = await fs.readJson(notebookPath);
    
    if (cellIndex >= notebook.cells.length || cellIndex < 0) {
      throw new Error(`Cell index ${cellIndex} out of bounds`);
    }
    
    const cell = notebook.cells[cellIndex];
    if (cell.cell_type !== 'code') {
      throw new Error(`Cell ${cellIndex} is not a code cell`);
    }
    
    cell.outputs = outputs;
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Updated outputs for cell ${cellIndex}`,
        },
      ],
    };
  }

  async bulkAddCells(notebookPath, cells, index) {
    const notebook = await fs.readJson(notebookPath);
    
    const newCells = cells.map(cellData => {
      const cell = {
        cell_type: cellData.cell_type,
        metadata: {},
        source: cellData.source
      };
      
      if (cellData.cell_type === 'code') {
        cell.execution_count = null;
        cell.outputs = [];
      }
      
      return cell;
    });
    
    notebook.cells.splice(index + 1, 0, ...newCells);
    await fs.writeJson(notebookPath, notebook, { spaces: 2 });
    
    return {
      content: [
        {
          type: "text",
          text: `Added ${cells.length} cells at index ${index + 1}`,
        },
      ],
    };
  }

  async getServerPathContext(filePath) {
    const stats = await fs.stat(filePath).catch(() => null);
    const pathInfo = {
      path: filePath,
      exists: !!stats,
      is_file: stats?.isFile() || false,
      is_directory: stats?.isDirectory() || false,
      absolute_path: path.resolve(filePath),
      dirname: path.dirname(filePath),
      basename: path.basename(filePath),
      extname: path.extname(filePath),
      os_path_style: process.platform === 'win32' ? 'windows' : 'posix',
      platform: process.platform
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(pathInfo, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Jupyter MCP Server running on stdio");
  }
}

const __filename = fileURLToPath(import.meta.url);
const server = new JupyterMCPServer();
server.run().catch(console.error);