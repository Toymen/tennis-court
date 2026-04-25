<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

startAppSession();
$_SESSION = [];
session_destroy();

jsonResponse(['ok' => true]);
