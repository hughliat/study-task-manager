# 学有计划

这是中文学习任务管理器，使用零依赖 HTML/CSS/JavaScript 与 localStorage。项目入口 index.html，业务逻辑 src/tasks.js，界面 src/app.js，样式 src/styles.css。

## 运行与验证
- Node.js 20+；无需 npm install。
- `npm start`：本地服务 http://127.0.0.1:4178。
- `npm test`：Node 内置测试；无需构建。
- 服务只公开页面所需的四个文件，不公开本地文档和规则。

## 项目约定
- 所有用户输入用 textContent 展示，避免 HTML 注入。
- 本地保存失败应告知用户，不宣称已保存；损坏数据不得静默覆盖。
- 先保持小型 MVP，新增框架、服务端、账号与第三方资源前重新评估实际需求。
- 代码提交与 GitHub 发布前核对 .gitignore、拟提交文件和实际测试结果。
- Qoder 可使用 programming-squad:start-squad 或 start-github-project 继续迭代。真实调用与检查结果要留痕，不伪造多智能体执行。
- 当前只完成本地开发，未授权具体 GitHub 仓库和可见性，尚未远端发布。
