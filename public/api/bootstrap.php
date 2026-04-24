<?php
declare(strict_types=1);

$configFile = __DIR__ . '/private/config.php';

header('Content-Type: application/json; charset=utf-8');

if (!is_file($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server-Konfiguration fehlt.']);
    exit;
}

$appConfig = require $configFile;

if (!is_array($appConfig)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server-Konfiguration ist ungueltig.']);
    exit;
}

require_once __DIR__ . '/db.php';

function appConfig(): array
{
    global $appConfig;
    return $appConfig;
}

function jsonResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requestJson(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        jsonResponse(['error' => 'Ungueltige JSON-Nutzlast.'], 400);
    }

    return $decoded;
}

function startAppSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $config = appConfig();
    session_name((string) ($config['session_name'] ?? 'tennis_admin'));
    session_set_cookie_params([
        'httponly' => true,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Lax',
        'path' => '/',
    ]);
    session_start();
}

function currentAdminId(): ?int
{
    startAppSession();
    $adminId = $_SESSION['admin_id'] ?? null;
    return is_int($adminId) ? $adminId : null;
}

function currentAdminUsername(): ?string
{
    startAppSession();
    $username = $_SESSION['admin_username'] ?? null;
    return is_string($username) && $username !== '' ? $username : null;
}

function requireAdmin(): array
{
    $adminId = currentAdminId();
    $username = currentAdminUsername();

    if ($adminId === null || $username === null) {
        jsonResponse(['error' => 'Nicht angemeldet.'], 401);
    }

    return ['id' => $adminId, 'username' => $username];
}

function sanitizeSlug(string $slug): string
{
    $sanitized = strtolower(trim($slug));
    $sanitized = preg_replace('/[^a-z0-9-]+/', '-', $sanitized ?? '') ?? '';
    $sanitized = trim($sanitized, '-');

    if ($sanitized === '') {
        jsonResponse(['error' => 'Ungueltiger Turnier-Slug.'], 400);
    }

    return $sanitized;
}

function fetchTournament(PDO $pdo, string $slug, bool $publicOnly): ?array
{
    $sql = 'SELECT slug, title, state_json, is_public, updated_at FROM tournaments WHERE slug = :slug';
    if ($publicOnly) {
        $sql .= ' AND is_public = 1';
    }

    $statement = $pdo->prepare($sql);
    $statement->execute(['slug' => $slug]);
    $row = $statement->fetch();

    return is_array($row) ? $row : null;
}

function tournamentPayload(array $row): array
{
    $decoded = json_decode((string) $row['state_json'], true);
    if (!is_array($decoded)) {
        $decoded = [];
    }

    return [
        'slug' => (string) $row['slug'],
        'title' => (string) $row['title'],
        'updatedAt' => $row['updated_at'] ? (string) $row['updated_at'] : null,
        'state' => $decoded,
    ];
}
