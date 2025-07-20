CREATE DATABASE IF NOT EXISTS test_chat;

CREATE TABLE user_ (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    name VARCHAR(255) DEFAULT "Unknown User",
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE compound (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    cid INT,
    smiles TEXT,
    iupac_name TEXT,
    title TEXT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, cid),
    FOREIGN KEY (user_id) REFERENCES user_ (id)
);

CREATE TABLE props (
    user_id INT,
    property VARCHAR(100),
    UNIQUE (user_id, property),
    FOREIGN KEY (user_id) REFERENCES user_ (id)
);

CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    sender ENUM('user', 'bot') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_ (id)
);
