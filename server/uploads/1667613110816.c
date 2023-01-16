#include <stdio.h>

//structures are compound data type. Can package a bunch of variables together
  //like objects in java but without methods
  //we are basically creating our own type. a struct of type clock

  struct clock{
    int hours;
    int minutes;
  };


struct clock incrementTime(struct clock now, int hours, int minutes);

int main (void){

  

  struct clock now = {16, 50};
  struct clock later = {.hours = 5}; //allows you to only set one of the two variables
  later.minutes = 127;

  printf("%d:%0.2d", later.hours, later.minutes); //0.2 just makes sure that if the number placed after that is only one digit, the tens place gets a 0 in front of the single digit. 2 places minimum

  

  
  
}

struct clock incrementTime(struct clock now, int hours, int minutes){

  //treat it as a 24 hour clock
  int extraHours = minutes/60;
  now.hours = now.hours + extraHours;

  if(now.hours > 24){
    now.hours = now.hours - 24;
  }
  now.minutes = minutes % 60;

  return now; //copy of struct was passed tp the function, so we re-assign the returned struct through this function call where this function was called
}