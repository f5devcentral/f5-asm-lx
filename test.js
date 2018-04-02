function passInFunc() {
   console.log("in myfunc");
   return 4;
}
var f = function(passInFunc(p)) {
  console.log(p);
}

f()
