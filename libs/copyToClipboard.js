function copyToClipboard() {
	var input = document.createElement('input');
	input.setAttribute('value', "ulfaslak@gmail.com");
	document.body.appendChild(input);
	input.select();
	document.execCommand('copy');
	document.body.removeChild(input)
	swal({
	  	text: "Email copied to clipboard!",
	  	timer: 1000,
	  	class: "swal-modal",
	  	buttons: false
	});
}