<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$payload = requestJson();
$username = trim((string) ($payload['username'] ?? ''));
$password = (string) ($payload['password'] ?? '');

if ($username === '' || $password === '') {
    jsonResponse(['error' => 'Benutzername und Passwort werden benoetigt.'], 400);
}

$statement = db()->prepare('SELECT id, username, password_hash FROM admins WHERE username = :username LIMIT 1');
$statement->execute(['username' => $username]);
$admin = $statement->fetch();

if (!is_array($admin) || !password_verify($password, (string) $admin['password_hash'])) {
    jsonResponse(['error' => 'Login fehlgeschlagen.'], 401);
}

startAppSession();
session_regenerate_id(true);
$_SESSION['admin_id'] = (int) $admin['id'];
$_SESSION['admin_username'] = (string) $admin['username'];

jsonResponse([
    'authenticated' => true,
    'username' => (string) $admin['username'],
]);
