// some scripts

// jquery ready start
$(document).ready(function() {
	// jQuery code


    /* ///////////////////////////////////////

    THESE FOLLOWING SCRIPTS ONLY FOR BASIC USAGE, 
    For sliders, interactions and other

    */ ///////////////////////////////////////
    

	//////////////////////// Prevent closing from click inside dropdown
    $(document).on('click', '.dropdown-menu', function (e) {
      e.stopPropagation();
    });


    $('.js-check :radio').change(function () {
        var check_attr_name = $(this).attr('name');
        if ($(this).is(':checked')) {
            $('input[name='+ check_attr_name +']').closest('.js-check').removeClass('active');
            $(this).closest('.js-check').addClass('active');
           // item.find('.radio').find('span').text('Add');

        } else {
            item.removeClass('active');
            // item.find('.radio').find('span').text('Unselect');
        }
    });


    $('.js-check :checkbox').change(function () {
        var check_attr_name = $(this).attr('name');
        if ($(this).is(':checked')) {
            $(this).closest('.js-check').addClass('active');
           // item.find('.radio').find('span').text('Add');
        } else {
            $(this).closest('.js-check').removeClass('active');
            // item.find('.radio').find('span').text('Unselect');
        }
    });



	//////////////////////// Bootstrap tooltip
	if($('[data-toggle="tooltip"]').length>0) {  // check if element exists
		$('[data-toggle="tooltip"]').tooltip()
	} // end if




    
}); 
// jquery end

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