<?php
/* =========================================================================
   Expert Reinigung – Anfrageformular der Landingpage Baureinigung
   Nimmt die Anfrage aus app.js (JSON) an und schickt sie per Mail an
   info@expert-reinigung.de. Läuft auf jedem Webspace mit PHP.
   Keine Agentur, kein fremder Server.
   ========================================================================= */

$EMPFAENGER = 'info@expert-reinigung.de';
$ABSENDER   = 'anfrage@expert-reinigung.de';   // Absender-Adresse auf der eigenen Domain
$BETREFF    = 'Neue Anfrage Baureinigung (Landingpage)';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false]);
  exit;
}

$roh = file_get_contents('php://input');
if (strlen($roh) > 20000) { http_response_code(413); echo json_encode(['ok' => false]); exit; }
$d = json_decode($roh, true);
if (!is_array($d)) { http_response_code(400); echo json_encode(['ok' => false]); exit; }

function feld($d, $k, $max = 500) {
  $v = isset($d[$k]) ? trim((string)$d[$k]) : '';
  $v = str_replace(["\r", "\0"], '', $v);
  return mb_substr($v, 0, $max);
}

/* Spam-Falle: unsichtbares Feld ausgefüllt -> still verwerfen */
if (feld($d, 'website', 200) !== '') { echo json_encode(['ok' => true]); exit; }

$name  = feld($d, 'name', 120);
$mail  = feld($d, 'email', 160);
$tel   = feld($d, 'phone', 60);
$ort   = feld($d, 'ort', 120);
$text  = feld($d, 'message', 4000);

/* Pflichtfelder wie im Formular */
if ($name === '' || $tel === '' || !filter_var($mail, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['ok' => false]);
  exit;
}

$inhalt  = $text . "\n\n";
$inhalt .= "Einwilligung: " . feld($d, 'consent_art', 60) . " (" . feld($d, 'rechtsgrundlage', 60) . ")\n";
$inhalt .= "Hinweistext: " . feld($d, 'consent_text', 600) . "\n";
$inhalt .= "Zeitpunkt: " . feld($d, 'consent_ts', 40) . "\n";

$kopf  = "From: Expert Reinigung Website <" . $ABSENDER . ">\r\n";
$kopf .= "Reply-To: " . str_replace(["\n", "\r"], '', $name) . " <" . $mail . ">\r\n";
$kopf .= "Content-Type: text/plain; charset=UTF-8\r\n";

$ok = mail($EMPFAENGER, '=?UTF-8?B?' . base64_encode($BETREFF) . '?=', $inhalt, $kopf, '-f' . $ABSENDER);

if (!$ok) { http_response_code(500); echo json_encode(['ok' => false]); exit; }
echo json_encode(['ok' => true]);
