import { promises as fs } from "fs";
import { exec } from "child_process";
import path from "path";
import { z } from "zod";

/**
 * 获取组件文件内容
 * @param componentName 组件名称
 * @param componentPath 组件路径
 */
export async function getComponentFiles(
  componentName: string,
  componentPath: string
) {
  try {
    // 输出调试信息
    console.error(`尝试读取组件: ${componentName}`);
    console.error(`组件路径: ${componentPath}`);

    // 构建文件路径 - 尝试多种可能的文件命名
    const possibleTypeFiles = [
      path.join(componentPath, "type.ts"),
      path.join(componentPath, "types.ts"),
      path.join(componentPath, `${componentName}.types.ts`),
      path.join(componentPath, "interface.ts"),
    ];

    const possibleIndexFiles = [
      path.join(componentPath, "index.tsx"),
      path.join(componentPath, `${componentName}.tsx`),
      path.join(componentPath, `${componentName}.jsx`),
    ];

    // 显示要尝试读取的文件
    console.error(`尝试查找类型文件:`);
    possibleTypeFiles.forEach((file) => console.error(` - ${file}`));
    console.error(`尝试查找组件文件:`);
    possibleIndexFiles.forEach((file) => console.error(` - ${file}`));

    // 尝试读取第一个存在的文件
    let typesContent = "// No types file found";
    for (const typeFile of possibleTypeFiles) {
      try {
        if (
          await fs
            .stat(typeFile)
            .then(() => true)
            .catch(() => false)
        ) {
          typesContent = await fs.readFile(typeFile, "utf-8");
          console.error(`成功读取类型文件: ${typeFile}`);
          break;
        }
      } catch (err) {
        // 继续尝试下一个文件
      }
    }

    let indexContent = "// No index file found";
    for (const indexFile of possibleIndexFiles) {
      try {
        if (
          await fs
            .stat(indexFile)
            .then(() => true)
            .catch(() => false)
        ) {
          indexContent = await fs.readFile(indexFile, "utf-8");
          console.error(`成功读取组件文件: ${indexFile}`);
          break;
        }
      } catch (err) {
        // 继续尝试下一个文件
      }
    }

    return {
      typesContent,
      indexContent,
      success:
        typesContent !== "// No types file found" ||
        indexContent !== "// No index file found",
      message: "Files read with best effort",
    };
  } catch (error) {
    console.error(`读取组件文件失败: ${(error as Error).message}`);
    return {
      typesContent: "",
      indexContent: "",
      success: false,
      message: `Error reading component files: ${(error as Error).message}`,
    };
  }
}

/**
 * 生成单元测试的提示词
 * @param componentName 组件名称
 * @param typesContent 类型文件内容
 * @param indexContent 组件文件内容
 */
export function generateTestPrompt(
  componentName: string,
  typesContent: string,
  indexContent: string
) {
  return `
Generate a comprehensive unit test for the ${componentName} component based on the following files:

Component implementation:
\`\`\`tsx
${indexContent.replace(/`/g, "\\`")}
\`\`\`

Type definitions:
\`\`\`ts
${typesContent.replace(/`/g, "\\`")}
\`\`\`

Requirements:
1. Use Jest and React Testing Library
2. Include a basic rendering test with snapshot
3. Test all component props and their effects
4. Test component behavior including user interactions
5. Test conditional rendering if applicable
6. Test callbacks/handlers if applicable
7. Cover edge cases and error states
8. Use appropriate React Testing Library queries (prefer user-centric queries)
9. Use userEvent for user interactions when applicable
10. Structure with describe blocks for logical grouping

The test should follow our standard format with imports at the top, followed by any mocks, and then the test cases.
`;
}

/**
 * 获取可用组件列表
 * @param componentsDir 组件目录
 */
export async function listComponents(componentsDir: string) {
  try {
    const components = await fs.readdir(componentsDir);
    return {
      components,
      success: true,
    };
  } catch (error) {
    return {
      components: [],
      success: false,
      message: `Error listing components: ${(error as Error).message}`,
    };
  }
}

/**
 * 运行CLI命令获取组件信息
 * @param command CLI命令
 */
export function runCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`执行命令失败: ${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`命令产生警告: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}
