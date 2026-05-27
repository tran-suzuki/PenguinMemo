@echo off
setlocal

rem ============================================================
rem  PenguinMemo - デバッグ起動 (Electron + Vite 開発モード)
rem  ホットリロード付きで Electron アプリを起動します。
rem  終了するには Electron ウィンドウを閉じるか Ctrl+C を押します。
rem ============================================================

cd /d "%~dp0"

echo [PenguinMemo] デバッグ起動を開始します...
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

echo [PenguinMemo] 開発サーバーと Electron を起動します (electron:dev)...
echo.
call npm run electron:dev

if errorlevel 1 (
    echo.
    echo [PenguinMemo] 起動中にエラーが発生しました。
    pause
    exit /b 1
)

endlocal
