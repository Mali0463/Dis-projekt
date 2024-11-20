//There needs to be made a function so the user can login in 
//when logged in hte uder will be moved on to the chatbot 
//implementaion of hashing and kryptating the passwords 

//Accessing the login buttton 
var loginUser=document.getElementById("login-user");
//Applying on click event listener
loginUser.addEventListener("click",  function (){
    //acessing the login inputs values 
    var email = document.getElementById("email").value; 
    var password = document.getElementById("password").value; 

    //if the user does not enter Email 
    if(email === "" || password === ""){
        alert("Felterne er ikke korrekt opfyldt"); //alert is used to show the message in the html 
    } 

    //retriving email from localstorage 
    var y =localStorage.getItem("bruger");
   
    var z=JSON.parse(y);//used to divide the JSON-data into compenents 
   
    console.log(z.Email);

    console.log(z.Password);
    //var data = JSON.parse(bruger); 
  
    //If email and passwords macth the saved values, the user will be logged in sucessfully 
    if (email === z.Email && password === z.Password){
        alert("Bruger er logget ind");
        window.location.href = "Klienten.html";//if the email and passwords are correct then it will redirect to the main site
    }else if(email != z.Email){ //using an else-if statment to costumzing our else part and identify if the emial or password are incorrect
        alert("E-mail eksisterer ikke"); 
    }else{
        alert("Forkert Password"); 
    }
    return;
});