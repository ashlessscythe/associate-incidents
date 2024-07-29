-- CreateTable
CREATE TABLE "Associate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "associateId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "isVerbal" BOOLEAN NOT NULL,
    FOREIGN KEY ("associateId") REFERENCES "Associate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Insert sample data
INSERT INTO "Associate" ("id", "name") VALUES 
('1', 'John Doe'),
('2', 'Jane Smith'),
('3', 'Bob Johnson');

INSERT INTO "Incident" ("id", "associateId", "type", "description", "date", "isVerbal") VALUES 
('1', '1', 'D1', 'Late to work', '2023-01-15T09:00:00Z', true),
('2', '1', 'D2', 'Missed deadline', '2023-02-20T14:30:00Z', false),
('3', '2', 'D1', 'Inappropriate behavior', '2023-03-10T11:15:00Z', true),
('4', '3', 'D3', 'Safety violation', '2023-04-05T16:45:00Z', false);