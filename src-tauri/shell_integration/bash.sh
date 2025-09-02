# Command Line Cookbook Shell Integration - Bash
# This script provides shell integration for bash when running in Command Line Cookbook

# Only activate integration when running in Command Line Cookbook
if [[ "$TERM_PROGRAM" != "command-line-cookbook" ]]; then
  return
fi

# Prevent the script from running multiple times
if [[ -n "$COMMAND_LINE_COOKBOOK_SHELL_INTEGRATION" ]]; then
  return
fi

# Mark that shell integration is loaded
COMMAND_LINE_COOKBOOK_SHELL_INTEGRATION=1

# Disable history expansion to prevent issues with ! characters in commands
set +H

# Ensure the prompt emits the OSC 133;B (Prompt End) marker right after PS1
# so that terminals can reliably detect the end of the prompt before user input.
# Avoid duplicating the marker if PS1 is later customized.
if [[ -z "$__CLC_PS1_MODIFIED" ]]; then
  __CLC_PS1_MODIFIED=1
  __clc_original_ps1="${PS1-}"
  if [[ "$PS1" != *'\e]133;B'* ]]; then
    PS1="${PS1}\[\e]133;B\a\]"
  fi
fi

# Variable to track command execution state
__clc_last_exit_code=0
__clc_command_executing=false
__clc_in_debug_trap=false

# Store the exit code immediately after command execution
__clc_store_exit_code() {
  __clc_last_exit_code=$?
}

# Function to handle prompt start and working directory
__clc_prompt_start() {
  # Update working directory
  printf "\e]7;file://%s%s\a" "$HOSTNAME" "$PWD"

  # Prompt start
  printf "\e]133;A\a"  # Prompt Start
}

# Command start detection - runs right before command execution
# This is called by the DEBUG trap with the command as argument
__clc_preexec() {
  local command="$1"

  if [[ "$__clc_command_executing" == false ]]; then
    # Mark that a command is about to execute
    __clc_command_executing=true
  fi
}

# Command execution start - this runs right when output begins
# We use a wrapper approach since bash doesn't have a direct hook for this
__clc_command_output_start() {
  if [[ "$__clc_command_executing" == true ]]; then
    printf "\e]133;C\a"  # Command Executed (right before output)
  fi
}

# Function to handle command completion
__clc_precmd() {
  # Capture exit code first
  __clc_store_exit_code
  
  # If we were executing a command, emit command finished
  if [[ "$__clc_command_executing" == true ]]; then
    printf "\e]133;D;%s\a" "$__clc_last_exit_code"  # Command Finished with exit code
    __clc_command_executing=false
  fi
}

# Set up DEBUG trap for command start detection
# The DEBUG trap provides the command text as BASH_COMMAND
__clc_debug_trap() {
  # Skip if we're already in a trap to avoid recursion
  if [[ "$__clc_in_debug_trap" == true ]]; then
    return
  fi

  __clc_in_debug_trap=true

  # Only process user commands (skip internal functions and prompts)
  if [[ "$BASH_COMMAND" != __clc_* && \
        "$BASH_COMMAND" != *"printf"* && \
        "$BASH_COMMAND" != "return" && \
        "$BASH_COMMAND" != *"PROMPT_COMMAND"* && \
        "$BASH_COMMAND" != *"trap"* ]]; then
    __clc_preexec "$BASH_COMMAND"

    # Emit C marker right after B for command execution start
    # In bash, these happen very close together
    __clc_command_output_start
  fi

  __clc_in_debug_trap=false
}

# Set the DEBUG trap
trap '__clc_debug_trap' DEBUG

# Set prompt command with exit code capture and prompt/completion handling
PROMPT_COMMAND="__clc_precmd; __clc_prompt_start"
