package com.loadstar.explorer.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class CliExecutor {

    /**
     * Execute a loadstar CLI command in the given project root directory.
     * Returns stdout. Throws RuntimeException on failure.
     */
    public String execute(String projectRoot, String... args) {
        try {
            String[] command = new String[args.length + 1];
            command[0] = "loadstar";
            System.arraycopy(args, 0, command, 1, args.length);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(new java.io.File(projectRoot));
            pb.redirectErrorStream(true);

            Process process = pb.start();
            StringBuilder output = new StringBuilder();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            boolean finished = process.waitFor(30, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("CLI command timed out");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                log.warn("CLI command exited with code {}: {}", exitCode, output);
            }

            return output.toString().trim();
        } catch (Exception e) {
            log.error("Failed to execute CLI command", e);
            throw new RuntimeException("CLI execution failed: " + e.getMessage(), e);
        }
    }

    /**
     * Log a MODIFIED change via loadstar log CLI.
     */
    public void logModified(String projectRoot, String address, String message) {
        try {
            execute(projectRoot, "log", address, "MODIFIED", message);
        } catch (Exception e) {
            log.warn("Failed to log modification for {}: {}", address, e.getMessage());
        }
    }

    /**
     * Register a TODO item and immediately mark it done, so it appears in TODO_HISTORY.
     */
    public void todoAddAndDone(String projectRoot, String address, String summary) {
        try {
            execute(projectRoot, "todo", "add", address, summary);
            execute(projectRoot, "todo", "done", address);
        } catch (Exception e) {
            log.warn("Failed to todo add+done for {}: {}", address, e.getMessage());
        }
    }
}
