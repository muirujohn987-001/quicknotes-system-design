# QuickNotes System Design

## Project Description

QuickNotes is a lightweight notes application built with HTML, CSS, and JavaScript. It demonstrates how a frontend communicates with a REST API to retrieve, create, and delete notes.

The project also explores how a production notes service could be designed to support approximately one million registered users through API design, relational database modeling, caching, load balancing, and high availability.

## Features

- Retrieve and display notes from a REST API.
- Create notes using a form.
- Delete notes.
- Display loading, success, empty, and error states.
- Validate note titles before submitting.
- Document a scalable backend architecture and relational database design.

**Important:** This project uses JSONPlaceholder as a demonstration API. Creating and deleting posts are simulated operations; changes are not permanently stored on the remote server.

## Technologies Used

- HTML5
- CSS3
- JavaScript (Fetch API and async/await)
- REST APIs
- Git and GitHub
- SQL and PostgreSQL concepts for the proposed database design

## Project Structure

```text
quicknotes-system-design/
├── index.html
├── style.css
├── api.js
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## How to Run the Application

### Prerequisites

- Python 3 installed, or another local HTTP server.
- An internet connection to access the demonstration API.
- A modern web browser.

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR-USERNAME/quicknotes-system-design.git
   ```

2. Enter the project directory:

   ```bash
   cd quicknotes-system-design
   ```

3. Start a local HTTP server:

   ```bash
   python3 -m http.server 8000
   ```

4. Open the application in your browser:

   `http://localhost:8000`

Replace `YOUR-USERNAME` with your GitHub username before using the clone command.

## Documentation

- [API Design](docs/api-design.md) — REST endpoints, request and response examples, status codes, and error handling.
- [Data Model](docs/data-model.md) — Database tables, relationships, SQL queries, indexes, and SQL vs. NoSQL.
- [System Architecture](docs/architecture.md) — Requirements, capacity estimates, architecture diagram, request flows, trade-offs, and high availability.

## What I Learned

1. **REST API integration:** How to use JavaScript's Fetch API and async/await to communicate with an API and handle unsuccessful responses.
2. **Frontend state management:** How to provide loading, success, empty, and error feedback while keeping the interface responsive.
3. **Relational database design:** How primary keys, foreign keys, relationships, joins, and indexes help organize and retrieve data.
4. **System design:** How load balancers, caches, read replicas, queues, and background workers address scalability and reliability challenges.
5. **Git and GitHub:** How to track changes and organize project work into meaningful commits.

## Future Improvements

- Build a persistent backend API.
- Add authentication and user-specific notes.
- Store notes in a PostgreSQL database.
- Add editing, searching, and tagging.
- Introduce automated tests and deployment.

## Author

Developed as a learning project exploring frontend development, REST APIs, database design, and scalable system architecture.
