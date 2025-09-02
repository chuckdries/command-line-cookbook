# Command Line Cookbook Shell Integration - Zsh
# This script provides shell integration for zsh when running in Command Line Cookbook

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

# Preserve user's original HISTFILE if ZDOTDIR was changed
if [[ -n "$USER_ZDOTDIR" && "$ZDOTDIR" != "$USER_ZDOTDIR" ]]; then
    # Restore HISTFILE to user's original location to avoid separate history per session
    if [[ -z "$HISTFILE" ]]; then
        export HISTFILE="$USER_ZDOTDIR/.zsh_history"
    fi
fi

# Enable comments in interactive mode (needed for code blocks with comments)
setopt interactive_comments

# Disable history expansion to prevent issues with ! characters in commands
setopt no_bang_hist

# Disable the percent sign that appears when there's no trailing newline
setopt nopromptsp

# Load zsh hook system
autoload -Uz add-zsh-hook

# Variable to track command execution state
typeset -g __clb_command_executing=false

# Function to handle command completion - runs after command execution
__clb_precmd() {
    local ec=$?

    # If we were executing a command, emit command finished
    if [[ "$__clb_command_executing" == true ]]; then
        printf '\e]133;D;%s\a' "$ec"  # Command Finished with exit code
        __clb_command_executing=false
    fi

    # Update working directory
    printf '\e]7;file://%s%s\a' "$HOST" "$PWD"
}

# Command start detection - runs when a command is about to be executed
# This happens after the user has finished typing and pressed enter
# The first argument contains the command text
__clb_preexec() {
    local command="$1"

    __clb_command_executing=true
}

# Command execution start - this is called right when the command begins executing
# In zsh, we can use the preexec hook's timing to emit both B and C in sequence
__clb_command_exec() {
    if [[ "$__clb_command_executing" == true ]]; then
        # Command Executed (right before output starts)
        printf '\e]133;C\a'
    fi
}

# We need to hook into the right moment for C
# Create a combined preexec that handles C (B is now in the prompt)
__clb_preexec_combined() {
    local command="$1"

    # Command Executed (right before output starts)
    # B marker is now in the prompt, so we just send C when command executes
    printf '\e]133;C\a'

    __clb_command_executing=true
}

# Register the hooks
add-zsh-hook precmd __clb_precmd
add-zsh-hook preexec __clb_preexec_combined

# Modify the prompt to include OSC 133 integration
# We need to use prompt expansion to inject the sequences at the right time
if [[ -z "$__clb_original_ps1" ]]; then
    __clb_original_ps1="$PS1"
fi

# Set up the prompt with OSC 133 integration
# A - Prompt start, then prompt, then B - Command start
# %{...%} tells zsh that the content doesn't take up space on the line
PS1=$'%{\e]133;A\a%}'"$__clb_original_ps1"$'%{\e]133;B\a%}'
