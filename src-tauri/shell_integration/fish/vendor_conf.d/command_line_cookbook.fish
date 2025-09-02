# Command Line Cookbook Shell Integration - Fish
# This script is loaded automatically via XDG_DATA_DIRS when running in Command Line Cookbook
# TODO this script may not be necessary owing to fish 4.0 having built in shell integration support? Look into this

# Only activate integration when running in Command Line Cookbook
if test "$TERM_PROGRAM" = "command-line-cookbook"
    
    # Clean up any old function names that might still be loaded
    # This helps when transitioning from the old "command-line-buddy" naming
    functions -e __cwb_postexec __cwb_preexec __cwb_initial_setup 2>/dev/null
    # Variable to track command execution state
    set -g __clc_command_executing false

    # Command completion - runs after command execution
    function __clc_postexec --on-event fish_postexec
        # CRITICAL: Capture exit status IMMEDIATELY as the very first operation
        # to prevent it from being overwritten by other operations
        set -l cmd_exit_code $status
        
        # The fish_postexec event receives the command line as the first argument
        set -l command_line $argv[1]
        
        # Debug: output to stderr to help diagnose issues
        # echo "Fish shell integration: Command '$command_line' finished with exit code $cmd_exit_code" >&2
        
        # Always emit command finished with exit code
        printf "\e]133;D;%s\a" $cmd_exit_code  # Command Finished with exit code
        
        # Reset the tracking variable
        set -g __clc_command_executing false
    end

    # Command start detection - runs when a command is about to be executed
    # This happens after the user has finished typing and pressed enter
    # The command text is available as the first argument
    function __clc_preexec --on-event fish_preexec
        set -l command $argv[1]

        # Command Start (after prompt, user has entered command)
        printf "\e]133;B\a"

        # Command Executed (right before output starts)
        # In fish, B and C happen very close together
        printf "\e]133;C\a"

        set -g __clc_command_executing true
    end

    # Handle prompt start and working directory updates
    function __clc_prompt --on-event fish_prompt
        # Update working directory
        printf "\e]7;file://%s%s\a" (hostname) $PWD

        # Prompt start - indicates the prompt is being displayed
        printf "\e]133;A\a"  # Prompt Start
    end
end
