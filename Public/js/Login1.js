//login request 
document.getElementById("login-container").addEventListener("submit", async (e)=>{
    const username=document.getElementById("username").value; 
    const password=document.getElementById("password").value; 

    try{
        const response = await fetch("/login", {
            method: "POST", 
            header: {"Content-type":"application/json"}, 
            body:JSON.stringify({username,password})
        }); 
    
        if(response.ok){
            //const data = await response.json
            alert("login is sucessfull")
        }
        else{
            alert("login failed -Please check username or password")
        }
    
    }catch(error){
        alert("An error has occured")
    }
    
    }); 
