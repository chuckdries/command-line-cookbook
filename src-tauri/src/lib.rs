use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use std::{
    io::{BufRead, BufReader, Read, Write},
    process::{exit, Command},
    sync::Arc,
    thread::{self},
};
use tauri::{async_runtime::Mutex as AsyncMutex, State, Manager};
use tauri::path::{BaseDirectory};
#[cfg(not(target_os = "windows"))]
use users::{get_current_uid, get_user_by_uid, os::unix::UserExt};

struct AppState {
    pty_pair: Arc<AsyncMutex<PtyPair>>,
    writer: Arc<AsyncMutex<Box<dyn Write + Send>>>,
    reader: Arc<AsyncMutex<BufReader<Box<dyn Read + Send>>>>,
    shell_created: Arc<AsyncMutex<bool>>,
}

#[cfg(not(target_os = "windows"))]
fn get_fish_integration_path(handle: tauri::AppHandle) -> Result<String, Box<dyn std::error::Error>> {
    // The fish integration files are now bundled under shell_integration/
    // This path will contain shell_integration/fish/vendor_conf.d/command_line_cookbook.fish
    // But XDG_DATA_DIRS needs to point to the directory that contains fish/vendor_conf.d/
    // So we point to shell_integration/ which contains the fish/ subdirectory
    let shell_integration_dir = handle.path().resolve("shell_integration", BaseDirectory::Resource)?;
    Ok(shell_integration_dir.to_string_lossy().to_string())
}

#[cfg(target_os = "windows")]
fn load_powershell_integration_script() -> Result<String, Box<dyn std::error::Error>> {
    // Get the directory where our application is running from
    let exe_path = std::env::current_exe()?;
    let exe_dir = exe_path
        .parent()
        .ok_or("Could not get executable directory")?;

    // The PowerShell integration file is in shell_integration/powershell.ps1
    let integration_path = exe_dir.join("shell_integration").join("powershell.ps1");
    
    // Read the PowerShell integration script
    let script = std::fs::read_to_string(integration_path)?;
    
    // Use Windows CRLF newlines to be safe and append a final blank line to execute
    Ok(script.replace("\n", "\r\n") + "\r\n")
}

#[tauri::command]
// create a shell and add to it the $TERM env variable so we can use clear and other commands
async fn async_create_shell(handle: tauri::AppHandle,state: State<'_, AppState>) -> Result<(), String> {
    // Check if shell has already been created
    let mut shell_created = state.shell_created.lock().await;
    if *shell_created {
        return Ok(());
    }

    #[cfg(target_os = "windows")]
    let cmd = {
        // Create a temporary PowerShell profile that loads our integration
        let script = load_powershell_integration_script()
            .map_err(|e| format!("Failed to load PowerShell integration script: {}", e))?;
        
        let temp_dir = std::env::temp_dir().join("command-line-cookbook-powershell");
        let _ = std::fs::create_dir_all(&temp_dir);
        let temp_profile = temp_dir.join("Microsoft.PowerShell_profile.ps1");
        
        // Write the integration script directly as the profile
        // This way it gets loaded automatically when PowerShell starts
        std::fs::write(&temp_profile, script)
            .map_err(|e| format!("Failed to write PowerShell profile: {}", e))?;
        
        // Start PowerShell with a custom profile path
        let mut cmd = CommandBuilder::new("powershell.exe");
        cmd.arg("-NoLogo");  // Don't show the PowerShell banner
        // Set a custom profile path that points to our integration script
        cmd.env("USERPROFILE", temp_dir.to_string_lossy().to_string());
        cmd.env("TERM", "cygwin");
        // Set our terminal program identifier for shell integration
        cmd.env("TERM_PROGRAM", "command-line-cookbook");
        
        cmd
    };

    #[cfg(not(target_os = "windows"))]
    let (mut cmd, shell_path_string) = {
        // Get the current user's default shell
        let user = get_user_by_uid(get_current_uid()).unwrap();
        let shell = user.shell().to_str().unwrap_or("/bin/bash");
        let shell_path_string = shell.to_string();
        let mut cmd = CommandBuilder::new(shell_path_string.as_str());
        cmd.env("TERM", "xterm-256color");
        // Set our terminal program identifier for shell integration
        cmd.env("TERM_PROGRAM", "command-line-cookbook");
        (cmd, shell_path_string)
    };

    #[cfg(not(target_os = "windows"))]
    {
        // For zsh, use ZDOTDIR approach like VS Code
        if shell_path_string.contains("zsh") {
            let temp_dir = std::env::temp_dir().join("command-line-cookbook-zsh");
            let _ = std::fs::create_dir_all(&temp_dir);

            // Get user's original ZDOTDIR or home directory
            let user_zdotdir = std::env::var("ZDOTDIR").unwrap_or_else(|_| {
                std::env::var("HOME").unwrap_or_else(|_| "/".to_string())
            });

            // Create temporary .zshrc that sources user's config and our integration
            let temp_zshrc = temp_dir.join(".zshrc");
            let integration_path = handle.path().resolve("shell_integration/zsh.sh", BaseDirectory::Resource)
                .map_err(|e| e.to_string())?;

            let zshrc_content = format!(
                "# Command Line Cookbook temporary zshrc\n\
                    USER_ZDOTDIR='{}'\n\
                    ZDOTDIR='{}'\n\
                    \n\
                    # Source user's original .zshrc if it exists\n\
                    if [[ -f \"$USER_ZDOTDIR/.zshrc\" ]]; then\n\
                        source \"$USER_ZDOTDIR/.zshrc\"\n\
                    fi\n\
                    \n\
                    # Load Command Line Cookbook shell integration\n\
                    if [[ -f '{}' ]]; then\n\
                        source '{}'\n\
                    fi\n",
                user_zdotdir,
                temp_dir.display(),
                integration_path.display(),
                integration_path.display()
            );

            if std::fs::write(&temp_zshrc, zshrc_content).is_ok() {
                cmd.env("ZDOTDIR", temp_dir);
                cmd.env("USER_ZDOTDIR", user_zdotdir);
            }
        }

        // For bash, set up integration via environment variable like VS Code does
        if shell_path_string.contains("bash") {
            let integration_path = handle.path().resolve("shell_integration/bash.sh", BaseDirectory::Resource)
                .map_err(|e| e.to_string())?;

            println!("integration_path: {}", integration_path.to_string_lossy().to_string());

            if integration_path.exists() {
                // Set the path to our bash integration script
                cmd.env(
                    "COMMAND_LINE_COOKBOOK_SHELL_INTEGRATION_SCRIPT",
                    integration_path,
                );

                // Also set BASH_ENV to auto-source our integration
                // BASH_ENV is sourced for non-interactive shells, but we'll use a wrapper
                let temp_dir = std::env::temp_dir().join("command-line-cookbook-bash");
                let _ = std::fs::create_dir_all(&temp_dir);

                let temp_bashrc = temp_dir.join("bashrc");
                let bashrc_content = format!(
                    "# Command Line Cookbook bash integration loader\n\
                    # Load user's bashrc first if it exists\n\
                    if [[ -f \"$HOME/.bashrc\" && \"$HOME/.bashrc\" != \"{}\" ]]; then\n\
                        source \"$HOME/.bashrc\"\n\
                    fi\n\
                    \n\
                    # Load Command Line Cookbook shell integration if running in our terminal\n\
                    if [[ \"$TERM_PROGRAM\" == \"command-line-cookbook\" && -n \"$COMMAND_LINE_COOKBOOK_SHELL_INTEGRATION_SCRIPT\" ]]; then\n\
                        source \"$COMMAND_LINE_COOKBOOK_SHELL_INTEGRATION_SCRIPT\"\n\
                    fi\n",
                    temp_bashrc.display()
                );

                if std::fs::write(&temp_bashrc, bashrc_content).is_ok() {
                    // Use --rcfile to load our custom bashrc that includes the integration
                    cmd.arg("--rcfile");
                    cmd.arg(temp_bashrc);
                }
            }
        }

        // For Fish, set up integration via XDG_DATA_DIRS like VS Code does
        // Note: Fish 4.0+ has built-in OSC support, but it may not be fully compatible with our implementation
        if shell_path_string.contains("fish") {
            if let Ok(app_dir) = get_fish_integration_path(handle) {
                // Get existing XDG_DATA_DIRS or use default
                let existing_xdg = std::env::var("XDG_DATA_DIRS")
                    .unwrap_or_else(|_| "/usr/local/share:/usr/share".to_string());

                // Prepend our app directory to XDG_DATA_DIRS
                // Fish will look for fish/vendor_conf.d/ in this directory
                let new_xdg = format!("{}:{}", app_dir, existing_xdg);
                cmd.env("XDG_DATA_DIRS", new_xdg);
            }
        }
    }

    let mut child = state
        .pty_pair
        .lock()
        .await
        .slave
        .spawn_command(cmd)
        .map_err(|err| err.to_string())?;

    #[cfg(target_os = "windows")]
    {
        // Create a temporary PowerShell script file
        let script = load_powershell_integration_script()
            .map_err(|e| format!("Failed to load PowerShell integration script: {}", e))?;
        
        let temp_dir = std::env::temp_dir().join("command-line-cookbook-powershell");
        let _ = std::fs::create_dir_all(&temp_dir);
        let temp_script = temp_dir.join("integration.ps1");
        
        // Write the script to the temporary file
        std::fs::write(&temp_script, script)
            .map_err(|e| format!("Failed to write PowerShell integration script: {}", e))?;
        
        // Wait a moment for PowerShell to start, then inject the command to source the script
        std::thread::sleep(std::time::Duration::from_millis(100));
        
        let mut writer = state.writer.lock().await;
        // Use a command that sources the script silently
        let source_command = format!("& '{}'\r\n", temp_script.display());
        let _ = writer.write_all(source_command.as_bytes());
        let _ = writer.flush();
    }

    // Mark shell as created before spawning the thread
    *shell_created = true;

    thread::spawn(move || {
        let status = child.wait().unwrap();
        exit(status.exit_code() as i32)
    });
    Ok(())
}

#[tauri::command]
async fn async_write_to_pty(data: &str, state: State<'_, AppState>) -> Result<(), ()> {
    write!(state.writer.lock().await, "{}", data).map_err(|_| ())
}

#[tauri::command]
async fn async_read_from_pty(state: State<'_, AppState>) -> Result<Option<String>, ()> {
    let mut reader = state.reader.lock().await;
    let data = {
        // Read all available text
        let data = reader.fill_buf().map_err(|_| ())?;

        // Send te data to the webview if necessary
        if data.len() > 0 {
            std::str::from_utf8(data)
                .map(|v| Some(v.to_string()))
                .map_err(|_| ())?
        } else {
            None
        }
    };

    if let Some(data) = &data {
        reader.consume(data.len());
    }

    Ok(data)
}

#[tauri::command]
async fn async_resize_pty(rows: u16, cols: u16, state: State<'_, AppState>) -> Result<(), ()> {
    state
        .pty_pair
        .lock()
        .await
        .master
        .resize(PtySize {
            rows,
            cols,
            ..Default::default()
        })
        .map_err(|_| ())
}

#[tauri::command]
async fn check_binary_exists(binary_name: String) -> Result<bool, String> {
    // Sanitize and validate binary name to prevent command injection
    let sanitized_binary = sanitize_binary_name(&binary_name)?;

    // Use different commands based on the operating system
    let (cmd, args) = if cfg!(target_os = "windows") {
        ("where", vec![sanitized_binary.as_str()])
    } else {
        ("which", vec![sanitized_binary.as_str()])
    };

    match Command::new(cmd).args(&args).output() {
        Ok(output) => {
            // Command succeeded if exit status is 0 and there's output
            Ok(output.status.success() && !output.stdout.is_empty())
        }
        Err(_) => {
            // If the which/where command itself fails, assume binary doesn't exist
            Ok(false)
        }
    }
}

/// Sanitizes binary name to prevent command injection attacks
pub fn sanitize_binary_name(binary_name: &str) -> Result<String, String> {
    let trimmed = binary_name.trim();

    // Reject empty or overly long binary names
    if trimmed.is_empty() {
        return Err("Binary name cannot be empty".to_string());
    }

    if trimmed.len() > 255 {
        return Err("Binary name is too long".to_string());
    }

    // Only allow alphanumeric characters, hyphens, underscores, and dots
    // This prevents command injection via semicolons, pipes, etc.
    for ch in trimmed.chars() {
        if !ch.is_alphanumeric() && ch != '-' && ch != '_' && ch != '.' {
            return Err(format!("Binary name contains invalid character: '{}'", ch));
        }
    }

    // Reject names that start with dots or hyphens (potential for relative paths or flags)
    if trimmed.starts_with('.') || trimmed.starts_with('-') {
        return Err("Binary name cannot start with '.' or '-'".to_string());
    }

    Ok(trimmed.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pty_system = native_pty_system();

    let pty_pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .unwrap();

    let reader = pty_pair.master.try_clone_reader().unwrap();
    let writer = pty_pair.master.take_writer().unwrap();
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(AppState {
            pty_pair: Arc::new(AsyncMutex::new(pty_pair)),
            writer: Arc::new(AsyncMutex::new(writer)),
            reader: Arc::new(AsyncMutex::new(BufReader::new(reader))),
            shell_created: Arc::new(AsyncMutex::new(false)),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            async_create_shell,
            async_write_to_pty,
            async_read_from_pty,
            async_resize_pty,
            check_binary_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
