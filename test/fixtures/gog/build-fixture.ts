import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const fixtureDir = path.join(import.meta.dirname)
const fixturePath = path.join(fixtureDir, 'galaxy-2.0.db')

mkdirSync(fixtureDir, { recursive: true })

const db = new DatabaseSync(fixturePath)
db.exec(`
DROP TABLE IF EXISTS PlayTasks;
DROP TABLE IF EXISTS GameTimes;
DROP TABLE IF EXISTS ProductPurchaseDates;
DROP TABLE IF EXISTS GamePieces;
DROP TABLE IF EXISTS GamePieceTypes;

CREATE TABLE GamePieceTypes (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL
);

CREATE TABLE GamePieces (
  releaseKey TEXT NOT NULL,
  gamePieceTypeId INTEGER NOT NULL,
  value TEXT
);

CREATE TABLE ProductPurchaseDates (
  gameReleaseKey TEXT NOT NULL
);

CREATE TABLE GameTimes (
  releaseKey TEXT NOT NULL,
  minutesInGame REAL
);

CREATE TABLE PlayTasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gameReleaseKey TEXT NOT NULL
);

INSERT INTO GamePieceTypes (id, type) VALUES
  (10, 'originalTitle'),
  (23, 'title'),
  (90, 'originalImages'),
  (89, 'media');

INSERT INTO ProductPurchaseDates (gameReleaseKey) VALUES
  ('gog_1207658924'),
  ('gog_1495134320'),
  ('steam_570');

INSERT INTO GamePieces (releaseKey, gamePieceTypeId, value) VALUES
  ('gog_1207658924', 10, '{"title":"The Witcher 3: Wild Hunt"}'),
  ('gog_1207658924', 23, '{"title":"The Witcher 3: Wild Hunt"}'),
  ('gog_1207658924', 90, '{"verticalCover":"https://example.com/witcher3.jpg"}'),
  ('gog_1495134320', 10, '{"title":"Cyberpunk 2077"}'),
  ('gog_1495134320', 23, '{"title":null}'),
  ('gog_1495134320', 89, '{"artworks":["https://images.gog.com/hash{formatter}.{ext}?namespace=gamesdb"]}'),
  ('steam_570', 10, '{"title":"Dota 2"}');

INSERT INTO GameTimes (releaseKey, minutesInGame) VALUES
  ('gog_1207658924', 183.4),
  ('gog_1495134320', 42);

INSERT INTO PlayTasks (gameReleaseKey) VALUES
  ('gog_1207658924');
`)

db.close()
console.log(`Wrote ${fixturePath}`)
