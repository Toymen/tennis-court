<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$slug = sanitizeSlug((string) ($_GET['slug'] ?? 'clubabend'));
$row = fetchTournament(db(), $slug, true);

if ($row === null) {
    jsonResponse(['error' => 'Turnier nicht gefunden.'], 404);
}

jsonResponse(tournamentPayload($row));
