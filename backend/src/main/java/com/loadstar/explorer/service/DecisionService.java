package com.loadstar.explorer.service;

import com.loadstar.explorer.model.WayPointDetailResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DecisionService {

    private final ElementParser parser;
    private final ElementWriter writer;
    private final CliExecutor cli;

    // ===== DTOs =====

    @lombok.Data
    public static class QuestionItem {
        private String wpAddress;
        private String wpSummary;
        private String qid;
        private String state;   // OPEN | DEFERRED
        private String text;
    }

    @lombok.Data
    public static class DecisionListItem {
        private String id;
        private String status;          // DECIDED | SUPERSEDED
        private String createdAt;
        private String wpAddress;
        private String questionId;
        private String question;        // original question text
        private String decision;        // preview (first 2 lines)
        private String note;
        private String aiStatus;        // 처리대기중 | 처리완료 | 처리실패 | 처리취소
        private String aiConfirmedAt;
        private String aiContent;
        private String filePath;
    }

    @lombok.Data
    public static class DecideRequest {
        private String wpAddress;
        private String qid;
        private String questionText;    // original question text to embed in decision file
        private String decision;
        private String note;
    }

    @lombok.Data
    public static class DecideResult {
        private String decisionId;
        private String filePath;
    }

    // ===== List OPEN/DEFERRED questions from WP files =====

    public List<QuestionItem> listQuestions(String projectRoot) throws IOException {
        List<QuestionItem> result = new ArrayList<>();
        Path wpDir = Paths.get(projectRoot, ".loadstar", "WAYPOINT");
        if (!Files.isDirectory(wpDir)) return result;

        for (Path f : Files.list(wpDir).sorted().toList()) {
            try {
                WayPointDetailResponse wp = parser.parseWayPointDetail(f);
                for (WayPointDetailResponse.OpenQuestion oq : wp.getOpenQuestions()) {
                    String state = oq.getState() != null ? oq.getState() : "OPEN";
                    if (!"OPEN".equals(state) && !"DEFERRED".equals(state)) continue;

                    QuestionItem item = new QuestionItem();
                    item.setWpAddress(wp.getAddress());
                    item.setWpSummary(wp.getSummary());
                    item.setQid(oq.getId());
                    item.setText(oq.getText());
                    item.setState(state);
                    result.add(item);
                }
            } catch (Exception e) {
                log.warn("Failed to parse WP: {}", f, e);
            }
        }
        return result;
    }

    // ===== List decision files from DECISIONS directory =====

    public List<DecisionListItem> listDecisions(String projectRoot) throws IOException {
        Path dir = Paths.get(projectRoot, ".loadstar", "DECISIONS");
        if (!Files.isDirectory(dir)) return List.of();

        List<DecisionListItem> result = new ArrayList<>();
        List<Path> files = Files.list(dir)
                .filter(f -> f.getFileName().toString().endsWith(".md"))
                .sorted(Comparator.comparing(Path::getFileName).reversed())
                .collect(Collectors.toList());

        for (Path f : files) {
            try {
                DecisionListItem item = parseDecisionFile(f);
                result.add(item);
            } catch (Exception e) {
                log.warn("Failed to parse decision file: {}", f, e);
            }
        }
        return result;
    }

    private DecisionListItem parseDecisionFile(Path file) throws IOException {
        List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
        DecisionListItem item = new DecisionListItem();
        item.setFilePath(file.toAbsolutePath().toString());
        item.setAiStatus("처리대기중");

        String section = null;
        StringBuilder sectionBuf = new StringBuilder();

        for (String line : lines) {
            String t = line.trim();

            // Header fields
            if (t.startsWith("## [ID]"))         { item.setId(t.substring("## [ID]".length()).trim()); continue; }
            if (t.startsWith("## [STATUS]"))      { item.setStatus(t.substring("## [STATUS]".length()).trim()); continue; }
            if (t.startsWith("## [CREATED_AT]"))  { item.setCreatedAt(t.substring("## [CREATED_AT]".length()).trim()); continue; }

            // SOURCE sub-fields
            if (t.startsWith("- WP:"))            { item.setWpAddress(t.substring("- WP:".length()).trim()); continue; }
            if (t.startsWith("- Question:"))       { item.setQuestionId(t.substring("- Question:".length()).trim()); continue; }

            // AI_CONFIRMATION sub-fields
            if (t.startsWith("- 처리상태:"))       { item.setAiStatus(t.substring("- 처리상태:".length()).trim()); continue; }
            if (t.startsWith("- 확인일시:"))       { item.setAiConfirmedAt(t.substring("- 확인일시:".length()).trim()); continue; }
            if (t.startsWith("- 처리내용:"))       { item.setAiContent(t.substring("- 처리내용:".length()).trim()); continue; }

            // Section transitions
            if (t.startsWith("### ")) {
                flushSection(section, sectionBuf, item);
                sectionBuf.setLength(0);
                section = t.substring(4).trim();
                continue;
            }
            if (t.equals("</DECISION>") || t.equals("<DECISION>")) {
                flushSection(section, sectionBuf, item);
                sectionBuf.setLength(0);
                section = null;
                continue;
            }

            // Accumulate section body
            if (section != null && !t.equals("(없음)") && !t.startsWith("- ")) {
                if (sectionBuf.length() > 0 || !t.isEmpty()) {
                    sectionBuf.append(line).append("\n");
                }
            }
        }
        flushSection(section, sectionBuf, item);
        return item;
    }

    private void flushSection(String section, StringBuilder buf, DecisionListItem item) {
        if (section == null || buf.length() == 0) return;
        String text = buf.toString().trim();
        if (text.isEmpty()) return;
        switch (section) {
            case "QUESTION"        -> item.setQuestion(text);
            case "DECISION"        -> item.setDecision(previewLines(text, 2));
            case "NOTE"            -> item.setNote(text);
        }
    }

    private String previewLines(String text, int max) {
        String[] lines = text.split("\\n");
        List<String> preview = new ArrayList<>();
        for (String l : lines) {
            String t = l.trim();
            if (!t.isEmpty()) { preview.add(t); if (preview.size() >= max) break; }
        }
        return String.join(" / ", preview);
    }

    // ===== Decide: create decision file + delete Q from WP =====

    public DecideResult decide(String projectRoot, DecideRequest req) throws IOException {
        String today = LocalDate.now().toString();

        String wpId = req.getWpAddress();
        if (wpId.contains("/")) wpId = wpId.substring(wpId.lastIndexOf('/') + 1);
        wpId = wpId.replace(":", "").replace("//", "");

        int seq = nextSeq(projectRoot, today, wpId);
        String decisionId = String.format("%s.%s.%03d", wpId, today, seq);

        Path decisionsDir = Paths.get(projectRoot, ".loadstar", "DECISIONS");
        Files.createDirectories(decisionsDir);
        Path decisionFile = decisionsDir.resolve(decisionId + ".md");

        writeDecisionFile(decisionFile, req, decisionId);
        deleteWpQuestion(projectRoot, req.getWpAddress(), req.getQid());

        cli.logModified(projectRoot, req.getWpAddress(),
                "DECISION " + decisionId + " — " + req.getQid() + " answered");

        DecideResult result = new DecideResult();
        result.setDecisionId(decisionId);
        result.setFilePath(decisionFile.toAbsolutePath().toString());
        return result;
    }

    public void deferQuestion(String projectRoot, String wpAddress, String qid) throws IOException {
        Path wpFile = wpFilePath(projectRoot, wpAddress);

        List<String> lines = Files.readAllLines(wpFile, StandardCharsets.UTF_8);
        List<String> updated = new ArrayList<>();
        Pattern target = Pattern.compile("^(\\s*-\\s*\\[)" + Pattern.quote(qid) + "(\\]\\s*.*)$");

        for (String line : lines) {
            Matcher m = target.matcher(line);
            if (m.matches()) {
                updated.add(m.group(1) + qid + " DEFERRED" + m.group(2));
            } else {
                updated.add(line);
            }
        }
        Files.write(wpFile, updated, StandardCharsets.UTF_8);
        cli.logModified(projectRoot, wpAddress, qid + " deferred");
    }

    public void deleteQuestion(String projectRoot, String wpAddress, String qid) throws IOException {
        deleteWpQuestion(projectRoot, wpAddress, qid);
        cli.logModified(projectRoot, wpAddress, qid + " 질문 삭제");
    }

    // ===== Decision file read/update =====

    public String[] readDecisionContent(String filePath) throws IOException {
        List<String> lines = Files.readAllLines(Paths.get(filePath), StandardCharsets.UTF_8);
        String[] result = {"", ""};
        int target = -1; // 0=DECISION, 1=NOTE
        StringBuilder buf = new StringBuilder();

        for (String line : lines) {
            if (line.trim().equals("### DECISION")) { if (target >= 0) result[target] = buf.toString().trim(); target = 0; buf.setLength(0); continue; }
            if (line.trim().equals("### NOTE"))     { if (target >= 0) result[target] = buf.toString().trim(); target = 1; buf.setLength(0); continue; }
            if (line.startsWith("###") || line.startsWith("</DECISION>")) { if (target >= 0) { result[target] = buf.toString().trim(); target = -1; } continue; }
            if (target >= 0 && !line.trim().equals("(없음)")) buf.append(line).append("\n");
        }
        if (target >= 0) result[target] = buf.toString().trim();
        return result;
    }

    public void updateDecisionContent(String filePath, String decision, String note) throws IOException {
        Path path = Paths.get(filePath);
        List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
        List<String> updated = new ArrayList<>();
        String skip = null;

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.equals("### DECISION")) { skip = "DECISION"; updated.add(line); updated.add(decision != null ? decision : "(없음)"); continue; }
            if (trimmed.equals("### NOTE"))     { skip = "NOTE";     updated.add(line); updated.add(note != null ? note : "(없음)"); continue; }
            if (trimmed.startsWith("###") || trimmed.startsWith("</DECISION>")) { skip = null; }
            if (skip == null) updated.add(line);
        }
        Files.write(path, updated, StandardCharsets.UTF_8);
    }

    // ===== File write helpers =====

    private void writeDecisionFile(Path file, DecideRequest req, String decisionId) throws IOException {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        List<String> lines = new ArrayList<>();
        lines.add("<DECISION>");
        lines.add("## [ID] " + decisionId);
        lines.add("## [STATUS] DECIDED");
        lines.add("## [CREATED_AT] " + now);
        lines.add("");
        lines.add("### SOURCE");
        lines.add("- WP: " + req.getWpAddress());
        lines.add("- Question: " + req.getQid());
        lines.add("");
        lines.add("### QUESTION");
        lines.add(req.getQuestionText() != null && !req.getQuestionText().isBlank()
                ? req.getQuestionText() : "(없음)");
        lines.add("");
        lines.add("### DECISION");
        lines.add(req.getDecision() != null ? req.getDecision() : "(없음)");
        lines.add("");
        lines.add("### NOTE");
        lines.add(req.getNote() != null && !req.getNote().isBlank() ? req.getNote() : "(없음)");
        lines.add("");
        lines.add("### AI_CONFIRMATION");
        lines.add("- 처리상태: 처리대기중");
        lines.add("- 확인일시: -");
        lines.add("- 처리내용: -");
        lines.add("</DECISION>");
        Files.write(file, lines, StandardCharsets.UTF_8);
    }

    private void deleteWpQuestion(String projectRoot, String wpAddress, String qid) throws IOException {
        Path wpFile = wpFilePath(projectRoot, wpAddress);
        List<String> lines = Files.readAllLines(wpFile, StandardCharsets.UTF_8);
        Pattern target = Pattern.compile("^\\s*-\\s*\\[" + Pattern.quote(qid) + "(?:[\\s\\]]|$)");
        List<String> updated = lines.stream()
                .filter(line -> !target.matcher(line).find())
                .collect(Collectors.toList());
        Files.write(wpFile, updated, StandardCharsets.UTF_8);
    }

    private Path wpFilePath(String projectRoot, String wpAddress) throws IOException {
        Path f = Paths.get(projectRoot, ".loadstar", "WAYPOINT",
                wpAddress.substring(4).replace("/", ".") + ".md");
        if (!Files.exists(f)) throw new IOException("WP not found: " + wpAddress);
        return f;
    }

    private int nextSeq(String projectRoot, String date, String wpId) {
        Path dir = Paths.get(projectRoot, ".loadstar", "DECISIONS");
        if (!Files.isDirectory(dir)) return 1;
        try {
            String prefix = wpId + "." + date + ".";
            long count = Files.list(dir)
                    .filter(f -> f.getFileName().toString().startsWith(prefix))
                    .count();
            return (int) count + 1;
        } catch (IOException e) {
            return 1;
        }
    }
}
