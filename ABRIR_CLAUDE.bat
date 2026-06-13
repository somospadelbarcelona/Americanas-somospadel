@echo off
set "PROJECT_DIR=%~dp0"
set "CLAUDE_CODE_GIT_BASH_PATH=%PROJECT_DIR%git_portable\usr\bin\bash.exe"
"%PROJECT_DIR%node_portable\node-v24.14.1-win-x64\node.exe" "%PROJECT_DIR%node_modules\@anthropic-ai\claude-code\cli.js" %*
