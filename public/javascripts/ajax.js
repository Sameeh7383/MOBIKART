function addToCart(proId){
	$.ajax({
		url:'/add-to-cart/'+proId,
		method:'get',
		success:(response)=>{
            if(response.status==true){
				let count=$('#cart-count').html()
				console.log(count)
				if (count==""){
					count=0
				}
                
                count=parseInt(count)+1
                $('#cart-count').html(count)
				

            }
			else{
				alert("Insufficient Quantity")

			}
			// alert(response)
		}
	})}
	function changeQuantity(cartId,productId,userId,count){
		let quantity=parseInt(document.getElementById(productId).innerHTML)
		count=parseInt(count)
		$.ajax({
			url:'/change-cart-quantity',
			data:{
				cart:cartId,
				product:productId,
				count:count,
				quantity:quantity,
				user:userId
			},
			method:"post",
			success:(response)=>{
				if(response.removeProduct){
					alert("The product has been removed")
					location.reload()
				}else if (response.productOver){
					alert('Warning!! Insufficient Stock')}
				else{
	
					document.getElementById(productId).innerHTML=quantity+count
					document.getElementById('total-cost').innerHTML=response.total+" Rs"
				}
			}
		})
	}
	
	function deleteProduct(cartId,productId){
		$.ajax({
			url:'/delete-cart-quantity',
			data:{
				cart:cartId,
				product:productId,
				
			},
			method:"post",
			success:(response)=>{
					alert("The product has been removed")
					location.reload()
					
				}
			}
		)
	}
	function validateFname() {

		var name = document.getElementById('inputFirstName').value;
		
		if(name.length == 0) {
		
		  producePrompt('Please fill the field', 'fname-error' , 'red')
		  return false;
		
		}
		if (!name.match( /^[a-zA-Z\s]+$/)) {
		
		  producePrompt('Please enter a valid name','fname-error', 'red');
		  return false;
		
		}
		if (name.length<=2) {
		
		  producePrompt('Please enter a valid name','fname-error', 'red');
		  return false;
		
		}
		
		producePrompt('', 'fname-error', 'green');
		return true;
		
		}
		function validateLname() {
		
		var name = document.getElementById('inputLastName').value;
		
		if(name.length == 0) {
		
		  producePrompt('Please fill the field', 'lname-error' , 'red')
		  return false;
		
		}
		if (!name.match( /^[a-zA-Z\s]+$/)) {
		
		  producePrompt('Please enter a valid name','lname-error', 'red');
		  return false;
		
		}
		
		
		producePrompt('', 'lname-error', 'green');
		return true;
		
		}
		
		
		function validatePassword() {
		
		var name = document.getElementById('inputPassword').value;
		
		if(name.length == 0) {
		
		producePrompt('Please Enter Your Password', 'password-error' , 'red')
		return false;
		
		}
		else if(name.length<=2) {
		
		producePrompt('Password should contain minimum 3 charecters', 'password-error' , 'red')
		return false;
		
		}
		else{
		producePrompt('', 'password-error', 'green');
		return true;
		
		}
			}
			
		function validateCpassword() {
		var pass=document.getElementById('inputPassword').value;
		var cpass = document.getElementById('inputCpassword').value;
		
		
		if(cpass.length == 0) {
		
		producePrompt('Please Confirm Your Password', 'cpassword-error' , 'red')
		return false;
		
		}
		else if(pass!=cpass) {
		
		producePrompt('Password is not matching', 'cpassword-error' , 'red')
		return false;
		
		}
		else{
		producePrompt('Matched', 'cpassword-error', 'green');
		return true;
		
		}
			}
			function validatePhone() {

				var phone = document.getElementById('contact-phone').value;
				
				  if(phone.length == 0) {
					producePrompt('Please Enter Your Phone Number', 'phone-error', 'red');
					return false;
				  }
				
				  
				
				  if(!phone.match(/^[0-9]{10}$/)) {
					producePrompt('Please Enter A Valid Phone Number' ,'phone-error', 'red');
					return false;
				  }
				
				  producePrompt('', 'phone-error', 'green');
				  return true;
				
				}
		function validateEmail () {
		
		var email = document.getElementById('inputEmailAddress').value;
		
		if(email.length == 0) {
		
		  producePrompt('Please Enter Your Email','email-error', 'red');
		  return false;
		
		}
		
		if(!email.match(/^[A-Za-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/)) {
		
		  producePrompt('Please Enter A valid Email Id', 'email-error', 'red');
		  return false;
		
		}
		
		producePrompt('', 'email-error', 'green');
		return true;
		
		}
		
		
		
		function validateForm() {
		if (!validateFname() || !validatePhone() || !validateEmail()||!validatePassword||!validateCpassword||!validateLname()) {
		  jsShow('submit-error');
		  producePrompt('PLEASE ENTER THE FORM PROPERLY', 'submit-error', 'red');
		  setTimeout(function(){jsHide('submit-error');}, 10000);
		}
		else {
		
		}
		}
		
		function jsShow(id) {
		document.getElementById(id).style.display = 'block';
		}
		
		function jsHide(id) {
		document.getElementById(id).style.display = 'none';
		}
		
		
		
		
		
		function producePrompt(message, promptLocation, color) {
		
		document.getElementById(promptLocation).innerHTML = message;
		document.getElementById(promptLocation).style.color = color;
		
		}

	
		// PREVENT DEFAULT

		// document.signupform.addEventListener("submit", function (event) {

		// 	// var user = this.querySelector("input[id=signup-username]").value;
		// 	var pass = this.querySelector("input[id=inputPassword]").value;
		// 	var pass2 = this.querySelector("input[id=inputCpassword]").value;
		
		// 	var regx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		
		
		// 	// if (user.trim() == "" || !user.match(regx)) {
		// 	//   document.getElementById("signup-username").focus();
		// 	//   event.preventDefault();
		// 	// } else
		// 	 if (pass.trim() == "" || pass.length < 5) {
		// 	  document.getElementById("inputPassword").focus();
		// 	  event.preventDefault();
		// 	} else if (pass.trim() != pass2.trim()) {
		// 	  document.getElementById("inputCpassword").focus();
		// 	  event.preventDefault();
		
		// 	}
		//   });
		function showBrand(){
			let cat= document.getElementById("category").value
					
					if(cat!="blank"){
						$.ajax({
							url:"admin/getBrand",
							data:{
								
								category:cat,
							},method:"post",
							success:(response)=>{ 
								alert('ajax success')
								
			
			
							}
					})
				}
				}
		