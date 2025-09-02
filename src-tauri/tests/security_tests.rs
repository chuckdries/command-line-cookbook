use command_line_cookbook_lib::sanitize_binary_name;

#[test]
fn test_sanitize_binary_name_valid() {
    // Valid binary names should pass
    assert!(sanitize_binary_name("git").is_ok());
    assert!(sanitize_binary_name("node").is_ok());
    assert!(sanitize_binary_name("python3").is_ok());
    assert!(sanitize_binary_name("my-tool").is_ok());
    assert!(sanitize_binary_name("my_tool").is_ok());
    assert!(sanitize_binary_name("tool.exe").is_ok());
    assert!(sanitize_binary_name("a1b2c3").is_ok());
}

#[test]
fn test_sanitize_binary_name_invalid_characters() {
    // Names with dangerous characters should fail
    assert!(sanitize_binary_name("git; rm -rf /").is_err());
    assert!(sanitize_binary_name("tool && malicious").is_err());
    assert!(sanitize_binary_name("cmd | sh").is_err());
    assert!(sanitize_binary_name("tool$(whoami)").is_err());
    assert!(sanitize_binary_name("tool`id`").is_err());
    assert!(sanitize_binary_name("tool > /etc/passwd").is_err());
    assert!(sanitize_binary_name("tool < input").is_err());
    assert!(sanitize_binary_name("tool & background").is_err());
    assert!(sanitize_binary_name("tool * glob").is_err());
    assert!(sanitize_binary_name("tool ? question").is_err());
    assert!(sanitize_binary_name("tool / path").is_err());
    assert!(sanitize_binary_name("tool \\ escape").is_err());
    assert!(sanitize_binary_name("tool'quoted").is_err());
    assert!(sanitize_binary_name("tool\"quoted").is_err());
}

#[test]
fn test_sanitize_binary_name_edge_cases() {
    // Empty and whitespace-only names should fail
    assert!(sanitize_binary_name("").is_err());
    assert!(sanitize_binary_name("   ").is_err());
    assert!(sanitize_binary_name("\t").is_err());
    assert!(sanitize_binary_name("\n").is_err());

    // Names starting with dots or hyphens should fail
    assert!(sanitize_binary_name(".hidden").is_err());
    assert!(sanitize_binary_name("-flag").is_err());

    // Very long names should fail
    let long_name = "a".repeat(256);
    assert!(sanitize_binary_name(&long_name).is_err());

    // But valid trimmed names should pass
    assert!(sanitize_binary_name("  git  ").is_ok());
    let result = sanitize_binary_name("  git  ").unwrap();
    assert_eq!(result, "git");
}
