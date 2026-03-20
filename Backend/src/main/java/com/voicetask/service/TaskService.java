package com.voicetask.service;

import com.voicetask.dao.TaskRepository;
import com.voicetask.model.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private com.voicetask.dao.UserRepository userRepository;

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    public Task updateTask(Long id, Task taskDetails) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id " + id));
        
        task.setTitle(taskDetails.getTitle());
        task.setDescription(taskDetails.getDescription());
        task.setPriority(taskDetails.getPriority());
        task.setDeadline(taskDetails.getDeadline());
        task.setStatus(taskDetails.getStatus());
        
        return taskRepository.save(task);
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    public Task updateStatus(Long id, Task.Status status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id " + id));
        
        // If an employee marks it as COMPLETED, it goes to PENDING_APPROVAL
        if (status == Task.Status.COMPLETED) {
            task.setStatus(Task.Status.PENDING_APPROVAL);
        } else {
            task.setStatus(status);
        }
        return taskRepository.save(task);
    }

    public Task assignTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        com.voicetask.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        task.setAssignedTo(user);
        return taskRepository.save(task);
    }

    public Task approveTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(Task.Status.COMPLETED);
        return taskRepository.save(task);
    }

    public Task rejectTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(Task.Status.REJECTED);
        return taskRepository.save(task);
    }

    public List<Task> searchTasks(String keyword) {
        return taskRepository.findByTitleContainingIgnoreCase(keyword);
    }

    public Task processVoiceCommand(String command) {
        if (command == null || command.trim().isEmpty()) {
            throw new RuntimeException("Empty voice command");
        }
        
        String lowerCmd = command.toLowerCase().trim();
        Task task = new Task();
        
        String title = "";
        if (lowerCmd.contains("create task")) {
            String[] parts = lowerCmd.split("create task");
            if (parts.length > 1) title = parts[1].trim();
        } else if (lowerCmd.contains("add task")) {
            String[] parts = lowerCmd.split("add task");
            if (parts.length > 1) title = parts[1].trim();
        }
        
        if (title.isEmpty()) {
            throw new RuntimeException("Could not extract task title from command");
        }
        
        // Basic extraction logic for priority
        if (title.contains("with high priority")) {
            task.setPriority(Task.Priority.HIGH);
            title = title.replace("with high priority", "").trim();
        } else if (title.contains("with low priority")) {
            task.setPriority(Task.Priority.LOW);
            title = title.replace("with low priority", "").trim();
        }
        
        if (title.isEmpty()) {
            throw new RuntimeException("Task title became empty after parsing");
        }
        
        // Capitalize first letter safely
        task.setTitle(title.substring(0, 1).toUpperCase() + (title.length() > 1 ? title.substring(1) : ""));
        task.setDescription("Voice-created task");
        return taskRepository.save(task);
    }
}
