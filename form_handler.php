<?php
$to      = 'ulfjensen@gmail.com';
$subject = 'Computational Analysis of Big Data feedback';
$message = $_POST['textarea'];
$headers = 'From: webmaster@qixty.com' . "\r\n" .
'Reply-To: contact@qixty.com' . "\r\n" .
'X-Mailer: PHP/' . phpversion();

$send = mail($to, $subject, $message, $headers);

// this will help you to get the status mail sent or not
if($send) :
   echo "Email sent";
else :
    echo "Email sending failed";
endif;
?>