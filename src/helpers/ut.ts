import { promises as fs } from "fs";
import path from "path";

import { DependentComponent } from "../types/ut.js";

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

    // 根据标准结构构建文件路径
    const typeFile = path.join(componentPath, "type.ts");
    const indexFile = path.join(componentPath, "index.tsx");

    // 显示要尝试读取的文件
    console.error(`尝试读取类型文件: ${typeFile}`);
    console.error(`尝试读取组件文件: ${indexFile}`);

    // 读取文件内容
    let typesContent;
    let indexContent;

    try {
      typesContent = await fs.readFile(typeFile, "utf-8");
      console.error(`成功读取类型文件: ${typeFile}`);
    } catch (err) {
      console.error(`无法读取类型文件: ${typeFile}`);
      typesContent = "// No types file found";
    }

    try {
      indexContent = await fs.readFile(indexFile, "utf-8");
      console.error(`成功读取组件文件: ${indexFile}`);
    } catch (err) {
      console.error(`无法读取组件文件: ${indexFile}`);
      indexContent = "// No index file found";
    }

    const success =
      typesContent !== "// No types file found" ||
      indexContent !== "// No index file found";

    return {
      typesContent,
      indexContent,
      success,
      message: success ? "Files have been read" : "Files not found",
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
 * 从组件代码中提取引用的其他组件
 * @param indexContent 组件文件内容
 */
export function extractComponentDependencies(indexContent: string): string[] {
  /**
   * 匹配各种可能的组件导入语句
   * 1. 匹配相对路径中的组件导入 eg. from '../Button'
   * 2. 匹配从 components 目录直接导入的组件 eg. from '@/components/Button'
   */
  const componentsImportRegex = /from\s+['"]@\/components\/([^'"\/]+)['"]/g;

  const dependencies = new Set<string>();

  // 提取相对路径导入
  let match;

  // 提取组件目录导入
  while ((match = componentsImportRegex.exec(indexContent)) !== null) {
    if (match[1]) dependencies.add(match[1]);
  }

  console.error(`找到依赖组件: ${Array.from(dependencies).join(", ")}`);
  return Array.from(dependencies);
}

/**
 * 获取依赖组件的类型文件内容
 * @param dependencies 依赖的组件名称数组
 * @param componentsPath 组件根目录路径
 */
export async function getDependentComponentTypes(
  dependencies: string[],
  componentsPath: string
): Promise<DependentComponent[]> {
  const results = [];

  for (const dependency of dependencies) {
    try {
      const dependencyPath = path.join(componentsPath, dependency);
      const typeFile = path.join(dependencyPath, "type.ts");

      console.error(`尝试读取依赖组件类型文件: ${typeFile}`);

      try {
        const typesContent = await fs.readFile(typeFile, "utf-8");
        console.error(`成功读取依赖组件类型文件: ${typeFile}`);
        results.push({
          componentName: dependency,
          typesContent,
        });
      } catch (err) {
        console.error(`无法读取依赖组件类型文件: ${typeFile}`);
      }
    } catch (error) {
      console.error(
        `处理依赖组件失败: ${dependency}, ${(error as Error).message}`
      );
    }
  }

  return results;
}

/**
 * 生成单元测试的提示词
 * @param componentName 组件名称
 * @param indexContent 组件文件内容
 * @param dependentComponents 依赖组件的类型定义
 */
export function generateTestPrompt(
  componentName: string,
  dependentTypes: DependentComponent[] = []
) {
  let dependentTypesSection = "";

  // 如果有依赖组件，添加依赖组件的类型定义部分
  if (dependentTypes.length > 0) {
    dependentTypesSection = `
Dependent Component Type Definitions:
${dependentTypes
  .map(
    (dep) => `
Component: ${dep.componentName}
\`\`\`ts
${dep.typesContent.replace(/`/g, "\\`")}
\`\`\`
`
  )
  .join("\n")}

Please ensure the unit tests properly handle these component dependencies.
`;
  }

  return `
Generate a comprehensive unit test for the ${componentName} component.
${dependentTypesSection}

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
The test file should be added in __test__/index.test.tsx.
`;
}
