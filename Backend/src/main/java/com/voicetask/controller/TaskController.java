package com.voicetask.controller;

import com.voicetask.model.Task;
import com.voicetask.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    @PostMapping
    public Task createTask(@Valid @RequestBody Task task) {
        return taskService.createTask(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @Valid @RequestBody Task taskDetails) {
        try {
            return ResponseEntity.ok(taskService.updateTask(id, taskDetails));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Task> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            Task.Status status = Task.Status.valueOf(payload.get("status").toUpperCase());
            return ResponseEntity.ok(taskService.updateStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/search")
    public List<Task> searchTasks(@RequestParam String keyword) {
        return taskService.searchTasks(keyword);
    }

    @PostMapping("/voice-command")
    public ResponseEntity<Task> voiceCommand(@RequestBody Map<String, String> payload) {
        try {
            return ResponseEntity.ok(taskService.processVoiceCommand(payload.get("command")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
