import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import mcpServerInstance from "./mcpServerInstance.js";

// 设置启动消息
console.error("Starting Unit Test Generator MCP Server...");

async function main() {
  try {
    // 输出服务器状态信息
    console.error("MCP Server starting...");

    const transport = new StdioServerTransport();
    await mcpServerInstance.connect(transport);
    console.error("MCP Server running on stdio");
  } catch (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
  }
}

// 处理退出信号
process.on("SIGINT", () => {
  console.error("Received SIGINT, shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("Received SIGTERM, shutting down...");
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
