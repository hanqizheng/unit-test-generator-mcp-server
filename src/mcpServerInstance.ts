import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import path from "path";

import {
  getComponentFiles,
  generateTestPrompt,
  extractComponentDependencies,
  getDependentComponentTypes,
} from "./helpers.js";
import { DependentComponent } from "./type.js";

// Create server instance
const mcpServerInstance = new McpServer({
  name: "unit-test-generator",
  version: "1.0.0",
  description: "组件单元测试生成工具",
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
    },
  },
});

// 获取组件目录路径
function getComponentsPath() {
  return process.env.PROJECT_PATH
    ? path.join(process.env.PROJECT_PATH, "src/components")
    : "src/components";
}

// 只保留一个生成单元测试提示词的工具
mcpServerInstance.tool(
  "generate-test-prompt",
  {
    componentName: z.string(),
  },
  async ({ componentName }) => {
    try {
      // 使用项目根路径和标准组件目录结构
      const componentsPath = getComponentsPath();

      // 构建组件路径
      const fullComponentPath = path.join(componentsPath, componentName);

      console.error(`项目路径: ${process.env.PROJECT_PATH}`);
      console.error(`构建的组件完整路径: ${fullComponentPath}`);

      const { indexContent, success, message } = await getComponentFiles(
        componentName,
        fullComponentPath
      );

      if (!success) {
        return {
          content: [{ type: "text", text: message }],
        };
      }

      // 分析组件代码，检测依赖组件
      const dependentComponents = extractComponentDependencies(indexContent);

      let dependentTypes: DependentComponent[] = [];
      // 如果有依赖组件，直接获取它们的类型定义
      if (dependentComponents.length > 0) {
        console.error(`检测到组件依赖: ${dependentComponents.join(", ")}`);
        dependentTypes = await getDependentComponentTypes(
          dependentComponents,
          componentsPath
        );
      }

      // 生成包含所有必要信息的提示词
      const prompt = generateTestPrompt(componentName, dependentTypes);

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

export default mcpServerInstance;
