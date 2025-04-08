import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getComponentFiles,
  generateTestPrompt,
  listComponents,
} from "./helpers.js";

// Create server instance
const mcpServerInstance = new McpServer({
  name: "unit-test-generator",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {
      "generate-test-prompt": {
        description: "生成用于单元测试的提示词",
        parameters: {
          componentName: {
            description: "组件名称",
            type: "string",
          },
          componentPath: {
            description: "组件路径",
            type: "string",
          },
        },
      },
      "list-components": {
        description: "列出可用的组件",
        parameters: {
          componentsDir: {
            description: "组件目录",
            type: "string",
          },
        },
      },
    },
  },
});

// 添加生成单元测试提示词的工具
mcpServerInstance.tool(
  "generate-test-prompt",
  {
    componentName: z.string(),
    componentPath: z.string(),
  },
  async ({ componentName, componentPath }) => {
    try {
      const { typesContent, indexContent, success, message } =
        await getComponentFiles(componentName, componentPath);

      if (!success) {
        return {
          content: [{ type: "text", text: message }],
        };
      }

      const prompt = generateTestPrompt(
        componentName,
        typesContent,
        indexContent
      );

      return {
        content: [{ type: "text", text: prompt }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
      };
    }
  }
);

// 添加列出组件的工具
mcpServerInstance.tool(
  "list-components",
  {
    componentsDir: z.string(),
  },
  async ({ componentsDir }) => {
    try {
      const { components, success, message } = await listComponents(
        componentsDir
      );

      if (!success) {
        return {
          content: [
            { type: "text", text: message || "Failed to list components" },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ components }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
      };
    }
  }
);

export default mcpServerInstance;
