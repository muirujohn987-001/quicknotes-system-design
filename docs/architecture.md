# QuickNotes System Architecture

## 1. Overview

QuickNotes is a notes application that allows users to create, view, update, and delete notes. The initial frontend is built with HTML, CSS, and JavaScript. The architecture described below represents a scalable production design capable of supporting approximately one million registered users.

The production backend would expose a REST API and use a relational database to store users and notes.

## 2. Functional Requirements

The system should allow users to:

- Register and log in securely.
- Create, view, update, and delete their notes.
- Organize notes using tags.
- Search and filter their notes.
- Access their notes from different devices.
- Receive clear feedback when an operation succeeds or fails.

## 3. Non-Functional Requirements

- **Scalability:** Support increasing numbers of users and requests.
- **Performance:** Return common note-list requests quickly.
- **Availability:** Keep the service operational when an application server fails.
- **Security:** Authenticate users, authorize access to notes, and encrypt network traffic using HTTPS.
- **Data integrity:** Prevent unauthorized changes and maintain consistent database records.
- **Maintainability:** Use modular components that can be tested and updated independently.
- **Recoverability:** Maintain backups and test restoration procedures.

## 4. Capacity Estimates for One Million Users

These estimates are planning assumptions, not measured production traffic.

### Assumptions

- Registered users: 1,000,000.
- Daily active users: 10% of registered users = 100,000.
- Each active user makes 20 read requests per day.
- Each active user creates one note per day.
- Average stored note content and metadata: approximately 5 KB.
- A peak-to-average traffic ratio of 5:1 is used for initial planning.

### Read Requests

Daily read requests:

100,000 active users × 20 reads = 2,000,000 reads/day.

Average reads per second:

2,000,000 ÷ 86,400 ≈ 23.15 reads/second.

Estimated peak reads per second:

23.15 × 5 ≈ 116 reads/second.

### Write Requests

Daily note creations:

100,000 active users × 1 note = 100,000 notes/day.

Average note-creation writes per second:

100,000 ÷ 86,400 ≈ 1.16 writes/second.

Estimated peak note-creation writes per second:

1.16 × 5 ≈ 5.79 writes/second.

These figures estimate note creation only. Updates, deletes, authentication, and background jobs would add more traffic.

### Annual Storage

Estimated note storage per day:

100,000 notes × 5 KB = 500,000 KB/day, or approximately 500 MB/day using decimal units.

Estimated annual note storage:

500 MB × 365 ≈ 182.5 GB/year.

This estimate excludes database indexes, backups, replicas, attachments, logs, and other metadata. Actual storage requirements would be higher.

## 5. High-Level Architecture Diagram

```text
                         USERS
                           |
                    [ Web / Mobile Client ]
                           |
                          DNS
                           |
                          CDN
                 (Static frontend assets)
                           |
                    [ Load Balancer ]
                       /         \
                      /           \
            [ Application 1 ]  [ Application 2 ]
                      \           /
                       \         /
                     [ Cache Layer ]
                           |
                 [ Primary Database ]
                           |
                    [ Read Replica ]
                           
            Application Servers
                    |
               [ Message Queue ]
                    |
             [ Background Worker ]
```

The diagram is a conceptual overview. In a production deployment, database replication, cache access, and background processing would be configured according to the needs of each request.

## 6. Components and the Problems They Solve

### Web or Mobile Client

Provides the interface through which users manage notes. It displays results and sends requests to the backend API.

### DNS

Translates the application's domain name into the appropriate network address. Reliable DNS configuration helps users reach the service.

### Content Delivery Network (CDN)

Serves static files such as JavaScript, CSS, images, and other public assets from locations closer to users. Private note data must not be publicly cached.

### Load Balancer

Distributes incoming API requests across healthy application servers. It reduces dependence on a single server and can stop routing traffic to unhealthy instances.

### Application Servers

Run the backend API, authenticate users, validate requests, enforce authorization, and implement note-management logic.

Running at least two application servers allows the service to continue operating if one server becomes unavailable, provided the remaining capacity is sufficient.

### Cache Layer

Stores frequently requested data temporarily to reduce database load and improve response times.

Cached note data must be scoped to the authorized user. The application must also handle invalidation or expiration so users do not receive stale data.

### Primary Database

Stores authoritative application data, including users, notes, tags, and their relationships. Writes are sent to the primary database.

### Read Replica

Receives replicated database changes and can serve suitable read queries. It reduces read pressure on the primary database, although replication lag may mean that some recent changes are not immediately visible.

### Message Queue

Stores background jobs until workers can process them. This helps separate slower tasks from the main request-response cycle.

### Background Worker

Processes asynchronous jobs such as email notifications, scheduled reminders, and other tasks that do not need to finish before the API responds.

### Monitoring, Logging, and Backups

Monitoring and logs help detect failures and investigate problems. Automated backups and tested restoration procedures help recover data after accidental deletion or infrastructure failure.

## 7. GET /notes Request Flow

When a user requests their notes:

1. The client sends an HTTPS request to `GET /notes`.
2. DNS resolves the application's domain.
3. The request passes through the load balancer.
4. A healthy application server receives the request.
5. The server authenticates the user and checks authorization.
6. The application checks the cache for the user's requested notes.
7. If valid cached data is available, the server returns it.
8. Otherwise, the server queries the primary database or an appropriate read replica.
9. The server returns the notes as a JSON response.
10. If appropriate, the application caches the result for subsequent requests.

The API must ensure that users can access only their own notes. CDN caching should not expose private note data.

## 8. POST /notes Request Flow

When a user creates a note:

1. The client sends an HTTPS `POST /notes` request with the note data.
2. The load balancer forwards the request to a healthy application server.
3. The server authenticates the user and verifies authorization.
4. The application validates the title and body.
5. The application inserts the note into the primary database.
6. After the write succeeds, the API returns a success response, normally `201 Created`, with the new note or its identifying details.
7. Any affected cache entries are invalidated or updated.
8. If additional work is needed, such as sending a notification, the application can enqueue a background job.
9. A worker processes the job independently of the user's request.

The API should not report that a note was successfully created until the database write has succeeded.

## 9. Architectural Trade-Offs

### Trade-Off 1: Caching vs. Data Freshness

**Benefit:** Caching reduces repeated database queries and can improve response times.

**Disadvantage:** Cached results can become stale after a note is updated or deleted.

**Decision:** Cache frequently accessed data with appropriate expiration and invalidation rules. For private notes, always enforce user authorization before returning cached results.

### Trade-Off 2: Read Replicas vs. Consistency

**Benefit:** Read replicas distribute read traffic and reduce pressure on the primary database.

**Disadvantage:** Replication lag can cause a recently created or updated note to be temporarily missing from replica results.

**Decision:** Use replicas for suitable read-heavy workloads. Where immediate consistency matters, read from the primary database.

### Trade-Off 3: Synchronous vs. Asynchronous Processing

**Benefit:** A message queue lets the API respond without waiting for slower background tasks to finish.

**Disadvantage:** Queue infrastructure adds operational complexity, and failed jobs may need retries or dead-letter handling.

**Decision:** Keep note creation and its database write synchronous. Move suitable secondary tasks, such as notifications, to background workers.

### Trade-Off 4: High Availability vs. Cost and Complexity

**Benefit:** Multiple application servers, replicas, and redundant infrastructure reduce the impact of individual failures.

**Disadvantage:** Redundancy increases hosting costs and operational complexity.

**Decision:** Begin with a simple architecture during development, then introduce redundancy as traffic, availability requirements, and budget justify it.

## 10. Avoiding Single Points of Failure

The system can reduce single points of failure by:

- Running at least two application servers across separate availability zones where supported.
- Using a managed load balancer with health checks.
- Configuring reliable DNS and monitoring.
- Deploying cache infrastructure with an appropriate high-availability configuration.
- Maintaining automated database backups and testing restoration.
- Using database replication and a documented primary-failure recovery procedure.
- Deploying redundant workers and configuring retry policies for background jobs.
- Monitoring API latency, error rates, database health, queue depth, and server resources.

A read replica alone does not guarantee automatic database failover. The production deployment must define and test how a new primary database is selected after a failure.

## 11. Conclusion

QuickNotes can start as a simple frontend connected to a REST API and evolve into a scalable service. Load balancing, caching, database replication, background processing, monitoring, and backups address different performance and reliability challenges.

The architecture should be introduced incrementally. Actual traffic measurements, security requirements, and availability targets should guide production infrastructure decisions.
