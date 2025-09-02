# Command Line Cookbook Shell Integration - PowerShell
# This script provides shell integration for PowerShell when running in Command Line Cookbook

# Only activate integration when running in Command Line Cookbook
if ($env:TERM_PROGRAM -ne "command-line-cookbook") {
    return
}

# Prevent the script from running multiple times
if ($env:COMMAND_LINE_COOKBOOK_SHELL_INTEGRATION) {
    return
}

# Mark that shell integration is loaded
$env:COMMAND_LINE_COOKBOOK_SHELL_INTEGRATION = "1"

# Define escape sequences
$global:__clc_esc = [char]27
$global:__clc_bel = [char]7

# Variable to track command execution state
$global:__clc_command_executing = $false
$global:__clc_last_exit_code = 0

# Function to handle prompt start and working directory
function global:__clc_prompt_start {
    $hostName = $env:COMPUTERNAME
    $cwd = (Get-Location).Path
    
    # Update working directory (OSC 7)
    [Console]::Write("$global:__clc_esc]7;file://$hostName$cwd$global:__clc_bel")
    
    # Prompt start (OSC 133;A)
    [Console]::Write("$global:__clc_esc]133;A$global:__clc_bel")
}

# Function to handle command completion
function global:__clc_precmd {
    # Capture exit code
    $global:__clc_last_exit_code = if ($?) { 0 } else { if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } else { 1 } }
    
    # If we were executing a command, emit command finished
    if ($global:__clc_command_executing) {
        [Console]::Write("$global:__clc_esc]133;D;$($global:__clc_last_exit_code)$global:__clc_bel")
        $global:__clc_command_executing = $false
    }
}

# Command start detection - runs when a command is about to be executed
function global:__clc_preexec {
    param([string]$command)
    
    $global:__clc_command_executing = $true
}

# Command execution start - this runs right when output begins
function global:__clc_command_output_start {
    if ($global:__clc_command_executing) {
        [Console]::Write("$global:__clc_esc]133;C$global:__clc_bel")
    }
}

# Alternative approach: Hook into PowerShell's command execution pipeline
# This gets called right before command execution starts
$ExecutionContext.InvokeCommand.PreCommandLookupAction = {
    param($CommandName, $CommandLookupEventArgs)
    
    if ($global:__clc_command_executing) {
        # Emit C marker right before command execution
        [Console]::Write("$global:__clc_esc]133;C$global:__clc_bel")
    }
}

# Store the original prompt function if it exists
$global:__clc_original_prompt = $function:prompt

# Create our custom prompt function
function global:prompt {
    # Handle command completion first
    __clc_precmd
    
    # Handle prompt start
    __clc_prompt_start
    
    # Call the original prompt function or use a default
    if ($global:__clc_original_prompt) {
        $originalPrompt = & $global:__clc_original_prompt
    } else {
        # Default PowerShell prompt
        $originalPrompt = "PS $($PWD.Path)> "
    }
    
    # Emit command start marker (OSC 133;B) right after the prompt
    [Console]::Write("$global:__clc_esc]133;B$global:__clc_bel")
    
    return $originalPrompt
}

# Set up PSReadLine integration for command execution detection
if (Get-Module -ListAvailable -Name PSReadLine) {
    Import-Module PSReadLine
    
    # Use PSReadLine's key handler system instead of overriding functions
    # This is safer and more compatible
    Set-PSReadLineKeyHandler -Key Enter -ScriptBlock {
        # Get the current command line
        $line = $null
        $cursor = $null
        [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$line, [ref]$cursor)
        
        # Mark that a command is about to execute
        __clc_preexec $line
        
        # Execute the normal Enter behavior first
        [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
        
        # Don't emit C marker here - it's too early!
        # The C marker should be emitted when command output actually starts
        # For now, we'll rely on a different approach or timing
    }
}

# Note: For PowerShell versions without PSReadLine, the integration will still work
# but command detection may be less reliable. PSReadLine is recommended for best results.


