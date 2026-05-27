@echo off
setlocal

rem ============================================================
rem  PenguinMemo - リリースビルド (Windows インストーラ作成)
rem  vite build + electron-builder を実行し、release\ に
rem  NSIS インストーラを出力します。
rem ============================================================

cd /d "%~dp0"

echo [PenguinMemo] リリースビルドを開始します...
echo.

rem 依存パッケージが未インストールなら自動でインストール
if not exist "node_modules" (
    echo [PenguinMemo] node_modules が見つかりません。依存パッケージをインストールします...
    call npm install
    if errorlevel 1 (
        echo.
        echo [PenguinMemo] npm install に失敗しました。
        pause
        exit /b 1
    )
)

echo [PenguinMemo] ビルドを実行します (electron:build)...
echo.
call npm run electron:build

if errorlevel 1 (
    echo.
    echo [PenguinMemo] ビルドに失敗しました。
    pause
    exit /b 1
)

echo.
echo [PenguinMemo] ビルドが完了しました。
echo [PenguinMemo] 出力先: "%~dp0release"
echo.

rem 出力フォルダをエクスプローラで開く
if exist "%~dp0release" (
    start "" explorer "%~dp0release"
)

pause
endlocal
