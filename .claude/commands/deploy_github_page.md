將此專案部署到 GitHub Pages。依序執行以下步驟，任何步驟失敗時立即停止並告知用戶原因與解決方式。

---

## Phase 1 — 確認工具已安裝

執行 `gh --version` 檢查 GitHub CLI：
- 若指令不存在，告知用戶安裝方式後停止：
  - Windows: `winget install GitHub.cli`
  - Mac: `brew install gh`
  - 安裝後重新開啟終端機，再執行 `/deploy_github_page`

執行 `git --version` 確認 Git 已安裝；若無則告知安裝後停止。

---

## Phase 2 — GitHub 帳號驗證

執行 `gh auth status`：

**若未登入**，告知用戶：
```
尚未登入 GitHub。請選擇：

A) 已有 GitHub 帳號：
   在終端機輸入 ! gh auth login
   依照互動提示選擇 GitHub.com > HTTPS > Login with web browser，完成後重新執行 /deploy_github_page

B) 尚無 GitHub 帳號：
   前往 https://github.com/signup 建立免費帳號
   完成後執行 ! gh auth login，再重新執行 /deploy_github_page
```
然後停止，等待用戶完成。

**若已登入**，執行 `gh api user --jq .login` 取得 GITHUB_USER，記住此值供後續使用。

---

## Phase 3 — Git 初始化

檢查目前目錄是否存在 `.git`（執行 `git rev-parse --git-dir`）：

若尚未初始化：
```bash
git init
git add .
git commit -m "Initial commit"
```

若已初始化，確認是否有未提交的變更（`git status --porcelain`）；若有，先 `git add .` 並 `git commit -m "chore: prepare for GitHub Pages deployment"`。

---

## Phase 4 — 建立或確認 GitHub Repo

執行 `git remote get-url origin` 確認是否已有 remote：

**若無 remote**（新專案）：
1. 使用當前目錄名稱作為 repo 名稱（`basename $(pwd)` 或 PowerShell: `Split-Path -Leaf (Get-Location)`）
2. 自動執行：
   ```bash
   gh repo create <repo-name> --public --source=. --remote=origin
   ```
   告知用戶：「已在 GitHub 建立 public repo：https://github.com/<GITHUB_USER>/<repo-name>」

**若已有 remote**：跳過建立，直接讀取 repo 名稱。

從 remote URL 解析出 REPO_NAME（URL 格式為 `https://github.com/USER/REPO.git` 或 `git@github.com:USER/REPO.git`）。

---

## Phase 5 — 設定 GitHub Pages

### 5a. 更新 vite.config.ts

在 `vite.config.ts` 的 `defineConfig({` 內加入 `base: '/<REPO_NAME>/'`，位置在 `plugins:` 之前：

```typescript
export default defineConfig({
  base: '/<REPO_NAME>/',   // <-- 加入此行，替換 <REPO_NAME> 為實際名稱
  plugins: [react()],
  ...
```

### 5b. 建立 GitHub Actions Workflow

建立檔案 `.github/workflows/deploy.yml`，內容如下（將 `main` 替換為實際預設分支名稱）：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

### 5c. 提交設定變更

```bash
git add vite.config.ts .github/workflows/deploy.yml
git commit -m "chore: configure GitHub Pages deployment"
```

---

## Phase 6 — 推送並完成部署

取得目前分支名稱：`git branch --show-current`

推送：
```bash
git push -u origin <branch-name>
```

若推送失敗（遠端有新提交），先 `git pull --rebase origin <branch-name>` 再重新推送。

---

## Phase 7 — 顯示結果

告知用戶：

```
部署完成！

GitHub Repo（程式碼）：
  https://github.com/<GITHUB_USER>/<REPO_NAME>

GitHub Pages（遊戲前端，約 1-2 分鐘後生效）：
  https://<GITHUB_USER>.github.io/<REPO_NAME>

查看部署進度：
  https://github.com/<GITHUB_USER>/<REPO_NAME>/actions

注意：此版本為純前端，登入與分數記錄功能無法使用（後端不在 GitHub Pages 上）。
訪客模式可正常遊玩。
```
