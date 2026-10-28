# QuickNotes API Design

## 1. Overview

QuickNotes is a notes application that allows registered users to create, read, update and delete personal notes. The production API will use REST conventions and JSON request and response bodies.

### Base URL

`https://api.quicknotes.example/v1`

The example domain is a placeholder and must be replaced with the production API domain before deployment.

### Authentication

Protected endpoints require a valid access token:

`Authorization: Bearer <access_token>`

The API will identify the authenticated user from the token rather than trusting a client-supplied user ID.

### Common response format

Successful responses return JSON where a response body is appropriate. Errors return a JSON object containing an error code, a human-readable message and optional details.

## 2. REST Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | 201 Created |
| POST | `/auth/login` | Authenticate a user and issue an access token | 200 OK |
| GET | `/notes` | List the authenticated user's notes, with pagination | 200 OK |
| GET | `/notes/{noteId}` | Retrieve one note owned by the authenticated user | 200 OK |
| POST | `/notes` | Create a new note | 201 Created |
| PATCH | `/notes/{noteId}` | Update selected fields of an existing note | 200 OK |
| DELETE | `/notes/{noteId}` | Delete a note owned by the authenticated user | 204 No Content |
| GET | `/tags` | List tags belonging to the authenticated user | 200 OK |
| POST | `/notes/{noteId}/tags/{tagId}` | Associate a tag with a note | 201 Created |

The API will return only notes the authenticated user is authorized to access. Pagination will use parameters such as `limit` and `cursor` to prevent unnecessarily large responses.

## 3. List Notes

### Request

`GET /v1/notes?limit=20`

Headers:

```http
Authorization: Bearer <access_token>
Accept: application/json
```

### Successful response

Status: `200 OK`

```json
{
  "data": [
    {
      "id": "note_101",
      "title": "Cloud computing revision",
      "body": "Review virtual machines and networking.",
      "createdAt": "2026-10-28T10:00:00Z",
      "updatedAt": "2026-10-28T10:00:00Z"
    },
    {
      "id": "note_102",
      "title": "Project ideas",
      "body": "Explore a cloud monitoring dashboard.",
      "createdAt": "2026-10-28T11:00:00Z",
      "updatedAt": "2026-10-28T11:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "nextCursor": null
  }
}
```

The `data` array contains notes belonging to the authenticated user. The `nextCursor` field identifies where to continue when more results are available.

## 4. Create a Note

### Request

`POST /v1/notes`

Headers:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request body:

```json
{
  "title": "Database revision",
  "body": "Review primary keys, foreign keys and joins."
}
```

The title is required and must contain between 1 and 100 characters after trimming whitespace. The body is optional.

### Successful response

Status: `201 Created`

```json
{
  "data": {
    "id": "note_103",
    "title": "Database revision",
    "body": "Review primary keys, foreign keys and joins.",
    "createdAt": "2026-10-28T12:00:00Z",
    "updatedAt": "2026-10-28T12:00:00Z"
  }
}
```

The server generates the note ID and timestamps. The client does not choose the owner; ownership is derived from the authenticated user.

## 5. Update a Note

### Request

`PATCH /v1/notes/note_103`

```json
{
  "title": "Database systems revision"
}
```

### Successful response

Status: `200 OK`

```json
{
  "data": {
    "id": "note_103",
    "title": "Database systems revision",
    "body": "Review primary keys, foreign keys and joins.",
    "createdAt": "2026-10-28T12:00:00Z",
    "updatedAt": "2026-10-28T12:30:00Z"
  }
}
```

Only supplied fields are updated. The server validates the changes and confirms that the user owns or is authorized to edit the note.

## 6. Delete a Note

### Request

`DELETE /v1/notes/note_103`

Headers:

```http
Authorization: Bearer <access_token>
```

### Successful response

Status: `204 No Content`

The server deletes the note and returns no response body.

## 7. Error Status Codes

| Status | Meaning | Example situation |
|---|---|---|
| 400 Bad Request | The request is invalid | Missing title or malformed JSON |
| 401 Unauthorized | Authentication is missing or invalid | Expired or missing access token |
| 403 Forbidden | The user is authenticated but lacks permission | Attempt to perform an explicitly forbidden action |
| 404 Not Found | The resource does not exist or is not accessible | Note ID does not exist |
| 409 Conflict | The request conflicts with existing state | Duplicate username during registration |
| 422 Unprocessable Content | The request format is valid but the field values fail business validation | Title exceeds the allowed length |
| 429 Too Many Requests | The client exceeded a rate limit | Too many requests in a short period |
| 500 Internal Server Error | An unexpected server error occurred | Unhandled application failure |
| 503 Service Unavailable | The service is temporarily unavailable | Database maintenance or temporary overload |

For private resources, the API may return `404 Not Found` instead of `403 Forbidden` when revealing a resource's existence could expose information about another user.

## 8. Example Error Response

Request:

`POST /v1/notes`

Request body:

```json
{
  "title": ""
}
```

Response:

Status: `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "title",
        "message": "Title is required and must not exceed 100 characters."
      }
    ],
    "requestId": "req_abc123"
  }
}
```

The `requestId` allows the support or engineering team to find the corresponding request in server logs.

## 9. API Design Considerations

- **Security:** Require authentication for private notes and enforce ownership checks on every operation.
- **Validation:** Validate input on the server even when the browser also validates it.
- **Pagination:** Limit the number of notes returned per request.
- **Rate limiting:** Restrict abusive request patterns and protect service capacity.
- **Consistency:** Use appropriate database transactions when an operation changes multiple related records.
- **Observability:** Log request IDs, latency, errors and operational metrics without logging passwords, access tokens or sensitive note contents unnecessarily.
