package com.loadstar.explorer.service;

import com.loadstar.explorer.model.GitCommitInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class GitService {

    /**
     * Get git commit history for a specific element file.
     */
    public List<GitCommitInfo> getFileHistory(String projectRoot, String address) {
        Path filePath = addressToRelativePath(address);
        List<GitCommitInfo> result = new ArrayList<>();

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "git", "log",
                    "--pretty=format:%H|%ai|%an|%s",
                    "--", filePath.toString().replace("\\", "/")
            );
            pb.directory(new File(projectRoot));
            pb.redirectErrorStream(true);

            Process process = pb.start();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.trim().isEmpty()) continue;
                    String[] parts = line.split("\\|", 4);
                    if (parts.length >= 4) {
                        GitCommitInfo info = new GitCommitInfo();
                        info.setHash(parts[0].trim());
                        info.setDate(parts[1].trim());
                        info.setAuthor(parts[2].trim());
                        info.setMessage(parts[3].trim());
                        result.add(info);
                    }
                }
            }

            boolean finished = process.waitFor(15, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.warn("git log timed out for {}", address);
            }
        } catch (Exception e) {
            log.error("Failed to get git history for {}: {}", address, e.getMessage());
        }

        return result;
    }

    /**
     * Get file content at a specific commit hash.
     * Uses: git show {hash}:{relativePath}
     */
    public String getFileAtCommit(String projectRoot, String address, String hash) {
        Path filePath = addressToRelativePath(address);
        String gitPath = filePath.toString().replace("\\", "/");

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "git", "show", hash + ":" + gitPath
            );
            pb.directory(new File(projectRoot));
            pb.redirectErrorStream(true);

            Process process = pb.start();
            StringBuilder content = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    content.append(line).append("\n");
                }
            }

            boolean finished = process.waitFor(15, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("git show timed out");
            }

            if (process.exitValue() != 0) {
                throw new RuntimeException("git show failed: " + content);
            }

            return content.toString();
        } catch (Exception e) {
            log.error("Failed to get file at commit {} for {}: {}", hash, address, e.getMessage());
            throw new RuntimeException("Failed to get file at commit: " + e.getMessage(), e);
        }
    }

    /**
     * Convert LOADSTAR address to relative file path within project.
     */
    private Path addressToRelativePath(String address) {
        String typeDir;
        String pathPart;

        if (address.startsWith("M://")) {
            typeDir = "MAP";
            pathPart = address.substring(4);
        } else if (address.startsWith("W://")) {
            typeDir = "WAYPOINT";
            pathPart = address.substring(4);
        } else if (address.startsWith("B://")) {
            typeDir = "BLACKBOX";
            pathPart = address.substring(4);
        } else {
            throw new IllegalArgumentException("Unknown address type: " + address);
        }

        String fileName = pathPart.replace("/", ".") + ".md";
        return Paths.get(".loadstar", typeDir, fileName);
    }
}
