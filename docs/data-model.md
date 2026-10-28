# QuickNotes Data Model

## 1. Overview

QuickNotes stores user accounts, notes, tags and associations between notes and tags.

The proposed production database is PostgreSQL, a relational database that supports foreign keys, transactions, indexes and structured queries.

## 2. Entities and Columns

### 2.1 Users

The `users` table stores registered user accounts.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | BIGINT | Primary key, generated | Unique user identifier |
| `name` | VARCHAR(100) | NOT NULL | User's display name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Login email |
| `password_hash` | TEXT | NOT NULL | Secure password hash |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Account creation time |

Passwords must be stored as secure password hashes, never as plaintext.

### 2.2 Notes

The `notes` table stores notes created by users.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | BIGINT | Primary key, generated | Unique note identifier |
| `user_id` | BIGINT | NOT NULL, foreign key | Owner of the note |
| `title` | VARCHAR(100) | NOT NULL | Note title |
| `body` | TEXT | Nullable | Note content |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Last update time |

Each note belongs to one user. The foreign key prevents a note from referencing a nonexistent user.

### 2.3 Tags

The `tags` table stores labels that users can apply to their notes.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | BIGINT | Primary key, generated | Unique tag identifier |
| `user_id` | BIGINT | NOT NULL, foreign key | User who owns the tag |
| `name` | VARCHAR(50) | NOT NULL | Tag name |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Creation time |

A unique constraint on `(user_id, name)` prevents a user from creating duplicate tag names while allowing different users to use the same name.

### 2.4 Note Tags

The `note_tags` table associates notes with tags.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `note_id` | BIGINT | Primary key component, foreign key | Associated note |
| `tag_id` | BIGINT | Primary key component, foreign key | Associated tag |

The composite primary key `(note_id, tag_id)` prevents the same tag from being assigned to the same note more than once.

## 3. Relationships

### One-to-Many

**Users to Notes:** One user can create many notes, but each note belongs to one user. The `notes.user_id` foreign key implements this relationship.

**Users to Tags:** One user can create many tags, but each tag belongs to one user. The `tags.user_id` foreign key implements this relationship.

### Many-to-Many

**Notes to Tags:** One note can have several tags, and one tag can be assigned to several notes.

The `note_tags` table resolves this many-to-many relationship using two foreign keys. Each row represents one note-tag association.

This structure avoids storing lists of tag IDs in a single database column and makes searching and maintaining tag relationships easier.

## 4. CREATE TABLE Statements

The following statements use PostgreSQL syntax.

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL
        CHECK (CHAR_LENGTH(TRIM(title)) BETWEEN 1 AND 100),
    body TEXT,
    created_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL
        CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 1 AND 50),
    created_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id)
        ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id)
        ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);
```

The cascade rules remove dependent notes or tags when a user is deleted, and remove note-tag associations when either associated record is deleted.

In a production implementation, the application must also ensure that a user cannot associate their note with another user's tag. This can be enforced using appropriate database constraints or transactional application logic.

## 5. Example SQL Queries

### Query 1: Retrieve a user's notes

```sql
SELECT
    id,
    title,
    body,
    created_at,
    updated_at
FROM notes
WHERE user_id = 1
ORDER BY updated_at DESC;
```

This query retrieves notes belonging to one user, with recently updated notes first.

### Query 2: Retrieve notes and their tags using JOIN

```sql
SELECT
    n.id AS note_id,
    n.title,
    t.name AS tag_name
FROM notes AS n
JOIN note_tags AS nt
    ON n.id = nt.note_id
JOIN tags AS t
    ON nt.tag_id = t.id
WHERE n.user_id = 1
ORDER BY n.id, t.name;
```

This query joins three tables to retrieve each note and its associated tags.

### Query 3: Count notes per user

```sql
SELECT
    u.id,
    u.name,
    COUNT(n.id) AS total_notes
FROM users AS u
LEFT JOIN notes AS n
    ON u.id = n.user_id
GROUP BY u.id, u.name
ORDER BY total_notes DESC;
```

The `LEFT JOIN` ensures users with no notes are also included, with a count of zero.

### Query 4: Find notes without tags

```sql
SELECT
    n.id,
    n.title
FROM notes AS n
LEFT JOIN note_tags AS nt
    ON n.id = nt.note_id
WHERE nt.note_id IS NULL;
```

This query identifies notes that have not been assigned any tags.

## 6. Indexes

The following index supports queries that retrieve a user's notes in update-time order:

```sql
CREATE INDEX idx_notes_user_updated
ON notes (user_id, updated_at DESC);
```

The index allows the database to narrow results by `user_id` and can help it retrieve those notes in the requested order without sorting every matching row.

PostgreSQL automatically creates indexes for primary keys and unique constraints. Additional indexes should be introduced based on query patterns and measured performance because each index consumes storage and increases the cost of writes.

## 7. SQL or NoSQL?

I would choose a relational SQL database, specifically PostgreSQL, for QuickNotes. Users, notes, tags and note-tag associations have clear relationships, and the application needs foreign keys, uniqueness constraints and transactions to preserve data integrity. SQL also supports joins and aggregation, which make it straightforward to retrieve notes with tags and produce user-level reports. A NoSQL document database could provide flexible document structures, but it could require duplicated data or application-managed relationships. PostgreSQL is therefore a good fit for the initial service and provides room to scale as the application grows.
