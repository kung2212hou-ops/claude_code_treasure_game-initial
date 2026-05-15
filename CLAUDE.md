# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 命令

```bash
npm install           # 安裝依賴
npm run dev           # 同時啟動 Vite (port 5173) 與 Express server (port 3001)
npm run dev:client    # 僅啟動前端
npm run dev:server    # 僅啟動後端
npm run build         # 打包至 dist/ 目錄
```

無 TypeScript 型別檢查、lint、測試。

## 架構概覽

React + TypeScript + Vite 前端，加上 Node.js/Express 後端，構成全端專案。

**前端核心**:
- `src/App.tsx` — 所有遊戲邏輯（狀態、動畫、音效播放、分數存檔 API 呼叫）
- `src/components/AuthScreen.tsx` — 登入/註冊/訪客模式畫面
- `src/components/ui/` — Radix UI + Tailwind 通用元件庫（shadcn/ui 風格，40+ 元件）

**後端**:
- `server/index.js` — Express server，提供以下 API：
  - `POST /api/auth/signup` / `/api/auth/signin` — JWT 認證
  - `POST /api/scores` — 儲存分數（需 Bearer token）
  - `GET /api/scores/me` — 取得自己的歷史分數
- `server/db.js` — Node.js 內建 `node:sqlite`（`DatabaseSync`）操作，**非** better-sqlite3
- `server/game.db` — SQLite 資料庫檔案（tables: `users`, `scores`）

**遊戲流程**:
1. 未登入 → 顯示 `AuthScreen`（登入/註冊/訪客）
2. 認證後 → `App` 初始化遊戲（3 個箱子，隨機 1 個有寶藏）
3. 開箱 → 播放音效（`new Audio(...).play()`），更新分數
4. 遊戲結束 → 若已登入則 POST 分數至後端，顯示 Win/Loss/Tie
5. JWT token 與 user 存於 `localStorage`（key: `auth`）

**靜態資源**:
- `src/assets/` — 箱子圖片（closed, treasure, skeleton）與 key.png（滑鼠 cursor）
- `src/audios/` — `chest_open.mp3`（寶藏）、`chest_open_with_evil_laugh.mp3`（骷髏）

**動畫**: Framer Motion（`motion` 套件）處理翻轉、縮放、浮動 emoji。

**樣式**: Tailwind CSS，響應式（手機 flex-col，桌面 md:grid-cols-3）。

## 注意事項

- 路徑別名 `@` 對應 `src/`（定義於 vite.config.ts）
- `vite.config.ts` 中有大量版本化套件 alias，此為環境特有設定，勿移除
- 後端使用 Node.js v22+ 內建的 `node:sqlite`（`DatabaseSync`），非第三方 SQLite 套件
- `JWT_SECRET` 硬編碼於 `server/index.js`，僅供開發用途
- `src/results/key_hover.png`、`src/guidelines/Guidelines.md` 為非生產資源
