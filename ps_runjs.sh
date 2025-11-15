#!/bin/bash

# ps_run_debug.sh - 调试版本（支持任意Photoshop版本）
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

# 方法3: 使用find命令搜索Photoshop
find_photoshop_app() {
    echo "Searching for Photoshop using find command..."
    
    # 使用find命令搜索Applications目录
    local found_apps=$(find /Applications -name "Adobe Photoshop*.app" -type d -maxdepth 3 2>/dev/null)
    
    if [ -z "$found_apps" ]; then
        echo "No Photoshop apps found in /Applications/"
        return 1
    fi
    
    echo "Found Photoshop applications:"
    echo "$found_apps"
    
    # 优先选择正在运行的版本
    while IFS= read -r app_path; do
        if [ -n "$app_path" ] && [ -d "$app_path" ]; then
            local app_name=$(basename "$app_path" .app)
            if pgrep -f "$app_name" > /dev/null; then
                echo "Found running Photoshop: $app_path"
                echo "$app_path"
                return 0
            fi
        fi
    done <<< "$found_apps"
    
    # 如果没有运行的，返回第一个找到的
    local first_app=$(echo "$found_apps" | head -1)
    if [ -n "$first_app" ] && [ -d "$first_app" ]; then
        echo "Using first found Photoshop: $first_app"
        echo "$first_app"
        return 0
    fi
    
    return 1
}

# 获取 Photoshop 应用路径
photoshop_app=$(find_photoshop_app)

if [ -z "$photoshop_app" ]; then
    echo "Error: Could not find Adobe Photoshop installation"
    echo "Please check if Photoshop is installed in /Applications/"
    exit 1
fi

echo "Final selection: $photoshop_app"

# 提取应用名称用于 AppleScript
app_name=$(basename "$photoshop_app" .app)

# 首先检查 Photoshop 是否运行
if ! pgrep -f "$app_name" > /dev/null; then
    echo "Warning: Adobe Photoshop is not running. Starting it now..."
    open -a "$photoshop_app"
    # 等待Photoshop启动
    echo "Waiting for Photoshop to start..."
    sleep 10
fi

# 尝试执行
echo "Executing Photoshop script in $app_name..."
osascript <<EOF
tell application "$app_name"
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