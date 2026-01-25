// CREATE TABLE nodes (
//   id UUID PRIMARY KEY,
//   parent_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
//   name TEXT NOT NULL,
//   type TEXT NOT NULL CHECK (type IN ('folder', 'file')),
//   path TEXT NOT NULL,
//   created_at TIMESTAMP DEFAULT now(),
//   updated_at TIMESTAMP DEFAULT now(),
//   UNIQUE (parent_id, name)
// );

// CREATE TABLE documents (
//   id UUID PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
//   content TEXT NOT NULL DEFAULT '',
//   version INT NOT NULL DEFAULT 1,
//   updated_at TIMESTAMP DEFAULT now()
// );

export class apiMock {

    constructor() { 
        this.nodes = nodes;
    }

    getNodes() {
        return nodes;
    }
}