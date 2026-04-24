<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$admin = requireAdmin();
$payload = requestJson();
$slug = sanitizeSlug((string) ($payload['slug'] ?? 'clubabend'));
$title = trim((string) ($payload['title'] ?? 'Tennis Clubabend'));
$state = $payload['state'] ?? null;

if ($title === '') {
    jsonResponse(['error' => 'Titel darf nicht leer sein.'], 400);
}

if (!is_array($state)) {
    jsonResponse(['error' => 'Turnierdaten fehlen.'], 400);
}

$stateJson = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($stateJson === false) {
    jsonResponse(['error' => 'Turnierdaten konnten nicht gespeichert werden.'], 400);
}

$pdo = db();
$statement = $pdo->prepare(
    'INSERT INTO tournaments (slug, title, state_json, is_public, updated_by)
     VALUES (:slug, :title, :state_json, 1, :updated_by)
     ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       state_json = VALUES(state_json),
       is_public = VALUES(is_public),
       updated_by = VALUES(updated_by),
       updated_at = CURRENT_TIMESTAMP'
);

$statement->execute([
    'slug' => $slug,
    'title' => $title,
    'state_json' => $stateJson,
    'updated_by' => $admin['id'],
]);

$row = fetchTournament($pdo, $slug, false);

if ($row === null) {
    jsonResponse(['error' => 'Turnier konnte nach dem Speichern nicht geladen werden.'], 500);
}

jsonResponse(tournamentPayload($row));
