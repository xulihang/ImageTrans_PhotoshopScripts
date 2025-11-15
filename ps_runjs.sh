#!/bin/bash

# ps_run_debug.sh - 调试版本
# 用法: ./ps_run_debug.sh "/path/to/script.jsx" ["/output/path"]

if [ $# -lt 1 ]; then
    echo "Usage: $0 path_to_jsx [output_path]"
    exit 1
fi

jsxPath="$1"
outputPath=""

if [ $# -eq 2 ]; then
    outputPath="$2"
fi

# 获取绝对路径
jsxPath=$(greadlink -f "$jsxPath" 2>/dev/null || readlink -f "$jsxPath" 2>/dev/null || echo "$jsxPath")
if [[ "$jsxPath" != /* ]]; then
    jsxPath="$(pwd)/$jsxPath"
fi

jsxFolder=$(dirname "$jsxPath")

echo "Debug: jsxPath = $jsxPath"
echo "Debug: jsxFolder = $jsxFolder"
echo "Debug: outputPath = $outputPath"

# 检查文件是否存在
if [ ! -f "$jsxPath" ]; then
    echo "Error: JSX file not found: $jsxPath"
    exit 1
fi

# 创建临时文件
temp_jsx=$(mktemp "/tmp/ps_script_$$.jsx")
echo "Debug: temp_jsx = $temp_jsx"

# 读取原始文件
code=$(cat "$jsxPath")

# 基本路径设置代码
pathCode="// Script started
var jsRoot = new Folder('$jsxFolder');
jsRoot.changePath();
$.writeln('Current folder: ' + jsRoot.fsName);
"

# 替换 outputPath
if [ -n "$outputPath" ]; then
    code=$(echo "$code" | sed "s|outputPath = \"\"|outputPath = \"$outputPath\"|g")
    code=$(echo "$code" | sed "s|inputFolder = \"\"|inputFolder = \"$outputPath\"|g")
fi

code=$(echo "$code" | sed "s|#include \"|#include \"$jsxFolder/|g")

# 组合代码
finalCode="$pathCode
$code"

# 写入临时文件
echo "$finalCode" > "$temp_jsx"

echo "=== JavaScript Code ==="
cat "$temp_jsx"
echo "=== End JavaScript Code ==="

# 首先检查 Photoshop 是否运行
if ! pgrep -x "Adobe Photoshop" > /dev/null; then
    echo "Warning: Adobe Photoshop is not running. Starting it now..."
    open -a "Adobe Photoshop"
    sleep 5
fi

# 尝试执行
echo "Executing Photoshop script..."
osascript <<EOF
tell application "Adobe Photoshop 2025"
    activate
    try
        do javascript "#include '$temp_jsx'"
        display dialog "Script executed successfully" buttons {"OK"} default button 1
    on error errMsg
        display dialog "Error: " & errMsg buttons {"OK"} default button 1
    end try
end tell
EOF

# 清理
rm -f "$temp_jsx"