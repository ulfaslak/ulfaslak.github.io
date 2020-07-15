function copyToClipboard(value, type) {
	var input = document.createElement('input');
	input.setAttribute('value', value);
	document.body.appendChild(input);
	input.select();
	document.execCommand('copy');
	document.body.removeChild(input)
	swal({
	  	text: type + " copied to clipboard!",
	  	timer: 1500,
	  	class: "swal-modal",
	  	buttons: false
	});
}

function copyToClipboardMobile(value, type) {
	var input = document.createElement('input');
	input.setAttribute('value', value);
	document.body.appendChild(input);
	input.select();
	document.execCommand('copy');
	document.body.removeChild(input)
	alert(type + " copied to clipboard!")
}