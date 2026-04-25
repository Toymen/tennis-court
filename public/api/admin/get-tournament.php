<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAdmin();

$slug = sanitizeSlug((string) ($_GET['slug'] ?? 'clubabend'));
$row = fetchTournament(db(), $slug, false);

if ($row === null) {
    jsonResponse(['error' => 'Turnier nicht gefunden.'], 404);
}

jsonResponse(tournamentPayload($row));
