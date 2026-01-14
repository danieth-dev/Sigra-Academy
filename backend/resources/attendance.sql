-- Migration: add attendance session/records with open/close dates and week number
CREATE TABLE IF NOT EXISTS attendance_sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  week_number INT NULL,
  open_date DATETIME NOT NULL,
  close_date DATETIME NOT NULL,
  frequency ENUM('weekly','daily') DEFAULT 'weekly',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_assignment_id (assignment_id),
  CONSTRAINT fk_attendance_assignment FOREIGN KEY (assignment_id) REFERENCES teacher_assignments(assignment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- If upgrading from older schema, ensure week_number is nullable and frequency column exists
ALTER TABLE attendance_sessions MODIFY COLUMN week_number INT NULL;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS frequency ENUM('weekly','daily') DEFAULT 'weekly';

CREATE TABLE IF NOT EXISTS attendance_records (
  record_id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  student_user_id INT NOT NULL,
  status ENUM('present','absent','late') DEFAULT 'absent',
  marked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_id (session_id),
  INDEX idx_student_user_id (student_user_id),
  CONSTRAINT fk_attendance_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
