<?php
$name = $_POST['name'];
$email = $_POST['email'];
$message = $_POST['message'];
$formcontent=" From: $name \n  Message: $message";
$recipient = "russom@russomwoldezghi.info";
$subject = "Message form: $name";
$mailheader = "From: $email \r\n";
mail($recipient, $subject, $formcontent, $mailheader) or die("Error!");
echo "Thank you! Your message was recieved";
?>
