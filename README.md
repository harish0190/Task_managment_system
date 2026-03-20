# VoiceTask | Modern Task Management System

VoiceTask is a modern, responsive, and voice-enabled task management application built with **Spring Boot** and **Vanilla JS**. It features Role-Based Access Control (RBAC) and seamless voice interaction for efficient task tracking.

## 🚀 Features

-   **Voice Recognition**: Add and manage tasks using natural language commands.
-   **Role-Based Access Control (RBAC)**:
    -   **Manager**: Full control over task creation, assignment, and approval.
    -   **Employee**: Manage personal task progress and use voice commands.
-   **Interactive Dashboard**: Real-time stats and visual task tracking.
-   **Kanban Workflow**: Drag-and-drop task movement through different stages.
-   **Modern Design**: Sleek UI with Dark/Light mode support.

## 🛠️ Tech Stack

-   **Backend**: Java 17, Spring Boot, Spring Security (JWT), Spring Data JPA, MySQL.
-   **Frontend**: HTML5, Vanilla CSS, Javascript (ES6+), Web Speech API.

## 📋 Prerequisites

-   **Java 17+**
-   **Maven 3.6+**
-   **MySQL 8.0+**
-   **Modern Browser** (Chrome/Edge recommended for Web Speech API support).

## ⚙️ Setup & Installation

1.  **Database Configuration**:
    -   Create a database named `task_manager_db`.
    -   Update `Backend/src/main/resources/application.properties` with your MySQL credentials.

2.  **Run the Backend**:
    ```bash
    cd Backend
    mvn spring-boot:run
    ```

3.  **Access the Application**:
    -   Once the backend is running, open: [http://localhost:8080/index.html](http://localhost:8080/index.html)
    -   *Note: Using the local HTTP URL is required for Voice Recognition support.*

## 🎙️ Voice Commands

| Category          | Commands                                      |
| ----------------- | --------------------------------------------- |
| **Tasks**         | "Add task [Title]", "Create task [Title]"     |
| **Priority**      | "...with high priority", "...urgent"          |
| **Navigation**    | "Show dashboard", "Show tasks"                |
| **Theme**         | "Dark mode", "Light mode"                     |

## 🔑 Default Roles

-   **Employee**: Standard user who can update statuses and use voice.
-   **Manager**: Administrative user with approval and creation rights.

---
*Developed by Dream coder*